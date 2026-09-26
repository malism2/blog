---
title: "Lab：追踪一轮对话"
description: "跟着带工具调用的对话走完 conversation_loop 与 handle_function_call"
weight: 51
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab：追踪一轮对话

## 目标

跑一轮会触发工具调用的对话，并把运行时路径映射到仓库里的具体符号。

## 前置

- 可用的 `hermes` 对话（[安装与首次对话]({{< ref "hermes/getting-started/02-install-and-first-chat" >}})）
- 建议：本地 hermes-agent 仓库只读阅读
- 终端/文件类 toolset 已启用

## 步骤

1. 启动 Hermes，提一个需要工具的问题，例如：
   - 「用你的工具显示当前工作目录。」
   - 或「列出当前目录下的文件。」
2. 观察 UI：最终回答前应能看到工具调用（名称 + 参数）。
3. 在仓库中（只读）按顺序打开：
   1. `agent/conversation_loop.py` — 找到带 `tools=` 的 Provider 调用循环
   2. `model_tools.py` — 找到 `handle_function_call`
   3. `tools/` 下对应工具模块 — 找到 `registry.register` 与 handler
4. 在纸上写出一轮工具回合后的角色序列：
   - `user` → `assistant`（含 `tool_calls`）→ `tool` → `assistant`（最终）

## 预期结果

- 会话中至少出现一次工具调用
- 一份短笔记：循环文件 → 分发函数 → handler 模块
- 角色序列符合严格交替规则

## 验证

1. UI 里看到的工具名出现在 `toolsets.py` 或已启用的 toolset 中
2. 能指到 `handle_function_call` 作为模型 → handler 的桥梁
3. **没有**修改任何核心文件

## 常见坑

- 问纯知识题导致从不调工具 — 把提示导向文件系统/shell
- 只读 `run_agent.py`，漏掉循环在 `conversation_loop.py`
- 把「UI 出现了工具」当成「一定在 `_HERMES_CORE_TOOLS`」— 要查当前平台 toolset

## 进阶

- CLI 通了后再用 gateway 消息复做一遍（`hermes gateway setup`），对照 [数据流]({{< ref "hermes/architecture/04-data-flows" >}})
- Telegram：`website/docs/user-guide/messaging/telegram.md`

## 下一 Lab

[编写一个 Skill]({{< ref "hermes/labs/02-write-a-skill" >}})
