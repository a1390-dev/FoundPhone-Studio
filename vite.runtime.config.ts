import { localIconPlugin } from "./scripts/local-icon-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ command }) => ({
  base: "./",
  optimizeDeps: { entries: ["index.html"] },
  plugins: [
    localIconPlugin(command),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "捡手机",
        short_name: "捡手机",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,svg,json,txt,png,jpg}"],
        // Media and app icons should load on demand instead of competing with the
        // app shell during first launch on mobile connections.
        globIgnores: ["**/media/**", "**/icon-assets/**"],
        // Cache an icon only after it is actually requested by a visible screen.
        runtimeCaching: [
          {
            urlPattern: /\\/icon-assets\\/[^/]+\\.(?:png|jpe?g|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "foundphone-app-icons",
              expiration: { maxEntries: 60, maxAgeSeconds: 31536000 },
            },
          },
        ],
        maximumFileSizeToCacheInBytes: 4000000,
      },
    }),
  ],
}));
