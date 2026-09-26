---
title: "Footprint Ladder"
description: "选择仍能解决问题的最高档位 — 核心工具最后"
weight: 41
draft: false
tags: ["hermes", "agent", "extend"]
---

# Footprint Ladder

新能力应从**仍够用的最小 footprint** 往上选。

## 档位

1. **扩展已有代码** — 零新表面
2. **CLI 命令 + skill** — 用 `hermes <subcommand>` + skill 教 Agent；许多工作流的默认档
3. **服务门控工具（`check_fn`）** — 仅当前置已配置才出现（进程/profile 可达性——**不是**「谁在看」）
4. **Plugin** — 第三方 / 小众 / 用户私有；`~/.hermes/plugins/` 或 pip
5. **MCP server（目录）** — 像工具但非核心必需
6. **新核心工具** — 最后手段：基础、广泛有用、且终端+文件/skill/MCP 够不到

## 为何有这个顺序

核心工具 schema 几乎出现在每次 API 调用。Skills 与 plugins 保持细腰，同时在边缘交付能力——对齐 [设计哲学]({{< ref "hermes/architecture/01-design-philosophy" >}})。

## Session vs 进程门控

| 问题 | 正确机制 |
| ---- | -------- |
| Home Assistant 配好了吗？ | `check_fn` / toolset 启用 |
| 有 GUI session 在看吗？ | 来自 session 平台的具名 toolset — 不要只靠 `HERMES_DESKTOP` |
| 只为某一用户的小众 API？ | Plugin |

## 快速例子

| 想法 | 大概档位 |
| ---- | -------- |
| 记录 Agent 应遵循的部署清单 | Skill |
| 包装带鉴权的内部 HTTP API | Plugin 工具 |
| 把 WhatsApp 变成聊天表面 | 平台适配器（边缘），不是核心工具 |

完整练习见 [Footprint 决策演练]({{< ref "hermes/labs/04-footprint-decision-drill" >}})。

## 下一章

[Skills、plugins 与 tools]({{< ref "hermes/extend/02-skills-plugins-tools" >}})

## 延伸阅读

- 根目录 `AGENTS.md` § Footprint Ladder
- `plugins/AGENTS.md`
