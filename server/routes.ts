import express, { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { storage } from "./storage-mongo.js";
import { setupAuth, authenticateJWT, AuthenticatedRequest as AuthReq } from "./auth.js";
import { z } from "zod";
import { 
  insertEventSchema, 
  insertDishSchema, 
  insertOrderSchema, 
  insertMenuSchema, 
  InsertUser, 
  User,
  insertVenueSchema,
  insertRoomSchema
} from "shared/schema";
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { spawn } from 'child_process';
import logger from './logger.js';
import { getBasicStats } from "./basic-stats.js";
import { cache } from './cache.js';
import { validateInput, requireRole } from './middleware.js';
import { ROLES } from './config.js';
import { fileURLToPath } from 'url';
import { sendEmail } from './email.js';
import bcrypt from 'bcryptjs';
import { 
  type Event, type InsertEvent,
  type Menu, type InsertMenu, type Dish, type InsertDish,
  users, events, menus, dishes, orders, eventMenus, menuDishes,
  type Venue, type Room, type InsertVenue, type InsertRoom,
  type Category, type InsertCategory, categories
} from "shared/schema";
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constante para o papel de administrador
const ADMIN_ROLE = ROLES.ADMIN;

// Tipo para erros conhecidos
interface KnownError extends Error {
  code?: string;
  errors?: z.ZodIssue[];
}

// Estendendo o tipo importado para adicionar o método isAuthenticated
type AuthenticatedRequest = AuthReq & {
  isAuthenticated(): boolean;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuração do Multer para upload de boletos
  const multerStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadsDir = path.join(__dirname, 'uploads', 'boletos');
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
      } catch (error) {
        cb(error as Error, uploadsDir);
      }
    },
    filename: (req, file, cb) => {
      const orderId = req.params.id;
      const timestamp = Date.now();
      const fileName = `boleto_${orderId}_${timestamp}.pdf`;
      cb(null, fileName);
    }
  });

  const upload = multer({
    storage: multerStorage,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos PDF são permitidos'));
      }
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // Middleware isAdmin com tipos corretos
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    logger.info({
      path: req.path,
      method: req.method,
      auth: {
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user ? {
          id: req.user.id,
          role: req.user.role,
          email: req.user.email
        } : 'undefined'
      },
      headers: {
        cookie: req.headers.cookie ? 'present' : 'missing'
      }
    }, 'Admin middleware check: Details');
    
    // Verificação estendida para debug
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      logger.warn({ ip: req.ip, path: req.path }, 'Admin middleware check: Not authenticated');
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!req.user) {
      logger.warn({ ip: req.ip, path: req.path }, 'Admin middleware check: User object missing');
      return res.status(401).json({ message: "User data unavailable" });
    }
    
    // Verificar com mais tolerância o papel do administrador
    const adminRoles = ['Administrador', 'Admin', 'administrator', 'admin'];
    if (!adminRoles.includes(req.user.role)) {
      logger.warn({ userId: req.user.id, role: req.user.role, ip: req.ip, path: req.path }, 'Admin middleware check: User is not an admin');
      return res.status(403).json({ message: "Not authorized" });
    }
    
    logger.info({ userId: req.user.id, role: req.user.role, path: req.path }, 'Admin middleware check: Authorized admin access');
    next();
  };

  // Rota básica de teste
  app.get("/api/test", (req: Request, res: Response) => {
    res.json({ message: "API funcionando!", timestamp: new Date().toISOString() });
  });

  // Rota de eventos básica
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ error: error.message, stack: error.stack }, "[API] GET /api/events - Error fetching events");
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  // Rota de menus básica
  app.get("/api/menus", async (req: Request, res: Response) => {
    try {
      const menus = await storage.getAllMenus();
      res.json(menus);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ error: error.message, stack: error.stack }, "[API] GET /api/menus - Error fetching menus");
      res.status(500).json({ message: "Error fetching menus" });
    }
  });

  // Rota de pratos básica
  app.get("/api/dishes", async (req: Request, res: Response) => {
    try {
      const dishes = await storage.getAllDishes();
      res.json(dishes);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ error: error.message, stack: error.stack }, "[API] GET /api/dishes - Error fetching dishes");
      res.status(500).json({ message: "Error fetching dishes" });
    }
  });

  // Rota de pedidos básica
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ error: error.message, stack: error.stack }, "[API] GET /api/orders - Error fetching orders");
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  // Rota de usuários básica
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      const error = err as KnownError;
      logger.error({ error: error.message, stack: error.stack }, "[API] GET /api/users - Error fetching users");
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Rota para obter usuário atual
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      console.log("[API] GET /api/user - Request received");
      console.log("[API] Headers:", req.headers);
      console.log("[API] Query params:", req.query);
      
      // Para teste, retornar sempre um usuário padrão
      const defaultUser = {
        id: "1",
        email: "admin@example.com",
        role: "admin",
        name: "Administrador",
        authenticated: true
      };
      
      console.log("[API] Returning default user:", defaultUser);
      res.json(defaultUser);
    } catch (err) {
      const error = err as KnownError;
      console.error("[API] GET /api/user - Error:", error);
      logger.error({ error: error.message, stack: error.stack }, "[API] GET /api/user - Error fetching current user");
      res.status(500).json({ message: "Error fetching current user" });
    }
  });

  // Health check endpoint
  app.get('/health', async (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Error handling
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    }, "Erro não tratado");

    res.status(500).json({
      error: "Erro interno do servidor",
      message: process.env.NODE_ENV === "production" ? "Um erro ocorreu" : err.message,
    });
  });

  return {} as Server; // Retorno temporário
}
