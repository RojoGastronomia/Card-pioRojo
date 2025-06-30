import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer } from "vite";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(...args: any[]) {
  console.log("[Vite]", ...args);
}

/**
 * Vite dev server integration for Express
 */
export async function setupVite(app: Express, server: any): Promise<void> {
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

    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);

    // Handle SPA routing
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }

      const template = fs.readFileSync(
        path.resolve(clientDir, "index.html"),
        "utf-8"
      );

      vite.transformIndexHtml(req.originalUrl, template)
        .then(transformedHtml => {
          res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
        })
        .catch(e => {
          console.error("Erro ao transformar HTML:", e);
          next(e);
        });
    });
  } catch (error) {
    console.error("Erro ao configurar Vite:", error);
    throw error;
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

  // Handle SPA routing
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}
