import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import fs from "fs";
import path from "path";

function scoutServerApiPlugin(env: Record<string, string>): Plugin {
  const dataDir = path.resolve(process.cwd(), "data");
  const dbFile = path.resolve(dataDir, "db.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return {
    name: "scout-server-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/health" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ status: "ok" }));
          return;
        }

        if (req.url === "/api/diagnostics/supabase" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          const targetUrl = (env["VITE_SUPABASE_URL"] ?? "").replace(/\/+$/, "");
          const targetKey = env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "";
          const projectId =
            env["VITE_SUPABASE_PROJECT_ID"] ||
            (targetUrl ? new URL(targetUrl).hostname.split(".")[0] : "");

          if (!targetUrl || !targetKey) {
            res.statusCode = 503;
            res.end(
              JSON.stringify({
                status: "not_configured",
                message:
                  "Configure VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans .env.local.",
              }),
            );
            return;
          }

          fetch(targetUrl + "/rest/v1/patrols?select=id,name,category&limit=10", {
            headers: {
              apikey: targetKey,
              Authorization: "Bearer " + targetKey,
            },
          })
            .then(async (response) => {
              const patrols = response.ok ? await response.json() : null;
              res.end(
                JSON.stringify({
                  status: response.ok ? "connected" : "error",
                  statusCode: response.status,
                  targetUrl,
                  projectId,
                  patrolsCount: Array.isArray(patrols) ? patrols.length : 0,
                  patrolsSample: Array.isArray(patrols) ? patrols.slice(0, 3) : null,
                  message: response.ok
                    ? "Connexion Supabase réussie et lecture de la base de données validée !"
                    : "Impossible d'effectuer la lecture dans la base de données Supabase.",
                }),
              );
            })
            .catch((err) => {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  status: "network_error",
                  error: String(err),
                }),
              );
            });
          return;
        }

        if (req.url === "/api/db" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          if (fs.existsSync(dbFile)) {
            const data = fs.readFileSync(dbFile, "utf-8");
            res.end(data);
          } else {
            res.end(JSON.stringify({}));
          }
          return;
        }

        if (req.url === "/api/db" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", () => {
            try {
              if (body) {
                fs.writeFileSync(dbFile, body, "utf-8");
              }
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

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
      scoutServerApiPlugin(env),
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
