---
title: "系统地图"
description: "入口、AIAgent 核心、工具、后端与目录地图"
weight: 22
draft: false
tags: ["hermes", "agent", "architecture"]
---

# 系统地图

先建立全局方位，再按子系统深入。

## 总览

```text
┌─────────────────────────────────────────────────────────────┐
│                     入口                                      │
│  CLI (cli.py)   Gateway (gateway/run.py)   ACP   Batch/API   │
│  TUI / Desktop (tui_gateway)               Cron              │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  AIAgent（run_agent.py facade）               │
│  Prompt builder │ Provider 解析 │ 工具分发                     │
│  压缩/缓存 │ API 模式 │ 会话持久化                             │
└───────────┬─────────────────────────────┬───────────────────┘
            ▼                             ▼
   会话存储（SQLite）              工具后端
   hermes_state*.py              terminal / browser / web / MCP …
```

## 目录地图（承重）

| 路径 | 角色 |
| ---- | ---- |
| `run_agent.py` | 公开 `AIAgent` facade |
| `agent/conversation_loop.py` + `agent/turn_*.py` | 真正的 turn 循环与各阶段 |
| `agent/prompt_builder.py` | System prompt 组装 |
| `model_tools.py` | 发现工具、构建 schema、`handle_function_call` |
| `tools/registry.py` | 零依赖注册表；工具 import 时自注册 |
| `toolsets.py` | 捆绑 / `_HERMES_CORE_TOOLS` — **暴露**门控 |
| `tools/` | 工具实现与后端 |
| `gateway/` | 消息适配器、鉴权、会话、斜杠命令 |
| `hermes_cli/` | CLI 子命令、配置、plugins、更新器 |
| `plugins/` | Memory、model providers、context engines… |
| `skills/` / `optional-skills/` | 内置与可选 skills |
| `tui_gateway/` | TUI + Desktop 的 JSON-RPC 后端 |
| `cron/` | 调度器与任务存储 |

## 工具依赖链

```text
tools/registry.py
       ↑
tools/*.py（import 时 register）
       ↑
model_tools.py（发现 + 分发）
       ↑
run_agent.py / cli.py / gateway / batch_runner / environments
```

注册发生在 import 时。有顶层 `registry.register()` 的工具文件会被自动发现——但只有 toolset **点名**后，模型才看得到。

## 下一章

[设计不变量]({{< ref "hermes/architecture/03-design-invariants" >}})

## 延伸阅读

- `website/docs/developer-guide/architecture.md`
- `website/docs/developer-guide/agent-loop.md`
- `website/docs/developer-guide/tools-runtime.md`
