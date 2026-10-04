// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: { head: { title: 'OpenWAF · Todo workspace', link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }], meta: [{ name: 'description', content: 'Todo workspace for demonstrating OpenWAF built-in protection.' }] } },
  nitro: { externals: { external: ['node:sqlite'] } }
})
