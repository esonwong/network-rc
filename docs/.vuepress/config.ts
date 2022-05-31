import { defineUserConfig } from '@vuepress/cli'
import type { DefaultThemeOptions } from '@vuepress/theme-default'

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig<DefaultThemeOptions>({


  title: "Network RC",

  description: "Network RC 是运行在树莓派和浏览器上的网络遥控车软件",

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
    docsRepo: 'itiwll/network-rc-doc',
    navbar: [
      {
        text: '主页',
        link: '/',
      },
      {
        text: '制作教程',
        link: '/guide',
      },
      {
        text: '材料清单',
        link: '/bill-of-materials',
      },
      {
        text: '更新记录',
        link: '/change',
      },
      {
        text: '常见问题',
        link: '/faq',
      },
      {
        text: '下载地址',
        link: 'https://download.esonwong.com/network-rc/',
      },
      {
        text: '捐赠',
        link: 'https://blog.esonwong.com/donate/',
      },
    ]
  },

  plugins: [
    [
      '@vuepress/plugin-google-analytics',
      {
        id: 'G-JPM3HHBC6D',
      },
    ],
  ],
})