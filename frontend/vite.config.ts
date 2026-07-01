import { defineConfig, loadEnv } from "vite";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const basePath = normalizeBasePath(env.VITE_BASE_PATH);
  const basePathWithoutTrailingSlash =
    basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const apiProxyPath = `${basePathWithoutTrailingSlash}/api`;

  return {
    base: "./",
    plugins: [
      react() as PluginOption,
      {
        name: "eps-dev-base-path",
        configureServer(server) {
          if (basePathWithoutTrailingSlash === "") {
            return;
          }

          server.middlewares.use((req, _res, next) => {
            const request = req as { url?: string };
            if (
              request.url &&
              request.url.indexOf(`${basePathWithoutTrailingSlash}/`) === 0
            ) {
              request.url = request.url.slice(basePathWithoutTrailingSlash.length);
            }
            next();
          });
        },
      },
    ],
    server: {
      port: 5173,
      proxy: {
        "/api": "http://localhost:8080",
        [apiProxyPath]: {
          target: "http://localhost:8080",
          changeOrigin: true,
          rewrite: (path) => path.replace(apiProxyPath, "/api"),
        },
      },
    },
  };
});

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === ".") {
    return "/";
  }
  const withLeadingSlash = value.charAt(0) === "/" ? value : `/${value}`;
  return withLeadingSlash.charAt(withLeadingSlash.length - 1) === "/"
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}
