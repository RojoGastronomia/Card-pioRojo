import { z } from 'zod';

// Rate limiting configuration
export const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};

// Password policy configuration
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Cache configuration
export const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes
  checkPeriod: 60 * 1000, // 1 minute
};

// File upload limits
export const UPLOAD_LIMITS = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
};

// Role hierarchy
export const ROLES = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  LEADER: 'Lider',
  COLLABORATOR: 'Colaborador',
  CLIENT: 'client',
} as const;

// Validation schemas
export const validationSchemas = {
  password: z.string()
    .min(PASSWORD_POLICY.minLength, `Password must be at least ${PASSWORD_POLICY.minLength} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
};

// API response codes
export const API_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_INPUT: 'Invalid input data',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
} as const; 