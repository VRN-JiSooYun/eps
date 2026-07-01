import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:18080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 15173,
    proxy: {
      "/api": apiProxyTarget,
      "/health": apiProxyTarget
    }
  }
});
