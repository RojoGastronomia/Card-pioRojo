import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      isAuthenticated(): boolean;
      login(user: any, callback: (err?: any) => void): void;
      logout(callback: (err?: any) => void): void;
      sessionID?: string;
    }
  }
}

export {}; 