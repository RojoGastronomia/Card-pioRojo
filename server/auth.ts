import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
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
      
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
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
      return done(null, user);
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
    console.log('[Passport] Serializando usuário:', { id: user.id, email: user.email });
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('[Passport] Deserializando usuário:', { id });
      
      // Check cache first
      const cached = userCache.get(id);
      if (cached) {
        console.log('[Passport] Usuário encontrado no cache');
        return done(null, cached.user);
      }

      const [user] = await db.select().from(users).where(eq(users.id, id));

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
      done(null, user);
    } catch (error) {
      console.error('[Passport] Erro ao deserializar usuário:', error);
      done(error);
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Login route
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    console.log('[Login] Tentativa de login recebida:', { email: req.body.email });
    console.log('[Login] Corpo da requisição:', req.body);
    console.log('[Login] Headers:', req.headers);
    
    if (!req.body.email || !req.body.password) {
      console.log('[Login] Dados de login incompletos');
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('[Login] Erro durante autenticação:', err);
        return next(err);
      }
      
      if (!user) {
        console.log('[Login] Usuário não encontrado ou senha inválida');
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      
      console.log('[Login] Usuário autenticado com sucesso:', { id: user.id, email: user.email });
      
      req.login(user, (err: any) => {
        if (err) {
          console.error('[Login] Erro ao fazer login:', err);
          return next(err);
        }
        
        console.log('[Login] Sessão criada com sucesso');
        console.log('[Login] Sessão atual:', req.session);
        
        // Remover a senha do objeto de usuário antes de enviar
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Register route
  app.post("/api/register", async (req, res, next) => {
    console.log('[Register] Tentativa de registro recebida:', { email: req.body.email });
    console.log('[Register] Corpo da requisição:', req.body);
    
    try {
      // Validar dados do usuário
      const userData = insertUserSchema.parse(req.body);
      console.log('[Register] Dados validados:', userData);
      
      // Verificar se já existe algum usuário administrador
      if (userData.role === ADMIN_ROLE) {
        const admins = await storage.getUsersByRole(ADMIN_ROLE);
        if (admins.length > 0 && (!req.user || req.user.role !== ADMIN_ROLE)) {
          console.log('[Register] Tentativa de criar admin sem permissão');
          return res.status(403).json({ 
            error: "Acesso negado",
            message: "Apenas administradores podem criar novas contas de administrador" 
          });
        }
      }

      // Verificar email duplicado
      console.log('[Register] Verificando email duplicado:', userData.email);
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      console.log('[Register] Resultado da verificação de email:', existingUserByEmail);
      
      if (existingUserByEmail) {
        return res.status(400).json({ 
          error: {
            pt: "Email em uso",
            en: "Email already in use"
          },
          message: {
            pt: "Este endereço de e-mail já está cadastrado. Por favor, use outro e-mail ou faça login.",
            en: "This email address is already registered. Please use another email or log in."
          }
        });
      }

      // Verificar username duplicado
      console.log('[Register] Verificando username duplicado:', userData.username, userData.role);
      const existingUserByUsername = await storage.getUserByUsername(userData.username, userData.role);
      console.log('[Register] Resultado da verificação de username:', existingUserByUsername);
      
      if (existingUserByUsername) {
        return res.status(400).json({ 
          error: {
            pt: "Nome de usuário em uso",
            en: "Username already in use"
          },
          message: {
            pt: "Este nome de usuário já está em uso para este tipo de usuário. Por favor, escolha outro nome de usuário.",
            en: "This username is already in use for this user type. Please choose another username."
          }
        });
      }

      // Hash da senha
      try {
        const hashedPassword = await hashPassword(userData.password);
        console.log('[Register] Senha hasheada com sucesso');

        // Criar usuário
        const user = await storage.createUser({
          ...userData,
          password: hashedPassword,
        });

        console.log('[Register] Usuário criado com sucesso:', { id: user.id, email: user.email });

        // Cache do usuário
        cacheUser(user);

            return res.status(201).json({ 
              message: "Usuário criado com sucesso!",
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
              }
            });
      } catch (error) {
        console.error('[Register] Erro ao processar senha:', error);
        return res.status(400).json({ 
          error: "Senha inválida",
          message: "A senha não atende aos requisitos de segurança. Ela deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais." 
        });
      }
    } catch (error) {
      console.error('[Register] Erro de validação:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          message: "Por favor, verifique os dados informados e tente novamente.",
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(500).json({ 
        error: "Erro interno",
        message: "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde." 
      });
    }
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
