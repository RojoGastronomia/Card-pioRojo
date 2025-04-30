import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolver para server/logs/app.log (assumindo que __dirname está em server/)
const logDir = path.resolve(__dirname, 'logs');
const logFile = path.join(logDir, 'app.log');

// Garante que o diretório de logs existe
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Cria um transport para escrever no arquivo
const fileTransport = pino.transport({
  target: 'pino/file',
  options: { destination: logFile },
});

// Configura o logger principal
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info', // Nível de log (info, debug, error, etc.)
    timestamp: pino.stdTimeFunctions.isoTime, // Formato do timestamp
  },
  fileTransport // Envia os logs para o arquivo
);

// Adiciona um log inicial para testar
logger.info('Logger initialized');

export default logger; 