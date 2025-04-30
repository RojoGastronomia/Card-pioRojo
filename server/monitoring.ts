import { performance } from 'perf_hooks';
import os from 'os';
import { db } from './db';
import logger from './logger';

class MonitoringService {
  private metrics: Map<string, number[]>;
  private startTime: number;

  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  // Track API response time
  trackResponseTime(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)?.push(duration);
  }

  // Get system metrics
  async getSystemMetrics() {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const loadAverage = os.loadavg();

    return {
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        loadAverage: loadAverage,
      },
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external,
      },
      uptime: uptime,
      timestamp: new Date().toISOString(),
    };
  }

  // Get database metrics
  async getDatabaseMetrics() {
    try {
      const result = await db.query(`
        SELECT 
          COUNT(*) as total_connections,
          SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active_connections,
          SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);

      return {
        connections: result[0],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching database metrics:', error);
      return null;
    }
  }

  // Get API metrics
  getApiMetrics() {
    const metrics: Record<string, any> = {};
    
    this.metrics.forEach((durations, endpoint) => {
      const total = durations.length;
      const avg = durations.reduce((a, b) => a + b, 0) / total;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      
      metrics[endpoint] = {
        totalRequests: total,
        averageResponseTime: avg,
        maxResponseTime: max,
        minResponseTime: min,
      };
    });

    return metrics;
  }

  // Reset metrics
  resetMetrics() {
    this.metrics.clear();
  }
}

export const monitoring = new MonitoringService();

// Export middleware to track response times
export const trackResponseTime = (req: any, res: any, next: any) => {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    monitoring.trackResponseTime(req.originalUrl, duration);
  });
  
  next();
}; 