import { defineUserConfig } from '@vuepress/cli'
import type { DefaultThemeOptions } from '@vuepress/theme-default'

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig<DefaultThemeOptions>({
  base: '/',

  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '256x256',
        href: `/logo-256.png`,
      },
    ],
    ['link', { rel: 'manifest', href: '/manifest.webmanifest' }],
    ['meta', { name: 'application-name', content: 'Network RC' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'Network RC' }],
    [
      'meta',
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
    ],
    [
      'link',
      { rel: 'apple-touch-icon', href: `/logo-256.png` },
    ],
    [
      'link',
      {
        rel: 'mask-icon',
        href: '/logo-256.png',
        color: '#e62662',
      },
    ],
    ['meta', { name: 'msapplication-TileColor', content: '#e62662' }],
    ['meta', { name: 'theme-color', content: '#e62662' }],
  ],

  themeConfig: {
    logo: '/logo-256.png',

    repo: 'itiwll/network-rc',

    docsDir: 'docs',


  },

  plugins: [
    [
      '@vuepress/plugin-google-analytics',
      {
        // we have multiple deployments, which would use different id
        id: process.env.DOCS_GA_ID,
      },
    ],
    //   ['@vuepress/plugin-pwa'],
    //   [
    //     '@vuepress/plugin-pwa-popup',
    //   ],
  ],
})