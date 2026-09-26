---
title: "Lab：Footprint 决策演练"
description: "为三个功能设想选择正确的 Footprint Ladder 档位"
weight: 54
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab：Footprint 决策演练

## 目标

针对三个功能设想，选择梯子档位，用 ≤5 条要点论证，并列出将触及的文件——**先不实现**。

## 前置

- 已读 [Footprint Ladder]({{< ref "hermes/extend/01-footprint-ladder" >}}) 与 [Skills、plugins 与 tools]({{< ref "hermes/extend/02-skills-plugins-tools" >}})

## 步骤

对**每个**场景写下：

1. 所选档位（1–6）
2. 为何更低档不够（或为何此档已够）
3. 会触及的路径（用户目录 vs 核心）
4. 一个要盯住的缓存/session 风险

### 场景 A — 每日 GitHub 摘要

「每天早上总结我的 open PR，并发到 Telegram。」

### 场景 B — 自定义天气 API

「公司有带私有 token 的内部天气 HTTP API；Agent 应用结构化参数调用它。」

### 场景 C — 响应 Discord 表情反应

「有人对消息点 👀 时，机器人应在线程里确认。」

## 预期结果

一份三决策短文。写完后再对照参考答案（评分看**推理质量**，不要求标签完全一致）：

| 场景 | 建议档位 | 原因 |
| ---- | -------- | ---- |
| A | CLI/cron + skill（及 gateway 投递） | 调度 + 流程；复用 cron/消息 — 不是新核心工具 |
| B | Plugin 工具（或 MCP） | 小众鉴权 API；token 放密钥；避开核心 schema |
| C | Gateway / Discord 适配器边缘功能 | 反应处理是平台表面，不是 `AIAgent` 核心工具 |

## 验证

1. 没有在未穷尽低档时直接「加进 `_HERMES_CORE_TOOLS`」
2. 场景 B 不把 API token 放进 `config.yaml`
3. 场景 C 不以单独的 `HERMES_DESKTOP` `check_fn` 作为方案

## 常见坑

- 「Agent 应该做 X」自动等于「需要核心工具」
- 只有 skill、没有持久调度器却想做每日任务
- 在 `run_agent.py` 里解决 Discord UX

## 进阶

- 用 script-only cron（`no_agent`）对比完整 agent cron 重做场景 A
- 见 `website/docs/user-guide/features/cron.md`

## 下一 Lab

[缓存安全变更评审]({{< ref "hermes/labs/05-cache-safe-change-review" >}})
