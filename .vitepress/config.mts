import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "malism",
  description: "technology is cool",
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'subject', link: '/android' }
    ],

    sidebar: [
      {
        text: '人工智能 (AI)',
        collapsible: true,
        items: [
          { text: '简介', link: '/ai' },
          { text: 'AI 指南', link: '/ai/guide' }
        ]
      },
      {
        text: 'Android 开发',
        collapsible: true,
        items: [
          { text: '简介', link: '/android' },
          { text: '分类', link: '/android/category' },
          {
            text: '应用开发',
            collapsible: true,
            items: [
              { text: '应用组件', link: '/android/app/strings' },
              { text: '应用组件', link: '/android/app/appwidget' }
            ]
          },
          {
            text: 'AOSP',
            collapsible: true,
            items: [
              // AOSP 子目录下的文件会自动生成
            ]
          }
        ]
      },
      {
        text: 'Jetpack Compose',
        collapsible: true,
        items: [
          { text: '简介', link: '/compose' },
          { text: '什么是 Compose', link: '/compose/what-is' },
          { text: '项目设置', link: '/compose/setup-project' },
          { text: '基础组件', link: '/compose/basic-components' },
          { text: '布局基础', link: '/compose/layouts-basics' },
          { text: '修饰符', link: '/compose/modifiers' },
          { text: '状态管理基础', link: '/compose/state-basics' },
          { text: 'ViewModel 与状态', link: '/compose/viewmodel-state' },
          { text: '导航', link: '/compose/navigation' },
          { text: '动画', link: '/compose/animations' },
          { text: '列表', link: '/compose/lists' },
          { text: '自定义组件', link: '/compose/custom-components' },
          { text: '与传统 View 互操作', link: '/compose/interoperability' },
          { text: '性能优化', link: '/compose/performance' },
          { text: '最佳实践', link: '/compose/best-practices' },
          { text: '测试', link: '/compose/testing' },
          { text: '主题', link: '/compose/theming' }
        ]
      },
      {
        text: 'Kotlin Multiplatform',
        collapsible: true,
        items: [
          { text: '简介', link: '/kmp' },
          { text: 'KMP 指南', link: '/kmp/guide' },
          { text: 'HTTP 客户端', link: '/kmp/http' },
          { text: '日志', link: '/kmp/logger' },
          { text: 'MVVI 架构', link: '/kmp/mvvi' },
          { text: '总结', link: '/kmp/summary' }
        ]
      },
      {
        text: 'Linux 系统',
        collapsible: true,
        items: [
          { text: '简介', link: '/linux' },
          {
            text: '基础',
            collapsible: true,
            items: [
              { text: '概述', link: '/linux/basics' },
              { text: '架构', link: '/linux/basics/architecture' },
              { text: '开发环境', link: '/linux/basics/environment' },
              { text: '编码风格', link: '/linux/basics/coding-style' },
              { text: '内存管理', link: '/linux/basics/memory-management' },
              { text: '驱动模型', link: '/linux/basics/driver-model' },
              { text: '模块', link: '/linux/basics/modules' }
            ]
          },
          {
            text: '高级主题',
            collapsible: true,
            items: [
              { text: '概述', link: '/linux/advanced' },
              { text: '设备树', link: '/linux/advanced/device-tree' },
              { text: 'DMA', link: '/linux/advanced/dma' },
              { text: '中断', link: '/linux/advanced/interrupts' },
              { text: '性能优化', link: '/linux/advanced/performance' },
              { text: '电源管理', link: '/linux/advanced/power-management' }
            ]
          },
          {
            text: '驱动开发',
            collapsible: true,
            items: [
              { text: '概述', link: '/linux/drivers' },
              {
                text: '字符设备驱动',
                collapsible: true,
                items: [
                  // 子目录下的文件会自动生成
                ]
              },
              {
                text: '块设备驱动',
                collapsible: true,
                items: [
                  // 子目录下的文件会自动生成
                ]
              },
              {
                text: '网络设备驱动',
                collapsible: true,
                items: [
                  // 子目录下的文件会自动生成
                ]
              },
              {
                text: 'USB 驱动',
                collapsible: true,
                items: [
                  // 子目录下的文件会自动生成
                ]
              },
              {
                text: 'PCIe 驱动',
                collapsible: true,
                items: [
                  // 子目录下的文件会自动生成
                ]
              },
              {
                text: 'I2C 驱动',
                collapsible: true,
                items: [
                  // 子目录下的文件会自动生成
                ]
              },
              {
                text: 'SPI 驱动',
                collapsible: true,
                items: [
                  // 子目录下的文件会自动生成
                ]
              },
              {
                text: 'CAN 驱动',
                collapsible: true,
                items: [
                  // 子目录下的文件会自动生成
                ]
              }
            ]
          },
          {
            text: '调试',
            collapsible: true,
            items: [
              { text: '概述', link: '/linux/debugging' },
              { text: 'printk', link: '/linux/debugging/printk' },
              { text: 'ftrace', link: '/linux/debugging/ftrace' },
              { text: 'perf', link: '/linux/debugging/perf' },
              { text: 'kgdb', link: '/linux/debugging/kgdb' },
              { text: 'systemtap', link: '/linux/debugging/systemtap' }
            ]
          },
          {
              text: '测试',
              collapsible: true,
              items: [
                { text: '测试框架', link: '/linux/testing/framework' },
                { text: '字符设备驱动测试', link: '/linux/testing/character-driver' },
                { text: '块设备驱动测试', link: '/linux/testing/block-driver' },
                { text: '网络设备驱动测试', link: '/linux/testing/network-driver' }
              ]
            }
        ]
      },
      {
        text: '学习资源',
        collapsible: true,
        items: [
          { text: 'API 示例', link: '/api-examples' },
          { text: 'Markdown 示例', link: '/markdown-examples' },
          { text: '关注', link: '/follow' }
        ]
      }
    ],

    socialLinks: [
      //{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  },
  
  // Enable theme switching (light/dark)
  appearance: true
})
