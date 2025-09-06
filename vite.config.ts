import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 3000,
  },
  ssr: {
    noExternal: ["posthog-js", "posthog-js/react"],
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      customViteReactPlugin: true,
      target: "node-server",
      prerender: {
        enabled: true,
        crawlLinks: true,
        concurrency: 14,
      },
    }),
    tailwindcss(),
    viteReact(),
  ],
});
