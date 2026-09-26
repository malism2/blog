---
title: "CLI 与配置基础"
description: "config.yaml 与 .env、tools、斜杠命令，以及状态存放位置"
weight: 13
draft: false
tags: ["hermes", "agent", "getting-started"]
---

# CLI 与配置基础

对话通了之后，先分清 Hermes 放状态的三个地方——以及哪个才是密钥。

## 配置 vs 密钥

| 文件 | 用途 |
| ---- | ---- |
| `~/.hermes/config.yaml`（或 profile home） | 行为设置：模型默认、超时、显示、gateway、tools、cron… |
| `~/.hermes/.env` | **仅密钥**：API key、bot token、密码 |
| `~/.hermes/logs/` | `agent.log`、`errors.log`、`gateway.log` |

不要把超时、功能开关、显示偏好放进 `.env`。

常用命令：

```bash
hermes config get model
hermes config set display.skin default
hermes doctor
hermes logs --follow
```

## Tools 表面

```bash
hermes tools
```

可按平台启用/禁用 toolset。配置里也有 `tools.<platform>.enabled/disabled`。

## 会话内斜杠命令

命令来自统一注册表（`hermes_cli/commands.py`）。常见：

- `/help`
- `/model` — 切换模型（明确的用户动作）
- `/compress` — 被允许的上下文压缩
- `/skills` — skill 管理（影响 system prompt 的变更默认**延迟**失效；需要立刻生效再用 `--now`）

Skill 斜杠命令以**用户消息**注入，而不是改写 system prompt——这样能保住 prompt caching。

## 工作目录

- CLI：当前 `os.getcwd()`
- 消息 Gateway：`config` 里的 `terminal.cwd`

## Profiles（预览）

```bash
hermes -p work
```

Profile 是孤岛：各自的 home、密钥、会话与记忆。默认不做实时配置继承。

## 进入架构前自检

- [ ] 能成功对话
- [ ] 分清 `config.yaml` 与 `.env`
- [ ] 知道失败时去哪看日志
- [ ] 还没有「为了有工具而加核心工具」

## 下一章

[架构 → 设计哲学]({{< ref "hermes/architecture/01-design-philosophy" >}})

## 延伸阅读

- `website/docs/user-guide/configuration.md`
- `website/docs/user-guide/cli.md`
