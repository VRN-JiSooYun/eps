import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:18080";
const basePath = normalizeBasePath(process.env.VITE_BASE_PATH ?? "/");

function normalizeBasePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

const prefixedAPIPath = `${basePath === "/" ? "" : basePath.replace(/\/$/, "")}/api`;
const prefixedHealthPath = `${basePath === "/" ? "" : basePath.replace(/\/$/, "")}/health`;

export default defineConfig({
  plugins: [react()],
  base: basePath,
  server: {
    port: 15173,
    proxy: {
      "/api": apiProxyTarget,
      "/health": apiProxyTarget,
      [prefixedAPIPath]: apiProxyTarget,
      [prefixedHealthPath]: apiProxyTarget
    }
  }
});
