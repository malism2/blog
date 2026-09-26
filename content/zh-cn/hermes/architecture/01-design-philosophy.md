---
title: "设计哲学"
description: "为什么 Hermes 在边缘扩张、在腰部克制"
weight: 21
draft: false
tags: ["hermes", "agent", "architecture"]
---

# 设计哲学

本页讲*为什么*。后面的地图、硬不变量与 Labs 都建立在此之上。

## Hermes 优化什么

Hermes 交付**一个 Agent 核心**和多种表面（CLI、gateway、TUI、Desktop、cron、ACP）。它应当：

- 无论从哪里对话，都像同一个 Agent
- 跨会话学习（memory + skills），却不在对话中途悄悄改写「过去」
- 在**边缘**增长能力（skills、plugins、MCP、平台适配器），而不是把每个想法塞进核心工具 schema

## 每个改动的两面透镜

### 1. 会不会破坏 per-conversation prompt caching？

长对话每轮复用缓存的 system prompt **前缀**。改历史、换 toolset、把记忆写进 system prompt、中途重建 system prompt，都会使缓存失效并放大成本。

**压缩（compression）**是刻意允许的例外。会改 system-prompt 状态的斜杠命令（skills、tools、memory）应默认**延迟**失效（下次会话），并提供 opt-in 的 `--now`。

### 2. 会不会撑宽细腰？

每个*核心*模型工具几乎挂在每次 API 调用上。新增核心工具门槛很高。优先顺序：扩展已有代码 → CLI + skill → 服务门控工具 → plugin → MCP → **最后才是新核心工具**。

这就是 **Footprint Ladder** — 见 [扩展]({{< ref "hermes/extend/01-footprint-ladder" >}})。

## 边缘扩张，腰部克制

Hermes **不是**小产品。平台、Provider、桌面/TUI 功能可以积极扩展。

克制针对的是 **核心 Agent + 模型工具 schema**——唯一「每次 API 都付钱」的地方：

| 可以大胆扩展（边缘） | 必须克制（腰部） |
| -------------------- | ---------------- |
| 平台适配器、Provider、桌面 UI | 核心工具 schema 新条目 |
| Skills、optional skills、plugins | 对话中途改写 system prompt |
| Gateway 功能、仪表盘 | 没有真实消费者的投机 hooks |

## 架构设计原则

摘自官方架构文档，并配上工程师向的「好改 / 坏改」：

| 原则 | 好的改动 | 坏的改动 |
| ---- | -------- | -------- |
| **Prompt 稳定** | 用用户消息或工具结果注入指引 | 每轮重建 system prompt「刷新记忆」 |
| **可观察执行** | 经现有回调展示工具进度 | 用户看不见的静默副作用 |
| **可中断** | 长工具尊重 cancel/interrupt | `/stop` 无效、工具永远跑 |
| **平台无关核心** | Discord 怪癖放在 Discord 适配器 | 在 `AIAgent` 里特判 Discord |
| **松耦合** | 用 `check_fn` / registry 门控可选能力 | 在核心循环硬依赖小众 SaaS SDK |
| **Profile 隔离** | 按 profile home / secret scope 取状态 | 多路复用时从进程 `os.environ` 读次要 profile 密钥 |

## 贡献品味（摘要）

**想要：** 端到端修真 bug；在边缘扩展；把 god-file 拆成 `stem_topic.py`；保持核心窄；扩展而非复制；测试断言行为契约；用临时 `HERMES_HOME` 做真实 E2E。

**不要（即使写得很漂亮）：** 投机 hooks；为非密钥配置新增 `HERMES_*`；终端+文件或 skill 已够用时仍加核心工具；教学类工具上的偷懒分页；毁掉功能的「安全修复」；无 opt-in 的出站遥测；改核心文件的 plugin；把第三方产品插件吞进核心树。

## Facade + siblings 文化

大模块是 **facade** 加主题 **siblings**（`gateway/run.py` + `run_*.py`，`agent/turn_*.py`）。按**主题**找代码，不要先当 facade 是全部逻辑。

## 衔接下文

| 下一页 | 增加什么 |
| ------ | -------- |
| [系统地图]({{< ref "hermes/architecture/02-system-map" >}}) | 盒子与目录 |
| [设计不变量]({{< ref "hermes/architecture/03-design-invariants" >}}) | 可执行的硬规则 |
| [Footprint Ladder]({{< ref "hermes/extend/01-footprint-ladder" >}}) | 如何加能力 |
| [Labs]({{< ref "hermes/labs" >}}) | 练习拒绝错误档位 |

## 延伸阅读

- 根目录 `AGENTS.md`
- `website/docs/developer-guide/architecture.md` § Design Principles
