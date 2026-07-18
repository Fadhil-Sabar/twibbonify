import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Twibbonify",
        short_name: "Twibbonify",
        description: "Bikin banyak twibbon, lebih cepat.",
        theme_color: "#f7f3ea",
        background_color: "#f7f3ea",
        display: "standalone",
        icons: [],
      },
      workbox: { navigateFallback: "/index.html" },
    }),
  ],
})
