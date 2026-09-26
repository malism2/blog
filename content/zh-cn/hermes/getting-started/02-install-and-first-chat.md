---
title: "安装与首次对话"
description: "安装 Hermes、选择 Provider，并验证一次可用对话"
weight: 12
draft: false
tags: ["hermes", "agent", "getting-started"]
---

# 安装与首次对话

目标：从零到**已验证**的对话。在此之前不要加消息机器人、cron 或自定义工具。

## 1. 安装

### Desktop 安装包（macOS / Windows）

从项目站点下载 Hermes Desktop 安装包并运行，可同时获得 CLI 与桌面端。

### 仅 CLI — Linux / macOS / WSL2 / Termux

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

之后重载 shell：

```bash
source ~/.bashrc   # 或 ~/.zshrc
```

### 仅 CLI — Windows（PowerShell）

```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

### 确认命令可用

```bash
hermes --help
```

## 2. 选择 Provider

| 目标 | 先做 | 然后 |
| ---- | ---- | ---- |
| 最快上手 | `hermes setup`（常含 portal/OAuth） | 聊一次 |
| 已知道 Provider | `hermes model` | 保存配置再聊 |
| 本地 / 自建端点 | `hermes model` → 自定义 endpoint | 核对模型名与上下文长度 |
| 常驻消息机器人 | 先让 CLI 对话变绿 | 再 `hermes gateway setup` |

**法则：** 若普通对话都不通，先修好，再堆功能。

## 3. 第一次对话

启动 CLI：

```bash
hermes
```

或一次性查询：

```bash
hermes -q "Reply with exactly: hermes-ok"
```

你要的是真实模型回复，而不是凭证或路由错误。

### 失败时

1. 重跑 `hermes model` / `hermes setup`，确认 Provider 凭证
2. 确认密钥在 `~/.hermes/.env`（或当前 profile 的 home），不要只依赖临时 shell export
3. 查看 `~/.hermes/logs/`（`agent.log`、`errors.log`）或 `hermes logs`

使用 `hermes -p <name>` 时，home 是该 profile 目录，不一定是 `~/.hermes`。

## 4. 可选：消息（CLI 通了之后）

```bash
hermes gateway setup
```

## 预期结果

- `hermes` 能启动且无配置崩溃
- 至少完成一轮 user → assistant
- 知道当前 home 下配置与日志在哪

## 下一章

[CLI 与配置基础]({{< ref "hermes/getting-started/03-cli-and-config-basics" >}})

## 延伸阅读

- `website/docs/getting-started/installation.md`
- `website/docs/getting-started/quickstart.md`
