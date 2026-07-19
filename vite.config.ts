import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "og-image.png"],
      manifest: {
        name: "Twibbonify — Bikin Twibbon Massal di Browser",
        short_name: "Twibbonify",
        description:
          "Satu template, puluhan twibbon. Upload, atur, unduh — 100% diproses di perangkat, privasi terjamin.",
        lang: "id",
        theme_color: "#f7f3ea",
        background_color: "#f7f3ea",
        display: "standalone",
        categories: ["design", "productivity", "photo"],
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
      },
    }),
  ],
  build: {
    cssMinify: "lightningcss",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/"))
            return "vendor";
          if (
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/sonner") ||
            id.includes("node_modules/zustand")
          )
            return "ui";
        },
      },
    },
  },
})
