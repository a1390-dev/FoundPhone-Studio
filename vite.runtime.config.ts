import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(() => ({
  base: "./",
  optimizeDeps: { entries: ["index.html"] },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      manifest: {
        name: "捡手机",
        short_name: "捡手机",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,json,txt,png,jpg,jpeg,webp}"],
        globIgnores: [
          "**/media/**",
          "**/icon-assets/**",
          "**/assets/*.{png,jpg,jpeg,svg,webp}",
        ],
        maximumFileSizeToCacheInBytes: 4000000,
      },
    }),
  ],
}));
