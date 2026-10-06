import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative paths let the build work from any folder, e.g. on GitHub Pages
  base: "./",
  plugins: [react()],
});
