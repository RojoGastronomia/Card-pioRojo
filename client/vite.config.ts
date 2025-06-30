import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('[Proxy] Erro:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Proxy] Enviando requisição:', req.method, req.url);
            
            // Para uploads de arquivo, não modificar o Content-Type
            if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
              console.log('[Proxy] Upload de arquivo detectado, mantendo Content-Type original');
              // Não modificar o Content-Type para FormData
            }
          });
          
          // Aumentar timeout para uploads
          proxy.timeout = 300000; // 5 minutos
          proxy.proxyTimeout = 300000; // 5 minutos
        },
        cookieDomainRewrite: {
          '*': 'localhost'
        },
        cookiePathRewrite: {
          '*': '/'
        },
        xfwd: true,
        ws: true,
        // Aumentar limites para uploads
        limit: '50mb',
        timeout: 30000
      }
    },
    allowedHosts: [
      ".replit.dev"
    ]
  }
});
