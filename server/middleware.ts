import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT, ROLES, ERROR_MESSAGES, API_CODES } from './config';
import { z } from 'zod';
import { validationSchemas } from './config';

// Rate limiter middleware
export const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.max,
  message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
  standardHeaders: true,
  legacyHeaders: false,
});

// Role-based access control middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(API_CODES.UNAUTHORIZED).json({ message: ERROR_MESSAGES.UNAUTHORIZED });
    }

    const userRole = req.user.role;
    const roleHierarchy = {
      master: 5,
      [ROLES.ADMIN]: 4,
      [ROLES.MANAGER]: 3,
      [ROLES.LEADER]: 2,
      [ROLES.COLLABORATOR]: 1,
      [ROLES.CLIENT]: 0,
    };

    if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
      return next();
    }

    return res.status(API_CODES.FORBIDDEN).json({ message: ERROR_MESSAGES.FORBIDDEN });
  };
};

// Input validation middleware
export const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(API_CODES.BAD_REQUEST).json({
          message: ERROR_MESSAGES.INVALID_INPUT,
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(API_CODES.BAD_REQUEST).json({
      message: ERROR_MESSAGES.INVALID_INPUT,
      errors: err.message,
    });
  }

  return res.status(API_CODES.INTERNAL_ERROR).json({
    message: ERROR_MESSAGES.INTERNAL_ERROR,
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
};

// Sanitize input middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/[<>]/g, '');
      } else {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
}; 