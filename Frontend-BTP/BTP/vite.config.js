import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // on laisse l'utilisateur choisir de mettre à jour
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'BATIPME-SN',
        short_name: 'BATIPME',
        description: 'Gestion de projets BTP pour les PME',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1e3a5f', // à adapter à la couleur principale de ton app
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Met en cache l'application elle-même (JS, CSS, HTML, images)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Ton bundle JS fait ~820 Ko : on relève la limite par sécurité
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Navigation SPA : toute route renvoie index.html quand on est hors ligne
        navigateFallback: '/index.html',
        // Ne jamais intercepter les appels à l'API (on les gère en phase 2)
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
})