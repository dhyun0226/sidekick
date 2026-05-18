import { defineNuxtConfig } from 'nuxt/config'

const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000'
const isLocalBaseUrl = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(baseUrl)

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

  runtimeConfig: {
    naverClientId: process.env.NAVER_CLIENT_ID,
    naverClientSecret: process.env.NAVER_CLIENT_SECRET,
    tossSecretKey: process.env.TOSS_SECRET_KEY,
    tossWebhookSecret: process.env.TOSS_WEBHOOK_SECRET,
    cronSecret: process.env.CRON_SECRET,

    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      tossClientKey: process.env.NUXT_PUBLIC_TOSS_CLIENT_KEY,
      baseUrl
    }
  },

  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    cookieName: 'sb',
    cookieOptions: {
      domain: isLocalBaseUrl ? undefined : '.cheerreaders.com',
      path: '/',
      sameSite: 'lax',
      secure: !isLocalBaseUrl,
      maxAge: 60 * 60 * 8
    }
  },

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
