import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@amirnaeem/artifact-card/styles.css",
        replacement: resolve(root, "../src/styles.css"),
      },
      {
        find: "@amirnaeem/artifact-card",
        replacement: resolve(root, "../src/index.ts"),
      },
    ],
  },
  server: {
    port: 5173,
    fs: { allow: [resolve(root, "..")] },
  },
});
