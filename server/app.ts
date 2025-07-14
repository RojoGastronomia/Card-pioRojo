import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import { rateLimiter, requireRole, validateInput, errorHandler, requestLogger, sanitizeInput } from './middleware';
// import { monitoring, trackResponseTime } from './monitoring';
import { cache } from './cache';
import { ROLES } from './config';
import path from 'path';

const app = express();

// CORS must come first
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  maxAge: 86400,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Expires', 'Content-Length']
}));

// Basic middleware with increased limits
app.use(express.json({ limit: '100mb' })); // Aumentado para 100MB
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // Aumentado para 100MB

// Static files middleware for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security middleware
// app.use(rateLimiter); // Temporariamente desabilitado
// app.use(sanitizeInput); // Temporariamente desabilitado

// Monitoring middleware
app.use(requestLogger);
// app.use(trackResponseTime);

// Increase header size limit
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware global para garantir headers CORS em todas as rotas
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Expires');
  next();
});

// Rota global para responder preflight OPTIONS
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Expires');
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  // const systemMetrics = await monitoring.getSystemMetrics();
  // const dbMetrics = await monitoring.getDatabaseMetrics();
  
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    // system: systemMetrics,
    // database: dbMetrics,
  });
});

// Metrics endpoint (protected by admin role)
app.get('/metrics', requireRole(ROLES.ADMIN), async (req: Request, res: Response) => {
  // const apiMetrics = monitoring.getApiMetrics();
  // const systemMetrics = await monitoring.getSystemMetrics();
  // const dbMetrics = await monitoring.getDatabaseMetrics();
  
  res.json({
    // api: apiMetrics,
    // system: systemMetrics,
    // database: dbMetrics,
    cache: {
      // stats: cache.getStats(), // Removido temporariamente
    },
  });
});

// Register routes
registerRoutes(app);

// Error handling
app.use(errorHandler);

export default app; 