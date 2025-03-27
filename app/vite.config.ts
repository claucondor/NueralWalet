import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Agregar polyfills de Node.js
    nodePolyfills({
      // Ya sea para incluir polyfills o no
      include: ['buffer', 'process', 'util', 'stream'],
      // Agregar legacyStream: true cuando hay errores relacionados con stream
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Usar rutas absolutas para los polyfills
      "stream": "stream-browserify",
      "buffer": "buffer",
      "util": "util",
      "process": "process/browser",
      "process/": "process/browser",
      // Alias para stellar-kit
      "stellar-kit": path.resolve(__dirname, "./src/lib/stellar-kit")
    },
  },
  // Proporcionar polyfills globales
  define: {
    'global': 'globalThis',
    'process.env': JSON.stringify({}),
  },
  optimizeDeps: {
    esbuildOptions: {
      // Nodos que necesitan polyfills
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));

