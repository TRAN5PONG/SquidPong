import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// Needed to emulate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    fs: {
      strict: true,
    },
    middlewareMode: false, // important!
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
