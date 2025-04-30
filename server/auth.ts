import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from './db';
import { users } from 'shared/schema';
import { eq } from 'drizzle-orm';
import { validationSchemas, ROLES } from './config';
import { cache } from './cache';
import logger from './logger';

// Request autenticado - definido como tipo em vez de interface para evitar conflitos de tipagem
export type AuthenticatedRequest = Request & {
  user: SelectUser;
};

// Middleware para garantir que o usuário está autenticado
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.isAuthenticated()) {
    console.log('[Auth] User not authenticated, returning 401');
    return res.status(401).json({
      error: "Not authenticated",
    });
  }
  next();
};

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Cache implementation
const userCache = new Map<number, {
  user: SelectUser;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum number of users to cache

function getCachedUser(id: number): SelectUser | null {
  const cached = userCache.get(id);
  if (!cached) return null;
  
  // Check if cache entry is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    userCache.delete(id);
    return null;
  }
  
  return cached.user;
}

function cacheUser(user: SelectUser) {
  // Clear old entries if cache is too large
  if (userCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = Array.from(userCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
    userCache.delete(oldestKey);
  }
  
  userCache.set(user.id, {
    user,
    timestamp: Date.now()
  });
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  try {
    await validationSchemas.password.parseAsync(password);
    
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
  } catch (error) {
    throw new Error('Password does not meet security requirements');
  }
}

async function verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
  const [hashedPassword, salt] = storedPassword.split('.');
  const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
  return buf.toString('hex') === hashedPassword;
}

// Constante para o papel de administrador
const ADMIN_ROLE = "Administrador";

export function setupAuth(app: Express) {
  // Local Strategy
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));

      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isValid = await verifyPassword(user.password, password);
      if (!isValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Cache user data
      userCache.set(user.id, user);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // JWT Strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
  }, async (jwtPayload, done) => {
    try {
      // Check cache first
      const cachedUser = userCache.get(jwtPayload.id);
      if (cachedUser) {
        return done(null, cachedUser);
      }

      const [user] = await db.select().from(users).where(eq(users.id, jwtPayload.id));

      if (!user) {
        return done(null, false);
      }

      // Cache user data
      userCache.set(user.id, user);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Check cache first
      const cachedUser = userCache.get(id);
      if (cachedUser) {
        return done(null, cachedUser);
      }

      const [user] = await db.select().from(users).where(eq(users.id, id));

      if (!user) {
        return done(null, false);
      }

      // Cache user data
      userCache.set(user.id, user);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  app.post("/api/register", async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Verificar se já existe algum usuário administrador
      if (userData.role === ADMIN_ROLE) {
        const admins = await storage.getUsersByRole(ADMIN_ROLE);
        if (admins.length > 0 && (!req.user || req.user.role !== ADMIN_ROLE)) {
          return res.status(403).json({ message: "Only administrators can create new administrator accounts" });
        }
      }

      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      // Cache the newly registered user
      cacheUser(user);

      // Only log in if it's a regular user registration, not admin creating a user
      if (!req.user || req.user.role !== "Administrador") {
        req.login(user, (err: any) => {
          if (err) return next(err);
          res.status(201).json(user);
        });
      } else {
        res.status(201).json(user);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: fromZodError(error).message 
        });
      }
      next(error);
    }
  });

  // Login route
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      
      req.login(user, (err: any) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      // Remove user from cache on logout
      userCache.delete(req.user.id);
    }
    
    req.logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
