import { Express } from "express";
import { broadcastStats, notifyDataChange } from "./sse";
import { listenForDataChanges } from "./storage-mongo";
import logger from "./logger";

/**
 * Configura os gatilhos para atualização automática dos dados em tempo real
 */
export function setupRealTimeUpdates(app: Express) {
  // Configurar listener para mudanças nos dados
  listenForDataChanges(() => {
    logger.info('Mudança nos dados detectada, enviando atualização para todos os clientes');
    broadcastStats();
  });
  
  // Rota para simular mudanças nos dados (útil para testes)
  app.post("/api/trigger-update", (req, res) => {
    logger.info('Atualização manual solicitada via API');
    notifyDataChange();
    res.json({ 
      success: true, 
      message: "Atualização em tempo real acionada",
      timestamp: new Date().toISOString()
    });
  });
  
  logger.info('Sistema de atualizações em tempo real configurado');
}
