import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  // Relative base so GitHub Pages (/artifact-card/) and local preview both work.
  base: "./",
  plugins: [
    react(),
    // CARD_GLTF_URL is resolved from import.meta.url → needs assets/card next to the entry JS.
    viteStaticCopy({
      targets: [{ src: resolve(root, "../src/assets/card"), dest: "assets" }],
    }),
  ],
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
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Keep entry at dist root so ./assets/card/* matches the library layout.
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: {
    port: 5173,
    fs: { allow: [resolve(root, "..")] },
  },
});
