// ../client/vite.config.ts
import { defineConfig } from "file:///C:/Users/User/SiteCard-pio-main/client/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/User/SiteCard-pio-main/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\User\\SiteCard-pio-main\\client";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@shared": path.resolve(__vite_injected_original_dirname, "../shared")
    }
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path2) => path2,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.error("[Proxy] Erro:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("[Proxy] Enviando requisi\xE7\xE3o:", req.method, req.url);
            console.log("[Proxy] Headers da requisi\xE7\xE3o:", proxyReq.getHeaders());
            if (req.headers.cookie) {
              proxyReq.setHeader("cookie", req.headers.cookie);
            }
            if (req.headers.origin) {
              proxyReq.setHeader("origin", req.headers.origin);
            }
            if (req.headers.referer) {
              proxyReq.setHeader("referer", req.headers.referer);
            }
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("[Proxy] Resposta recebida:", proxyRes.statusCode, req.url);
            console.log("[Proxy] Headers da resposta:", proxyRes.headers);
            let body = "";
            proxyRes.on("data", function(chunk) {
              body += chunk;
            });
            proxyRes.on("end", function() {
              console.log("[Proxy] Corpo da resposta:", body);
            });
          });
        },
        cookieDomainRewrite: {
          "*": "localhost"
        },
        cookiePathRewrite: {
          "*": "/"
        },
        xfwd: true,
        ws: true
      }
    },
    allowedHosts: [
      ".replit.dev"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vY2xpZW50L3ZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVXNlclxcXFxTaXRlQ2FyZC1waW8tbWFpblxcXFxjbGllbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFVzZXJcXFxcU2l0ZUNhcmQtcGlvLW1haW5cXFxcY2xpZW50XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9Vc2VyL1NpdGVDYXJkLXBpby1tYWluL2NsaWVudC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCldLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICBcIkBzaGFyZWRcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9zaGFyZWRcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgaG9zdDogJzAuMC4wLjAnLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgXCIvYXBpXCI6IHtcclxuICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDo1MDAwXCIsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgsXHJcbiAgICAgICAgY29uZmlndXJlOiAocHJveHksIF9vcHRpb25zKSA9PiB7XHJcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCBfcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQcm94eV0gRXJybzonLCBlcnIpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSwgX3JlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1Byb3h5XSBFbnZpYW5kbyByZXF1aXNpXHUwMEU3XHUwMEUzbzonLCByZXEubWV0aG9kLCByZXEudXJsKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tQcm94eV0gSGVhZGVycyBkYSByZXF1aXNpXHUwMEU3XHUwMEUzbzonLCBwcm94eVJlcS5nZXRIZWFkZXJzKCkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gUHJlc2VydmFyIGhlYWRlcnMgaW1wb3J0YW50ZXNcclxuICAgICAgICAgICAgaWYgKHJlcS5oZWFkZXJzLmNvb2tpZSkge1xyXG4gICAgICAgICAgICAgIHByb3h5UmVxLnNldEhlYWRlcignY29va2llJywgcmVxLmhlYWRlcnMuY29va2llKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVxLmhlYWRlcnMub3JpZ2luKSB7XHJcbiAgICAgICAgICAgICAgcHJveHlSZXEuc2V0SGVhZGVyKCdvcmlnaW4nLCByZXEuaGVhZGVycy5vcmlnaW4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZXEuaGVhZGVycy5yZWZlcmVyKSB7XHJcbiAgICAgICAgICAgICAgcHJveHlSZXEuc2V0SGVhZGVyKCdyZWZlcmVyJywgcmVxLmhlYWRlcnMucmVmZXJlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVzJywgKHByb3h5UmVzLCByZXEsIF9yZXMpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tQcm94eV0gUmVzcG9zdGEgcmVjZWJpZGE6JywgcHJveHlSZXMuc3RhdHVzQ29kZSwgcmVxLnVybCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbUHJveHldIEhlYWRlcnMgZGEgcmVzcG9zdGE6JywgcHJveHlSZXMuaGVhZGVycyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBMb2cgZG8gY29ycG8gZGEgcmVzcG9zdGFcclxuICAgICAgICAgICAgbGV0IGJvZHkgPSAnJztcclxuICAgICAgICAgICAgcHJveHlSZXMub24oJ2RhdGEnLCBmdW5jdGlvbihjaHVuaykge1xyXG4gICAgICAgICAgICAgIGJvZHkgKz0gY2h1bms7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBwcm94eVJlcy5vbignZW5kJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tQcm94eV0gQ29ycG8gZGEgcmVzcG9zdGE6JywgYm9keSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb29raWVEb21haW5SZXdyaXRlOiB7XHJcbiAgICAgICAgICAnKic6ICdsb2NhbGhvc3QnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb29raWVQYXRoUmV3cml0ZToge1xyXG4gICAgICAgICAgJyonOiAnLydcclxuICAgICAgICB9LFxyXG4gICAgICAgIHhmd2Q6IHRydWUsXHJcbiAgICAgICAgd3M6IHRydWVcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGFsbG93ZWRIb3N0czogW1xyXG4gICAgICBcIi5yZXBsaXQuZGV2XCJcclxuICAgIF1cclxuICB9XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThTLFNBQVMsb0JBQW9CO0FBQzNVLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUNwQyxXQUFXLEtBQUssUUFBUSxrQ0FBVyxXQUFXO0FBQUEsSUFDaEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixTQUFTLENBQUNBLFVBQVNBO0FBQUEsUUFDbkIsV0FBVyxDQUFDLE9BQU8sYUFBYTtBQUM5QixnQkFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLE1BQU0sU0FBUztBQUNyQyxvQkFBUSxNQUFNLGlCQUFpQixHQUFHO0FBQUEsVUFDcEMsQ0FBQztBQUNELGdCQUFNLEdBQUcsWUFBWSxDQUFDLFVBQVUsS0FBSyxTQUFTO0FBQzVDLG9CQUFRLElBQUksc0NBQWdDLElBQUksUUFBUSxJQUFJLEdBQUc7QUFDL0Qsb0JBQVEsSUFBSSx3Q0FBa0MsU0FBUyxXQUFXLENBQUM7QUFHbkUsZ0JBQUksSUFBSSxRQUFRLFFBQVE7QUFDdEIsdUJBQVMsVUFBVSxVQUFVLElBQUksUUFBUSxNQUFNO0FBQUEsWUFDakQ7QUFDQSxnQkFBSSxJQUFJLFFBQVEsUUFBUTtBQUN0Qix1QkFBUyxVQUFVLFVBQVUsSUFBSSxRQUFRLE1BQU07QUFBQSxZQUNqRDtBQUNBLGdCQUFJLElBQUksUUFBUSxTQUFTO0FBQ3ZCLHVCQUFTLFVBQVUsV0FBVyxJQUFJLFFBQVEsT0FBTztBQUFBLFlBQ25EO0FBQUEsVUFDRixDQUFDO0FBQ0QsZ0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFNBQVM7QUFDNUMsb0JBQVEsSUFBSSw4QkFBOEIsU0FBUyxZQUFZLElBQUksR0FBRztBQUN0RSxvQkFBUSxJQUFJLGdDQUFnQyxTQUFTLE9BQU87QUFHNUQsZ0JBQUksT0FBTztBQUNYLHFCQUFTLEdBQUcsUUFBUSxTQUFTLE9BQU87QUFDbEMsc0JBQVE7QUFBQSxZQUNWLENBQUM7QUFDRCxxQkFBUyxHQUFHLE9BQU8sV0FBVztBQUM1QixzQkFBUSxJQUFJLDhCQUE4QixJQUFJO0FBQUEsWUFDaEQsQ0FBQztBQUFBLFVBQ0gsQ0FBQztBQUFBLFFBQ0g7QUFBQSxRQUNBLHFCQUFxQjtBQUFBLFVBQ25CLEtBQUs7QUFBQSxRQUNQO0FBQUEsUUFDQSxtQkFBbUI7QUFBQSxVQUNqQixLQUFLO0FBQUEsUUFDUDtBQUFBLFFBQ0EsTUFBTTtBQUFBLFFBQ04sSUFBSTtBQUFBLE1BQ047QUFBQSxJQUNGO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
