// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt'
  ],

  css: ['~/assets/css/main.css'],

  // ✅ 환경 변수 연결 (Supabase 오류 해결 핵심)
  runtimeConfig: {
    // 서버 사이드 전용 (클라이언트에 노출되지 않음)
    naverClientId: process.env.NAVER_CLIENT_ID,
    naverClientSecret: process.env.NAVER_CLIENT_SECRET,

    // 클라이언트 사이드 (브라우저에 노출됨)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },

  // Supabase 설정
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },

  // PWA 설정
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
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    }
  },

  // HTML Head
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
      title: 'Sidekick'
    }
  }
})
