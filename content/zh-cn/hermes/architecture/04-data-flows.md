---
title: "数据流"
description: "CLI 回合、Gateway 消息路径与 Cron — 同一个 AIAgent，不同边缘"
weight: 24
draft: false
tags: ["hermes", "agent", "architecture"]
---

# 数据流

同一核心，不同边缘。先摸清三条路径，评审才站得住。

## CLI 回合

```text
用户输入（REPL / -q / TUI prompt.submit）
        │
        ▼
HermesCLI / tui_gateway methods
        │
        ▼
AIAgent.run_conversation / chat
        │
        ▼
agent/conversation_loop.py
  → 组装请求（来自 model_tools 的 tools schemas）
  → Provider API 调用
  → 若有 tool_calls：handle_function_call → 追加 tool 结果
  → 否则：最终 assistant 文本
        │
        ▼
会话持久化（hermes_state）+ UI 流式输出
```

## Gateway 消息路径

```text
平台事件（Telegram/Discord/…）
        │
        ▼
适配器（gateway/platforms/*）
  → 规范化 identity / session key
  → 鉴权（allowlist、gates）经 scoped 读取
        │
        ▼
Gateway runner（gateway/run*.py）
  → busy 守卫（/stop、/approve…）
  → 为本回合绑定 profile runtime scope
        │
        ▼
同一个 AIAgent 对话循环
        │
        ▼
投递适配器 send / stream（平台怪癖留在这里）
```

注意：适配器排队与 runner 控制命令是**两道** busy 守卫；审批类命令必须同时绕过两者。

## Cron 路径

```text
cron ticker（按被服务的 profile，在 profile scope 下）
        │
        ▼
任务到期 → 推进 next_run / 认领 → 拉起 agent session
        │
        ▼
带 cron 会话设置的 AIAgent（通常 skip_memory=True）
        │
        ▼
可选投递 / 镜像到面向用户的会话（保持角色交替）
```

## 共同教训

调试「CLI 行、Telegram 不行」时，先比**边缘**：identity、鉴权、toolset、profile scope、投递——而不是先怀疑 `AIAgent` 里的模型算术。

## 下一章

开始 [代码导读]({{< ref "hermes/code-tour/01-reading-order" >}})。

## 延伸阅读

- `website/docs/developer-guide/gateway-internals.md`
- `website/docs/developer-guide/cron-internals.md`
- `gateway/AGENTS.md`、`cron/AGENTS.md`
