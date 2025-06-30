import { Router, Request, Response } from 'express';
import { getBasicStats } from '../services/stats';

const router = Router();

// Esta rota foi removida porque está sendo servida pelo SSE manager
// que já está configurado corretamente para passar os parâmetros de data
// A rota correta está em server/sse.ts

export default router; 