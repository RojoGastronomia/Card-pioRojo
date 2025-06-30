import { Request, Response } from 'express';
import { getBasicStats } from './basic-stats';
import logger from './logger';
import { EventEmitter } from 'events';
import { Express } from 'express';

// Criar um singleton para o emitter de eventos
const dataChangeEmitter = new EventEmitter();

// Tornar as interfaces públicas para uso em outras partes da aplicação
export interface Client {
  id: string;
  response: Response;
  dateFilter?: { start?: string; end?: string };
}

export class SSEManager {
  private clients: Map<string, Client> = new Map();
  private interval: NodeJS.Timeout | null = null;
  private updateInterval = 30000; // 30 segundos

  constructor() {
    logger.info('SSEManager inicializado');
    this.startUpdateInterval();
    
    // Configurar listener para eventos de mudança de dados
    dataChangeEmitter.on('data-change', () => {
      this.triggerUpdate();
    });
  }

  /**
   * Registra um novo cliente para receber atualizações SSE
   */
  registerClient(req: Request, res: Response): void {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    logger.info({ clientId, totalClients: this.clients.size + 1 }, 'Novo cliente SSE registrado');
    // Salvar filtro de data do cliente
    const { start, end } = req.query;
    this.clients.set(clientId, { id: clientId, response: res, dateFilter: { start: start as string, end: end as string } });
    // Enviar evento inicial para confirmar conexão
    const connectionData = { 
      clientId, 
      timestamp: new Date().toISOString(),
      message: 'Conexão estabelecida com o servidor de eventos'
    };
    this.sendEventToClient(clientId, 'connected', connectionData);
    // Remover cliente quando a conexão for fechada
    req.on('close', () => {
      logger.info({ clientId, remainingClients: this.clients.size - 1 }, 'Cliente SSE desconectado');
      this.clients.delete(clientId);
    });
  }

  /**
   * Envia dados iniciais para um cliente específico
   */
  public async sendInitialData(res: Response): Promise<void> {
    try {
      const stats = await getBasicStats();
      
      const message = `id: ${Date.now()}\nevent: stats-update\ndata: ${JSON.stringify({
        ...stats,
        generatedAt: new Date().toISOString()
      })}\n\n`;
      
      res.write(message);
      
      logger.debug('Dados iniciais enviados para cliente SSE');
    } catch (error) {
      logger.error({ error }, 'Erro ao enviar dados iniciais SSE');
    }
  }

  /**
   * Envia um evento para um cliente específico
   */
  private sendEventToClient(clientId: string, event: string, data: any): void {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;
      
      const message = `id: ${Date.now()}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.response.write(message);
    } catch (error) {
      logger.error({ clientId, error }, 'Erro ao enviar evento para cliente');
      this.clients.delete(clientId);
    }
  }

  /**
   * Inicia o intervalo para enviar atualizações periódicas
   */
  public startUpdateInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(async () => {
      try {
        if (this.clients.size === 0) return;
        logger.info({ clientCount: this.clients.size }, 'Enviando atualizações periódicas');
        // Para cada cliente, enviar dados filtrados
        for (const [clientId, client] of this.clients.entries()) {
          const { start, end } = client.dateFilter || {};
          const stats = await getBasicStats(start, end);
          this.sendEventToClient(clientId, 'stats-update', {
            ...stats,
            generatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error({ error }, 'Erro ao atualizar clientes SSE');
      }
    }, this.updateInterval);
    logger.info({ intervalMs: this.updateInterval }, 'Intervalo de atualização SSE iniciado');
  }

  /**
   * Envia uma atualização para todos os clientes conectados
   */
  public async broadcastUpdate(event: string): Promise<void> {
    if (this.clients.size === 0) return;
    logger.info({ clientCount: this.clients.size, event }, 'Enviando broadcast para todos os clientes');
    for (const [clientId, client] of this.clients.entries()) {
      try {
        const { start, end } = client.dateFilter || {};
        const stats = await getBasicStats(start, end);
        const message = `id: ${Date.now()}\nevent: ${event}\ndata: ${JSON.stringify({
          ...stats,
          generatedAt: new Date().toISOString()
        })}\n\n`;
        client.response.write(message);
      } catch (error) {
        logger.error({ clientId, error }, 'Erro ao enviar mensagem de broadcast');
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Aciona uma atualização imediata dos dados
   */
  public async triggerUpdate(): Promise<void> {
    try {
      if (this.clients.size === 0) return;
      logger.info('Atualizando dados do dashboard em tempo real');
      await this.broadcastUpdate('stats-update');
    } catch (error) {
      logger.error({ error }, 'Erro ao atualizar dados do dashboard');
    }
  }

  /**
   * Desliga o gerenciador SSE
   */
  public shutdown(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Fechar todas as conexões
    this.clients.forEach(client => {
      try {
        client.response.end();
      } catch (error) {
        logger.error({ clientId: client.id, error }, 'Erro ao fechar conexão SSE');
      }
    });

    this.clients.clear();
    logger.info('Gerenciador SSE desligado');
  }
}

// Criar instância única do gerenciador
export const sseManager = new SSEManager();

/**
 * Handler para a rota de atualizações do dashboard
 */
export function dashboardUpdatesHandler(req: Request, res: Response): void {
  // Configurar cabeçalhos para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Expires'
  });
  
  sseManager.registerClient(req, res);
  // Enviar dados iniciais imediatamente, respeitando o filtro de data
  const { start, end } = req.query;
  import('./basic-stats').then(({ getBasicStats }) => {
    getBasicStats(start as string, end as string).then(stats => {
      const message = `id: ${Date.now()}\nevent: stats-update\ndata: ${JSON.stringify({
        ...stats,
        generatedAt: new Date().toISOString()
      })}\n\n`;
      res.write(message);
    });
  });
}

/**
 * Registra a rota SSE no aplicativo Express
 */
export function registerSSERoute(app: Express): void {
  // Rota OPTIONS para preflight requests
  app.options('/api/stats-stream', (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Expires');
    res.status(200).end();
  });

  // Rota principal do SSE
  app.get('/api/stats-stream', dashboardUpdatesHandler);
  logger.info('Rota SSE para dashboard registrada em /api/stats-stream');
}

/**
 * Função para notificar sobre mudanças nos dados
 */
export function notifyDataChange(): void {
  dataChangeEmitter.emit('data-change');
}

/**
 * Função para enviar estatísticas para todos os clientes
 */
export async function broadcastStats(): Promise<void> {
  try {
    await sseManager.broadcastUpdate('stats-update');
  } catch (error) {
    logger.error({ error }, 'Erro ao fazer broadcast das estatísticas');
  }
}

/**
 * Configurar atualizações periódicas dos dados
 */
export function setupPeriodicUpdates(): void {
  sseManager.startUpdateInterval();
}
