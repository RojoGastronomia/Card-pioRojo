import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./db";
import { createServer, type Server } from "http";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { registerBasicStatsRoute } from "./basic-route";
import logger from "./logger";
import { registerSSERoute, setupPeriodicUpdates, sseManager } from "./sse";
import { setupRealTimeUpdates } from "./realtime-updates";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar gerenciamento de erros não tratados
process.on("uncaughtException", (err) => {
  console.error("ERRO NÃO TRATADO:", err);
  logger.fatal(
    { error: err.message, stack: err.stack },
    "Erro não tratado no processo",
  );
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("PROMISE REJECTION NÃO TRATADA:", reason);
  logger.fatal({ error: reason }, "Promise rejection não tratada");
});

// Forçar log no console para debugging
console.log("==== INICIANDO SERVIDOR ====");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "Configurado (protegido)" : "NÃO CONFIGURADO",
);
console.log("PORT:", process.env.PORT || 5000);

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS - com configurações mais permissivas para desenvolvimento
app.use(
  cors({
    origin: true, // Permitir todas as origens em desenvolvimento
    credentials: true,
  }),
);

// Configure session com opções mais flexíveis para desenvolvimento
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Desativar secure para desenvolvimento local
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Setup authentication
setupAuth(app);

// Rota de verificação básica
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Servir arquivos de backup de forma estática
app.use("/backups", express.static(path.join(__dirname, "backups")));

// Iniciar o servidor
async function startServer() {
  try {
    console.log("Iniciando servidor...");
    logger.info("Iniciando servidor...");

    console.log("Executando migrações...");
    try {
      await runMigrations();
      console.log("Migrações executadas com sucesso.");
    } catch (migrationError) {
      console.error("ERRO NAS MIGRAÇÕES:", migrationError);
      logger.error({ error: migrationError }, "Erro ao executar migrações");
      // Continuar mesmo com erro nas migrações
      console.log("Continuando servidor mesmo com erro nas migrações...");
    }

    console.log("Registrando rotas...");
    try {
      // Register all routes
      const server = createServer(app);
      await registerRoutes(app);
      console.log("Rotas registradas com sucesso.");

      // Register basic stats route
      console.log("Registrando rota de estatísticas...");
      registerBasicStatsRoute(app);

      // Register SSE route and setup periodic updates
      console.log("Configurando SSE...");
      registerSSERoute(app);
      setupPeriodicUpdates();
      setupRealTimeUpdates(app);

      // Middleware for logging errors
      app.use(
        (
          err: Error,
          req: express.Request,
          res: express.Response,
          next: express.NextFunction,
        ) => {
          logger.error(
            {
              error: err.message,
              stack: err.stack,
              path: req.path,
              method: req.method,
            },
            "Erro não tratado",
          );

          res.status(500).json({
            error: "Erro interno do servidor",
            message:
              process.env.NODE_ENV === "production"
                ? "Um erro ocorreu"
                : err.message,
          });
        },
      );

      // Configurar Vite em desenvolvimento ou servir estáticos em produção
      console.log("Configurando servidor de arquivos estáticos...");
      if (process.env.NODE_ENV === "development") {
        try {
          await setupVite(app, server);
          console.log("Vite configurado com sucesso.");
        } catch (viteError) {
          console.error("ERRO AO CONFIGURAR VITE:", viteError);
          logger.error({ error: viteError }, "Erro ao configurar Vite");
          // Continuar sem Vite em caso de erro
          serveStatic(app);
        }
      } else {
        serveStatic(app);
      }

      // Start the server
      const port = process.env.PORT || 5000;
      server.listen(port, "0.0.0.0", () => {
        console.log(`Servidor iniciado em http://0.0.0.0:${port}`);
        logger.info(`Servidor iniciado em http://0.0.0.0:${port}`);
      });

      // Lidar com encerramento do servidor
      process.on("SIGTERM", () => {
        logger.info("Encerrando servidor");
        sseManager.shutdown();
        process.exit(0);
      });

      // Também tratar SIGINT para garantir encerramento limpo em desenvolvimento
      process.on("SIGINT", () => {
        logger.info("Recebido sinal SIGINT, desligando servidor...");
        sseManager.shutdown();
        process.exit(0);
      });

      return server;
    } catch (routesError) {
      console.error("ERRO AO REGISTRAR ROTAS:", routesError);
      logger.error({ error: routesError }, "Erro ao registrar rotas");
      throw routesError;
    }
  } catch (error) {
    console.error("ERRO AO INICIAR SERVIDOR:", error);
    logger.error({ error }, "Erro ao iniciar o servidor");
    process.exit(1);
  }
}

// Iniciar o servidor sempre em desenvolvimento
if (
  process.env.NODE_ENV === "development" ||
  process.env.START_SERVER === "true"
) {
  console.log("Iniciando servidor em modo desenvolvimento...");
  startServer()
    .then(() => {
      console.log(
        "✅ Servidor iniciado com sucesso na porta",
        process.env.PORT || 5000,
      );
    })
    .catch((err) => {
      console.error("❌ Erro ao iniciar servidor:", err);
      // Não encerrar o processo em caso de erro
      console.log("Tentando continuar mesmo com erro...");
    });
} else {
  console.log("Servidor não iniciado - ambiente de produção");
}

// Exportar app para uso em ambiente serverless
export default app;
