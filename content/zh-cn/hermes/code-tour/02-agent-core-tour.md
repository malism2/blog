---
title: "Agent 核心导读"
description: "run_agent facade、conversation_loop、turn 阶段与 prompt 组装"
weight: 32
draft: false
tags: ["hermes", "agent", "code-tour"]
---

# Agent 核心导读

在仓库里打开这些文件。扫读即可，不必背参数列表。

## 1. `run_agent.py` — facade

`AIAgent` 由 mixin 组装，构造走 `agent/agent_init.py`。公开接口包括：

- `chat(message) -> str`
- `run_conversation(...)` — 返回 `final_response` + `messages`

入门先关心 `model`、`provider`、`enabled_toolsets`、`platform`、`session_id`。

## 2. `agent/conversation_loop.py` — 循环

概念形状（简化）：

```python
while under_iteration_budget:
    if interrupted:
        break
    response = client.chat.completions.create(
        model=model, messages=messages, tools=tool_schemas
    )
    if response.tool_calls:
        for tc in response.tool_calls:
            messages.append(tool_result_message(
                handle_function_call(tc.name, tc.args, task_id)
            ))
    else:
        return response.content
```

真实代码还有预检、重试、overflow、压缩、用量与收尾——各在 `agent/turn_*.py`。

## 3. 按名字扫 `agent/turn_*.py`

```bash
rg -n "^def " agent/turn_*.py
```

## 4. Prompt 组装

- `agent/prompt_builder.py`
- 相关：prompt caching、compression facade

稳定/上下文层可缓存；临时覆盖不要随便改写缓存前缀。见 [设计不变量]({{< ref "hermes/architecture/03-design-invariants" >}})。

## 5. 内联 / Agent 级工具

部分工具（`todo`、`memory`…）经 `agent/inline_tool_executors.py` 的 `INLINE_TOOL_EXECUTORS` 在 `handle_function_call()` 前拦截。新增用表驱动，不要 `if name == ...` 长链。

## 练习（约 10 分钟）

1. 找到 `AIAgent.run_conversation` 并确认它委托给 conversation loop
2. 列出五个 `turn_*.py` 文件名，从名字猜阶段
3. 找到 tool schemas 传入 API 调用的位置

## 下一章

[工具与注册表]({{< ref "hermes/code-tour/03-tools-and-registry" >}})

## 延伸阅读

- `website/docs/developer-guide/agent-loop.md`
- `agent/AGENTS.md`
