/// <reference types="vite/client" />

// API configuration
export const API_URL = import.meta.env.VITE_API_URL || '/api';

// Authentication configuration
export const AUTH_COOKIE_NAME = 'connect.sid';

// Application configuration
export const APP_NAME = 'SiteCard';
export const APP_DESCRIPTION = 'Sistema de Gerenciamento de Eventos e Cardápios';

// Routes configuration
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  EVENTS: '/events',
  ADMIN: {
    DASHBOARD: '/admin',
    EVENTS: '/admin/events',
    MENUS: '/admin/menus',
    USERS: '/admin/users',
    ORDERS: '/admin/orders',
  },
  USER: {
    ORDERS: '/orders',
    PROFILE: '/profile',
  },
} as const; 