import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage-mongo";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { validationSchemas, ROLES } from './config';
import logger from './logger';

// Request autenticado
export type AuthenticatedRequest = Request & {
  user: any;
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
    interface User {
      id: string;
      email: string;
      name: string;
      role: string;
    }
  }
  
  var pendingPixPayments: {
    [key: string]: {
      status: string;
      createdAt: Date;
    };
  } | undefined;
}

// Cache implementation
const userCache = new Map<string, {
  user: any;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum number of users to cache

function getCachedUser(id: string): any | null {
  const cached = userCache.get(id);
  if (!cached) return null;
  
  // Check if cache entry is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    userCache.delete(id);
    return null;
  }
  
  return cached.user;
}

function cacheUser(user: any) {
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

// Função para criar hash da senha usando bcryptjs
export async function hashPassword(password: string): Promise<string> {
  try {
    await validationSchemas.password.parseAsync(password);
    return await bcrypt.hash(password, 10);
  } catch (error) {
    throw new Error('Password does not meet security requirements');
  }
}

// Função para verificar a senha usando bcryptjs
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('[Auth] Erro ao verificar senha:', error);
    return false;
  }
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
      console.log('[LocalStrategy] Tentando autenticar usuário:', { email });
      
      const user = await storage.findUserByEmail(email);
      
      if (!user) {
        console.log('[LocalStrategy] Usuário não encontrado:', { email });
        return done(null, false, { message: 'Invalid email or password' });
      }

      console.log('[LocalStrategy] Usuário encontrado, verificando senha');
      const isValid = await verifyPassword(user.password, password);
      
      if (!isValid) {
        console.log('[LocalStrategy] Senha inválida para usuário:', { email });
        return done(null, false, { message: 'Invalid email or password' });
      }

      console.log('[LocalStrategy] Usuário autenticado com sucesso:', { id: user.id, email: user.email });
      // Cache user data
      userCache.set(user.id, {
        user,
        timestamp: Date.now()
      });
      return done(null, user as any);
    } catch (error) {
      console.error('[LocalStrategy] Erro durante autenticação:', error);
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

      const user = await storage.findUserById(jwtPayload.id);

      if (!user) {
        return done(null, false);
      }

      // Cache user data
      userCache.set(user.id, {
        user,
        timestamp: Date.now()
      });
      return done(null, user as any);
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user
  passport.serializeUser((user: any, done) => {
    console.log('[Passport] Serializando usuário:', { id: user.id, email: user.email });
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('[Passport] Deserializando usuário:', { id });
      
      // Check cache first
      const cached = userCache.get(id);
      if (cached) {
        console.log('[Passport] Usuário encontrado no cache');
        return done(null, cached.user);
      }

      const user = await storage.findUserById(id);

      if (!user) {
        console.log('[Passport] Usuário não encontrado no banco de dados');
        return done(null, false);
      }

      console.log('[Passport] Usuário encontrado no banco de dados');
      // Cache user data
      userCache.set(id, {
        user,
        timestamp: Date.now()
      });
      return done(null, user);
    } catch (error) {
      console.error('[Passport] Erro ao deserializar usuário:', error);
      return done(error);
    }
  });

  // Login route
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      console.log('[Login] Tentativa de login:', { email: req.body.email });
      
      req.login(req.body, (err) => {
        if (err) {
          console.error('[Login] Erro no login:', err);
          return res.status(500).json({ error: 'Login failed' });
        }
        
        console.log('[Login] Login bem-sucedido');
        res.json({ 
          message: 'Login successful',
          user: req.user
        });
      });
    } catch (error) {
      console.error('[Login] Erro no login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    try {
      req.logout((err) => {
        if (err) {
          console.error('[Logout] Erro no logout:', err);
          return res.status(500).json({ error: 'Logout failed' });
        }
        
        console.log('[Logout] Logout bem-sucedido');
        res.json({ message: 'Logout successful' });
      });
    } catch (error) {
      console.error('[Logout] Erro no logout:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Check authentication status
  app.get('/api/auth/status', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      res.json({ 
        authenticated: true, 
        user: req.user 
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
}
