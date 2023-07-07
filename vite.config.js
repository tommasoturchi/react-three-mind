import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import terser from '@rollup/plugin-terser';

export default defineConfig({
  mode: "production",
  publicDir: false,
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      fileName: "[name]",
      entry: "src/index.js",
      name: "react-three-mind",
      formats: ["es", "umd"],
    },
    rollupOptions: {
      plugins: [
        terser({
          format: {
            comments: false,
          },
          mangle: {
            keep_classnames: false,
            reserved: [],
          },
        }),
      ],
      external: [
        "react",
        "react-dom",
        "react-webcam",
        "@react-three/fiber",
        "@react-three/drei",
        "jotai",
        "three",
        "three/examples/jsm/",
        "three/addons/"
      ],
    },
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "three/addons/": "three/examples/jsm/"
    },
  },
});
