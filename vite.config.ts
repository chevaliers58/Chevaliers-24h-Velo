import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

// Version affichée en bas du site : le commit construit par Cloudflare Pages.
const APP_VERSION = (process.env["CF_PAGES_COMMIT_SHA"] || "local").slice(0, 7);
const APP_BUILT_AT = new Date().toISOString();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_BUILT_AT__: JSON.stringify(APP_BUILT_AT),
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      // Mode SPA : le site est généré en fichiers statiques (index.html + assets).
      // Toute la logique tourne dans le navigateur et parle directement à Supabase,
      // la sécurité est assurée par les règles RLS de la base.
      spa: {
        enabled: true,
        prerender: { outputPath: "/index.html" },
      },
    }),
    nitro({
      // Le serveur n'est utilisé qu'au moment du build pour générer index.html.
      // Seul le dossier .output/public est publié (Cloudflare Pages).
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
});
