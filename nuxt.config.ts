// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'url' // 👈 1. 이 줄이 반드시 있어야 합니다.

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  // 👈 2. 별칭(Alias)을 직접 명시합니다.
  // 시스템의 절대 경로로 강제 매핑하므로 경로를 못 찾을 수가 없습니다.
  alias: {
    '@': fileURLToPath(new URL('./', import.meta.url)),
    '~': fileURLToPath(new URL('./', import.meta.url)),
    'assets': fileURLToPath(new URL('./assets', import.meta.url)),
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt'
  ],

  // 👈 3. alias 설정에 따라 css 경로를 지정합니다.
  css: ['@/assets/css/main.css'],

  supabase: {
    redirect: false
  },
  pwa: {
    manifest: {
      name: 'Sidekick',
      short_name: 'Sidekick',
      description: 'Mobile-first shared reading companion',
      theme_color: '#09090b',
      background_color: '#09090b',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  },
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
      title: 'Sidekick'
    }
  }
})