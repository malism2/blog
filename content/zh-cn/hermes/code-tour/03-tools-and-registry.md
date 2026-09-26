---
title: "工具与注册表"
description: "registry → toolsets → model_tools：发现、暴露与分发"
weight: 33
draft: false
tags: ["hermes", "agent", "code-tour"]
---

# 工具与注册表

三份文件讲清工具故事。记住这条链。

## 链条

```text
tools/registry.py  →  tools/*.py register()  →  model_tools.py 发现
                              ↓
                        toolsets.py 决定模型看见什么
                              ↓
                   handle_function_call() 分发 handler
```

## `tools/registry.py`

- 零项目依赖
- `registry.register(name=..., toolset=..., schema=..., handler=..., check_fn=...)`
- `check_fn` 回答当前 **profile** 下的可达/选择加入；结果按 hermes home 做 TTL 缓存
- Handler 返回 **JSON 字符串**

## `toolsets.py`

- 单一 `TOOLSETS` 与 `_HERMES_CORE_TOOLS`
- **已注册但未进入所选 toolset ⇒ 模型不可见**

## `model_tools.py`

- 触发 `discover_builtin_tools()`
- 构建 API 用的 tool schemas
- `handle_function_call()` 是 turn 循环的分发入口

## 加能力时的提醒

| 需求 | 优先 |
| ---- | ---- |
| Agent 应遵循的流程 | Skill |
| 小众 / 用户私有工具 | Plugin `ctx.register_tool` |
| 仅当某服务已配置 | 带 `check_fn` 的服务门控工具 |
| 近乎人人需要的原语 | 核心工具（最后手段） |

## Schema 卫生

- 不要在 schema 描述里硬编码其他 toolset 的工具名
- 展示路径用 `display_hermes_home()`；状态文件用调用时的 `get_hermes_home()`
- 教学类加载器不要 `offset`/`limit` 分页

## 练习

1. 打开任意 `tools/*_tool.py`，找到 `registry.register(...)`
2. 在 `toolsets.py` 中 grep 该工具名
3. 在 `model_tools.py` 找到 `handle_function_call`

## 下一章

[Gateway 与 CLI 边缘]({{< ref "hermes/code-tour/04-gateway-and-cli-edges" >}})

## 延伸阅读

- `website/docs/developer-guide/tools-runtime.md`
- `tools/AGENTS.md`
