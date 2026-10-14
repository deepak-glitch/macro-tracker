import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this project site under /macro-tracker/. Override with
// BASE_PATH="/" for root hosts like Vercel/Netlify or local preview.
const base = process.env.BASE_PATH ?? "/macro-tracker/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Macro Tracker",
        short_name: "Macros",
        description:
          "Scan barcodes, log food, and get adaptive calorie & macro coaching.",
        theme_color: "#0f766e",
        background_color: "#0b0f14",
        display: "standalone",
        orientation: "portrait",
        id: base,
        scope: base,
        start_url: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // Cache Open Food Facts product lookups so recently scanned items
        // resolve instantly and work briefly offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "off-api",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
});
