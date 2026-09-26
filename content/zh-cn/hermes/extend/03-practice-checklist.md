---
title: "练习清单"
description: "提出或实现 Agent 改动前的自检"
weight: 43
draft: false
tags: ["hermes", "agent", "extend"]
---

# 练习清单

开 PR 或开始 lab 功能前使用。

## 1. 用一句话陈述用户问题

说不清，就是在发明基础设施。

## 2. 选定 Footprint Ladder 档位

写下档位名，以及**为何更低档不够**。「我想要一个工具」不是理由。

## 3. 列出会碰到的文件

| 档位 | 可能触点 |
| ---- | -------- |
| Skill | `~/.hermes/skills/<name>/SKILL.md`（+ scripts） |
| Plugin | 仅 `~/.hermes/plugins/<name>/` |
| 核心工具 | `tools/*.py` + `toolsets.py`（+ 测试）— 必须强力论证 |
| Gateway 适配器 | `gateway/platforms/` 或平台 plugin |

若清单同时包含 `run_agent.py` + `cli.py` + `gateway/run.py` 却只是小众功能——停下来重新选档。

## 4. 缓存 / 交替 / session 风险

- [ ] System prompt 跨轮稳定（或用户选择了 `--now` / 压缩）
- [ ] 没有非法的双 user/assistant 行
- [ ] 回合中指引是用户消息或工具结果
- [ ] 仅 GUI 行为是 session 作用域，不是只靠 env
- [ ] 次要 profile 不会读到启动 profile 的密钥

## 5. 你会写的测试

- 偏好**行为契约**，而不是模型列表 / 配置版本快照
- 涉及解析、配置、安全或 I/O：用真实 import + 临时 `HERMES_HOME` 做 E2E
- 用 `scripts/run_tests.sh`，不要裸 `pytest` 且带着密钥

## 6. 文档 / AGENTS.md

- 上游贡献：同 PR 更新区域 `AGENTS.md` 与用户/开发者文档
- 对本 Hugo 系列：把笔记写在 lab 里，而不是改核心

## 去练习

1. [追踪一轮对话]({{< ref "hermes/labs/01-trace-one-turn" >}})
2. [编写一个 Skill]({{< ref "hermes/labs/02-write-a-skill" >}})
3. [编写一个 Plugin 工具]({{< ref "hermes/labs/03-write-a-plugin-tool" >}})
4. [Footprint 决策演练]({{< ref "hermes/labs/04-footprint-decision-drill" >}})
5. [缓存安全变更评审]({{< ref "hermes/labs/05-cache-safe-change-review" >}})
