import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes.js";
import { storage } from "./storage-mongo.js";
import logger from "./logger.js";
import { connectToMongoDB } from "./db-mongo.js";

const app = express();
const PORT = process.env.PORT || 3001;

console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);

// Configuração de CORS dinâmica
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());
    console.log("CORS check:", { origin, allowed });
    
    // Aceitar qualquer domínio da Vercel que contenha "card-pio-rojo" ou "rojo-gastronomia"
    if (!origin || 
        allowed.includes(origin) || 
        origin.includes('card-pio-rojo') || 
        origin.includes('rojo-gastronomia')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Expires', 'Content-Length']
}));

// Configuração de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware de logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  }, "Request received");
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Rota de teste básica
app.get("/", (req, res) => {
  res.json({
    message: "SiteCard API está funcionando!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Inicializar rotas
registerRoutes(app);

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  }, "Unhandled error");

  res.status(err.status || 500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "production" ? "Algo deu errado" : err.message,
  });
});

// Middleware para rotas não encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    message: `A rota ${req.originalUrl} não existe`,
  });
});

// Função para inicializar o servidor
async function startServer() {
  try {
    // Conectar ao MongoDB
    await connectToMongoDB();
    logger.info("Connected to MongoDB");

    // Inicializar storage
    await storage.initialize();
    logger.info("Storage initialized");

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base URL: http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      server.close(() => {
        logger.info("Process terminated");
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : "Unknown error" }, "Failed to start server");
    process.exit(1);
  }
}

// Iniciar servidor se este arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, startServer };
