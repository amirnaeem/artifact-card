import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: {
      "@amirnaeem/artifact-card": resolve(root, "../src/index.ts"),
      "@amirnaeem/artifact-card/styles.css": resolve(root, "../src/styles.css"),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [resolve(root, "..")] },
  },
});
