import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "src/assets/card", dest: "assets" },
        { src: "src/assets/badges", dest: "assets" },
        { src: "src/styles.css", dest: "." },
      ],
    }),
  ],
  build: {
    lib: {
      entry: resolve(root, "src/index.ts"),
      name: "ArtifactCard",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "three",
        /^three\//,
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
