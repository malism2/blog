---
title: "Lab：编写一个 Plugin 工具"
description: "在 ~/.hermes/plugins 下用 register(ctx) 挂一个最小可调用工具"
weight: 53
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab：编写一个 Plugin 工具

## 目标

在 `~/.hermes/plugins/` 注册一个 plugin 工具（或 hook），不碰核心。

## 前置

- Hermes 对话可用
- 已读 [Footprint Ladder]({{< ref "hermes/extend/01-footprint-ladder" >}})
- 注意：plugin manifest 字段可能随版本演进——若发现失败，以你安装版本的 `website/docs/developer-guide/plugins/index.md` 与 `hermes plugins` / doctor 为准

## 步骤

1. 创建目录：

```bash
mkdir -p ~/.hermes/plugins/lab-echo
```

2. 最小清单 `~/.hermes/plugins/lab-echo/plugin.yaml`（示意）：

```yaml
name: lab-echo
version: 0.1.0
description: Tutorial echo tool for Agent eng labs
```

3. `~/.hermes/plugins/lab-echo/__init__.py`（示意 API——按你的 Hermes 版本调整 ctx）：

```python
import json


def register(ctx):
    def echo_handler(args, **kwargs):
        text = (args or {}).get("text", "")
        return json.dumps({"success": True, "echo": text})

    ctx.register_tool(
        name="lab_echo",
        description="Echo text back as JSON (tutorial plugin).",
        parameters={
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to echo"}
            },
            "required": ["text"],
        },
        handler=echo_handler,
    )
```

4. 重启 Hermes / 重新加载 plugins（新进程最稳妥）。
5. 对话：「用 lab_echo 回显文本 ping-lab」。

可选：注册 `pre_tool_call` 记录工具名——仍只写在 plugin 包内。

## 预期结果

- 有 manifest + `register(ctx)`
- 模型能调用 `lab_echo`（或得到可在用户空间修复的明确启用错误）
- hermes-agent 受控源码零修改

## 验证

1. `hermes plugins` / doctor 列出插件或给出可操作错误
2. 工具调用返回含你文本的 JSON
3. 没有把工具加进 `tools/` 或 `toolsets.py`

## 常见坑

- 因为「注册看起来很像」就去改核心 `tools/` — 跳过了梯子
- 放下插件后忘记重启进程
- API 漂移 — 对照*你的*版本文档修，lab 仍留在用户目录

## 进阶

- 增加 `pre_tool_call`，给某一工具名前缀化 args
- 阅读原生兼容规则：`plugins/AGENTS.md`

## 下一 Lab

[Footprint 决策演练]({{< ref "hermes/labs/04-footprint-decision-drill" >}})
