import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(() => ({
  base: "./",
  optimizeDeps: { entries: ["index.html"] },
  plugins: [
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
        // Do not precache image assets with the app shell. Load visible icons on demand
        // and cache them after their first request, so image downloads do not delay launch.
        globIgnores: [
          "**/media/**",
          "**/icon-assets/**",
          "**/assets/*.{png,jpg,jpeg,svg}",
        ],
        // Cache an icon/image only after it is actually requested by a visible screen.
        runtimeCaching: [
          {
            urlPattern: /\/assets\/[^/]+\.(?:png|jpe?g|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "foundphone-app-icons-v3",
              expiration: { maxEntries: 60, maxAgeSeconds: 31536000 },
            },
          },
        ],
        maximumFileSizeToCacheInBytes: 4000000,
      },
    }),
  ],
}));
