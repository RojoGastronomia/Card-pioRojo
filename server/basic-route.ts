import { Express, Request, Response } from "express";
import { getBasicStats } from "./basic-stats";
import { storage } from "./storage";

/**
 * Registra a rota de estatísticas básicas na aplicação Express
 */
export function registerBasicStatsRoute(app: Express) {
  app.get("/api/basic-stats", async (req: Request, res: Response) => {
    // Registrar hora exata da requisição
    const requestTime = new Date();
    console.log(`[API] GET /api/basic-stats - Request received at ${requestTime.toISOString()}`);
    console.log(`[API] Query params:`, req.query);
    console.log(`[API] Query timestamp: ${req.query.ts || 'none'}`);
    
    try {
      // Configurar headers para prevenir cache em todos os níveis
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-Request-Time', requestTime.toISOString());
      
      // Gerar ID único para esta resposta
      const responseId = Math.random().toString(36).substring(2, 15);
      
      // Obter estatísticas com tempo de execução
      console.log(`[API] Iniciando busca de estatísticas - ID: ${responseId}`);
      const startTime = Date.now();
      const stats = await getBasicStats();
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Log de diagnóstico com timestamp
      console.log(`[API] Estatísticas geradas em ${executionTime}ms - ID: ${responseId}`);
      console.log(`[API] Dashboard stats: eventos=${stats.totalEvents}, usuários=${stats.totalUsers}, pedidos mês=${stats.totalOrders}, receita=${stats.totalRevenue}`);
      
      // Log de eventos encontrados
      if (stats.recentEvents && stats.recentEvents.length > 0) {
        console.log(`[API] Eventos encontrados para exibição: ${stats.recentEvents.length}`);
        console.log(`[API] Exemplo de evento #1: ID=${stats.recentEvents[0].id}, Título=${stats.recentEvents[0].title}, Status=${stats.recentEvents[0].status}`);
        if (stats.recentEvents.length > 1) {
          console.log(`[API] Exemplo de evento #2: ID=${stats.recentEvents[1].id}, Título=${stats.recentEvents[1].title}, Status=${stats.recentEvents[1].status}`);
        }
      } else {
        console.log(`[API] Alerta: Nenhum evento encontrado para exibição no dashboard`);
      }
      
      // Enriquecer resultado com metadados de diagnóstico
      const resultWithMetadata = {
        ...stats,
        meta: {
          requestTime: requestTime.toISOString(),
          responseTime: new Date().toISOString(),
          executionTimeMs: executionTime,
          responseId: responseId,
          cacheStatus: 'BYPASSED',
          clientQuery: req.query,
          eventsFound: stats.recentEvents ? stats.recentEvents.length : 0
        }
      };
      
      console.log(`[API] Enviando resposta com ID: ${responseId}`);
      res.json(resultWithMetadata);
    } catch (error) {
      console.error(`[API] Erro ao buscar dados básicos:`, error);
      
      // Configurar headers mesmo para erros
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.status(500).json({ 
        message: "Erro ao buscar dados básicos", 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        requestTime: requestTime.toISOString()
      });
    }
  });
} 