import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "malism",
  description: "technology is cool",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'subject', link: '/android' }
    ],

    sidebar: [
      {
        text: 'technology',
        items: [
          { text: 'kmp', link: '/kmp' },
          { text: 'ai', link: '/ai' },
          { text: 'android', link: 'android' },
          { text: 'compose', link: 'compose'},
          { text: 'linux', link: 'linux' },
          { text: 'leetcode', link: 'leetcode' }
        ]
      }
    ],

    socialLinks: [
      //{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
