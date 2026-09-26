---
title: "Skills、plugins 与 tools"
description: "每种扩展方式何时胜出 — 以及 plugin 绝不能做什么"
weight: 42
draft: false
tags: ["hermes", "agent", "extend"]
---

# Skills、plugins 与 tools

三种常见扩展方式。请有意识地选一种。

## Skills

- Markdown 流程（`SKILL.md`）+ 可选 `scripts/`、`references/`
- 教 Agent *如何*用好已有工具
- 斜杠 skill 以**用户消息**注入（对缓存友好）
- 用户 skill 在 `~/.hermes/skills/`；内置在 `skills/`；较重的在 `optional-skills/`

## Plugins

- 位于 `~/.hermes/plugins/`、项目插件或 pip entry points
- `register(ctx)` 可挂 hooks、tools、CLI 子命令
- **绝不能**改核心文件（`run_agent.py`、`cli.py`、`gateway/run.py`…）
- 缺能力时加宽**通用** plugin 表面，不要给单个 plugin 在核心里开后门
- 第三方产品后端应 out-of-tree（目录 / 独立仓库），不要吞进核心树的 `plugins/`

## Tools（模型可调用）

- 结构化 JSON 入 / JSON 字符串出
- 核心工具：`tools/*.py` + `toolsets.py`（高门槛）
- Plugin 工具：`ctx.register_tool(...)`（小众优先）
- 服务门控：`check_fn` + 可选 `requires_env`

## 对照

| | Skill | Plugin 工具 | 核心工具 |
| - | ----- | ----------- | -------- |
| 每次 API 都带 schema | 否 | 仅插件加载/启用时 | 若在所选 toolset 中则是 |
| 最适合 | 流程、清单 | 小众 API、hooks | 通用原语 |
| 碰核心树 | 否 | 否 | 是 |

## 缓存提示

安装/启用会改 system-prompt 状态的 skills/tools 应默认**延迟**失效；只有你愿意付缓存代价时才用 `--now`。

## 下一章

[练习清单]({{< ref "hermes/extend/03-practice-checklist" >}}) · [编写 Skill Lab]({{< ref "hermes/labs/02-write-a-skill" >}}) · [编写 Plugin 工具 Lab]({{< ref "hermes/labs/03-write-a-plugin-tool" >}})

## 延伸阅读

- `website/docs/developer-guide/creating-skills.md`
- `website/docs/developer-guide/plugins/index.md`
- `skills/AGENTS.md`、`plugins/AGENTS.md`
