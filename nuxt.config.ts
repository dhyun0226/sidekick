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
    tossSecretKey: process.env.TOSS_SECRET_KEY,
    tossWebhookSecret: process.env.TOSS_WEBHOOK_SECRET,
    cronSecret: process.env.CRON_SECRET,

    // 클라이언트 사이드 (브라우저에 노출됨)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      tossClientKey: process.env.NUXT_PUBLIC_TOSS_CLIENT_KEY,
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    }
  },

  // Supabase 설정
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SECRET_KEY
  },

  // PWA 설정
  pwa: {
    manifest: {
      name: '치어리더스',
      short_name: '치어리더스',
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
      title: 'Cheer Readers | 당신의 독서를 응원합니다',
      titleTemplate: (title) => title ? `${title} | Cheer Readers` : 'Cheer Readers | 당신의 독서를 응원합니다'
    }
  },

  // Vite 설정 - 프로덕션 빌드 시 console.log 제거
  vite: {
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  }
})
