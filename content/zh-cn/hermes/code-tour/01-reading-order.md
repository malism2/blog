---
title: "阅读顺序"
description: "Facade + siblings：按主题找代码，不要先打开最大的文件"
weight: 31
draft: false
tags: ["hermes", "agent", "code-tour"]
---

# 阅读顺序

Hermes 把昔日的 god-file 拆成 **facade** 加主题 **siblings**。先读 facade 往往最贵。

## 习惯

1. 说出你关心的*主题*（overflow、斜杠命令、MCP 发现…）
2. 搜 siblings：`agent/turn_*.py`、`gateway/run_*.py`、`hermes_cli/cli_*_mixin.py`
3. 打开对应 sibling；再扫 facade 看公开入口

例：turn overflow 在 `agent/turn_overflow*.py` 一带，而不是只埋在 `run_agent.py`。

## Facade vs 循环

| 打开… | 实际得到… |
| ----- | --------- |
| `run_agent.py` | `AIAgent` 公开表面、mixin 组装、构造 |
| `agent/conversation_loop.py` | turn 的 `while` 循环 |
| `agent/turn_*.py` | 每文件一个阶段 |

## 在生产读取处打补丁

Siblings 常在函数内从 facade late-import，以便测试 `monkeypatch` facade 属性。只补定义模块可能静默 miss。

## 推荐导读序列

```text
tools/registry.py
  → toolsets.py
  → model_tools.py
  → agent/conversation_loop.py（+ 扫一眼 turn_*.py 文件名）
  → run_agent.py（仅 facade）
  → agent/prompt_builder.py
  → gateway/run.py + 一个感兴趣的 run_*.py
  → hermes_cli/commands.py
```

## 下一章

[Agent 核心导读]({{< ref "hermes/code-tour/02-agent-core-tour" >}})

## 延伸阅读

- 根目录 `AGENTS.md` § Facade + siblings
- `website/docs/developer-guide/architecture.md`
