import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer, type Server } from "vite";
import type { ViteDevServer } from "vite";
import { nanoid } from "nanoid";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(...args: any[]) {
  console.log("[Vite]", ...args);
}

/**
 * Vite dev server integration for Express
 */
export async function setupVite(app: Express, server: Server): Promise<void> {
  const clientDir = path.resolve(__dirname, "../client");
  
  if (!fs.existsSync(clientDir)) {
    console.error(`Diretório do cliente não encontrado: ${clientDir}`);
    throw new Error(`Diretório do cliente não encontrado: ${clientDir}`);
  }
  
  console.log(`Iniciando Vite no diretório: ${clientDir}`);
  
  try {
    // Create a Vite dev server
    const vite = await createServer({
      root: clientDir,
      server: {
        middlewareMode: true,
        hmr: {
          server: server,
        },
      },
      appType: "spa",
      logLevel: "info"
    });

    app.use(vite.middlewares);

    // Serve index.html with Vite transforms
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }

      try {
        const template = await fs.promises.readFile(
          path.resolve(clientDir, "index.html"),
          "utf-8"
        );

        // Apply Vite HTML transforms
        const transformedHtml = await vite.transformIndexHtml(
          req.originalUrl,
          template
        );

        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      } catch (e) {
        // Forward error to Express error handler
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("Erro ao configurar Vite:", error);
    throw new Error(`Falha ao configurar o servidor Vite: ${error.message}`);
  }
}

/**
 * Static file serving for production
 */
export function serveStatic(app: Express): void {
  const clientDist = path.resolve(__dirname, "../client/dist");
  
  if (!fs.existsSync(clientDist)) {
    console.warn(`Diretório de distribuição do cliente não encontrado: ${clientDist}`);
    console.warn("Servidor continuará apenas com as APIs disponíveis");
    return;
  }
  
  // Serve static files
  app.use(express.static(clientDist));

  // Serve index.html for all routes not starting with /api
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientDist, "index.html"));
    }
  });
}
