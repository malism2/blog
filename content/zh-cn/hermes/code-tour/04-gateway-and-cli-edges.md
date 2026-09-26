---
title: "Gateway 与 CLI 边缘"
description: "消息与 CLI 如何绑定同一 AIAgent，而不把平台逻辑塞进核心"
weight: 34
draft: false
tags: ["hermes", "agent", "code-tour"]
---

# Gateway 与 CLI 边缘

核心保持平台无关。意外发生在边缘。

## Gateway facade

- `gateway/run.py` — facade
- `gateway/run_*.py` — 各阶段
- `gateway/platforms/<name>.py` — 每平台一个适配器
- 斜杠：mixin + `_command_handler_table`（不要长 `if canonical ==`）

每个事件**只规范化一次** identity（`gateway/session_identity.py`）。

### Busy 守卫（两道都重要）

Agent 运行时：

1. 适配器可能把入站文本排入活动会话队列
2. Runner 在当普通聊天处理前拦截控制命令（`/stop`、`/approve`…）

必须在阻塞中可用的新命令需要同时绕过**两者**。

## CLI 边缘

- `cli.py` — `HermesCLI` facade + mixins
- 斜杠：`_SLASH_DISPATCH` / `_handle_<name>_command` 约定
- 单一命令注册表：`hermes_cli/commands.py`
- 配置加载器因表面而异——CLI 能见、Gateway 不见，多半用错了 loader

## 边缘上的配置与密钥

- 行为 → `config.yaml`
- 密钥 → `.env` / secret scope
- 多路复用下适配器必须用共享 scoped 读取器，禁止 miss 后回落 `os.getenv` 泄出启动 profile

## TUI / Desktop

`tui_gateway` 说 JSON-RPC。Agent 行为仍在 Python——不要在 React 里重写一套。

## 练习

1. 找到 `COMMAND_REGISTRY` 或 `_SLASH_DISPATCH`，选一个命令定位 CLI 与 Gateway handler
2. 在 `gateway/platforms/base.py` 找到活动会话排队处
3. 扫一眼你在入门里用过的配置键在 defaults 中的位置

## 下一章

[扩展 → Footprint Ladder]({{< ref "hermes/extend/01-footprint-ladder" >}})

## 延伸阅读

- `gateway/AGENTS.md`、`hermes_cli/AGENTS.md`、`tui_gateway/AGENTS.md`
