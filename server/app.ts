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

console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);

// CORS must come first
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGIN || '').split(',');
    console.log("CORS check:", { origin, allowed });
    
    // Aceitar qualquer domínio da Vercel que contenha "card-pio-rojo" ou "rojo-gastronomia"
    if (!origin || 
        allowed.includes(origin) || 
        origin.includes('card-pio-rojo') || 
        origin.includes('rojo-gastronomia')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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