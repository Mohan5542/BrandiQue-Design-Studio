import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "BrandiQue Design Studio",
        short_name: "BrandiQue",
        description: "Your ideas. Your canvas. A local-first design studio.",
        theme_color: "#1E1F1F",
        background_color: "#1E1F1F",
        display: "standalone",
        start_url: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5000000,
      },
    }),
  ],
  server: { host: "0.0.0.0", port: 4173, allowedHosts: ["terminal.local"] },
  build: { chunkSizeWarningLimit: 900 },
});
