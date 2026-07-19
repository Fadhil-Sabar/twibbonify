import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "Twibbonin",
                short_name: "Twibbonin",
                description: "Bikin banyak twibbon, lebih cepat.",
                theme_color: "#f7f3ea",
                background_color: "#f7f3ea",
                display: "standalone",
                icons: [
                    {
                        src: "/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
            workbox: { navigateFallback: "/index.html" },
        }),
    ],
});
