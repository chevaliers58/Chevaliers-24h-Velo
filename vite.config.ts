import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Version affichée en bas du site : le commit construit par Cloudflare Pages.
const APP_VERSION = (process.env["CF_PAGES_COMMIT_SHA"] || "local").slice(0, 7);
const APP_BUILT_AT = new Date().toISOString();

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const basePath = (env["VITE_BASE_PATH"] ?? "/").replace(/\/+$/, "") || "/";
  const viteBase = basePath === "/" ? "/" : `${basePath}/`;
  return {
    base: viteBase,
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION),
      __APP_BUILT_AT__: JSON.stringify(APP_BUILT_AT),
    },
    plugins: [
      tanstackStart({
        router: { basepath: basePath },
        server: { entry: "server" },
        spa: {
          enabled: true,
          prerender: { outputPath: "/index.html" },
        },
      }),
      nitro({
        preset: "node-server",
        baseURL: viteBase,
      }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3000,
    },
  };
});
