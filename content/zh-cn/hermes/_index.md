---
title: "Hermes Agent 教程"
description: "从首次对话到 Agent 开发工程师 — 面向 Hugo 的双语教程"
weight: 1
draft: false
tags: ["hermes", "agent"]
cascade:
  showDate: false
  showAuthor: false
  showReadingTime: false
  showWordCount: false
  showPagination: true
---

# Hermes Agent 教程

本系列从可用的 Hermes 安装出发，一路读到并能扩展 Agent 核心——面向成为 **Agent 开发工程师** 的学习路径。

## 学习路径

1. **[入门]({{< ref "hermes/getting-started" >}})** — 安装、首次对话、CLI 与配置
2. **[架构]({{< ref "hermes/architecture" >}})** — 设计哲学、系统地图、不变量、数据流
3. **[代码导读]({{< ref "hermes/code-tour" >}})** — 如何在仓库里找代码
4. **[扩展]({{< ref "hermes/extend" >}})** — Footprint Ladder、skills、plugins、tools
5. **[实战 Labs]({{< ref "hermes/labs" >}})** — 在用户目录下动手练习

## 适合谁

- 想尽快跑通一次对话的新用户
- 想理解 Hermes「为什么长这样」的工程师
- 需要在 skill / plugin / 核心工具之间正确选型的贡献者

## 约定

- 纯 Markdown，适配 Hugo（无 Docusaurus MDX）
- 示例优先写在用户目录（`~/.hermes/`），不要求改 Hermes 核心
- 更细的 API：见 hermes-agent 仓库中的官方文档 `website/docs/`
