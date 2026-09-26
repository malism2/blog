---
title: "Hermes 是什么"
description: "一个 Agent 核心，覆盖 CLI、Gateway、TUI 与 Desktop — 能力在边缘"
weight: 11
draft: false
tags: ["hermes", "agent", "getting-started"]
---

# Hermes 是什么

Hermes 是个人 AI Agent，**同一套 Agent 核心**跑在多种表面上：

- **CLI** — 交互式终端助手
- **消息 Gateway** — Telegram、Discord、Slack 等约二十种平台
- **TUI** — Ink 终端 UI（`hermes --tui`）
- **Desktop** — Electron 应用，经 JSON-RPC 连接同一后端

它能跨会话学习（memory + skills）、委派子 Agent、跑定时任务，并驱动真实终端与浏览器。新能力应主要通过 **plugins 与 skills** 扩展，而不是无限膨胀核心。

## 心智模型

```text
  CLI / Gateway / TUI / Desktop / Cron / ACP
                    │
                    ▼
              AIAgent（单一核心）
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Prompt      Providers    Tools
     + cache                  + backends
```

核心之上都是**入口**。平台差异应留在入口，而不是写进 `AIAgent`。

## 你会反复看到的两个观念

1. **Prompt caching 神圣不可轻易破坏。** 长对话每轮复用缓存的 system prompt 前缀。中途改历史、换 toolset、重建 system prompt 会让成本成倍上升。压缩（compression）是少数被允许的例外。
2. **细腰、富边缘。** 每个*核心*模型工具几乎会出现在每次 API 调用里。优先 skill、CLI、plugin、MCP，最后才考虑新核心工具。

两者会在 [架构]({{< ref "hermes/architecture" >}}) 中展开。

## 学完本系列你应能

- 跑通 Hermes 并验证一次干净对话
- 用一张图讲清架构
- 按主题找代码（`stem_*.py` siblings，而不是先啃 facade）
- 选对扩展档位（skill → plugin → tool）
- 完成 [Labs]({{< ref "hermes/labs" >}}) 且不必改核心源码

## 下一章

[安装与首次对话]({{< ref "hermes/getting-started/02-install-and-first-chat" >}})

## 延伸阅读

- 仓库根目录 `AGENTS.md`
- 官方文档：`website/docs/getting-started/`
