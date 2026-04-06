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
    // ✅ 쿠키 이름은 cookieOptions 밖에서 설정하거나 생략(기본값 sb) 가능
    cookieName: 'sb', 

    // ✅ cookieOptions 내부에는 '속성'들만 적습니다.
    cookieOptions: {
      domain: '.cheerreaders.com', // 👈 이 부분이 도메인 문제를 해결하는 핵심입니다!
      path: '/',
      sameSite: 'lax',
      secure: true, // https 환경이므로 true 권장
      maxAge: 60 * 60 * 8 // 초 단위 (8시간)
    }
  },

  // PWA 설정
  pwa: {
    manifest: {
      name: 'Cheer Readers',
      short_name: 'Cheer Readers',
      description: '당신의 독서를 응원합니다',
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
      title: 'Cheer Readers',
      titleTemplate: '%s | Cheer Readers',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})
