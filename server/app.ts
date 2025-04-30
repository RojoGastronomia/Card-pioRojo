import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors';
import { rateLimiter, requireRole, validateInput, errorHandler, requestLogger, sanitizeInput } from './middleware';
import { monitoring, trackResponseTime } from './monitoring';
import { cache } from './cache';
import { ROLES } from './config';

const app = express();

// Basic middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Security middleware
app.use(rateLimiter);
app.use(sanitizeInput);

// Monitoring middleware
app.use(requestLogger);
app.use(trackResponseTime);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const systemMetrics = await monitoring.getSystemMetrics();
  const dbMetrics = await monitoring.getDatabaseMetrics();
  
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    system: systemMetrics,
    database: dbMetrics,
  });
});

// Metrics endpoint (protected by admin role)
app.get('/metrics', requireRole(ROLES.ADMIN), async (req: Request, res: Response) => {
  const apiMetrics = monitoring.getApiMetrics();
  const systemMetrics = await monitoring.getSystemMetrics();
  const dbMetrics = await monitoring.getDatabaseMetrics();
  
  res.json({
    api: apiMetrics,
    system: systemMetrics,
    database: dbMetrics,
    cache: {
      stats: cache.getStats(),
    },
  });
});

// Register routes
registerRoutes(app);

// Error handling
app.use(errorHandler);

export default app; 