---
title: "Lab：编写一个 Skill"
description: "在 ~/.hermes/skills 下写最小 SKILL.md，并以对缓存安全的方式调用"
weight: 52
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab：编写一个 Skill

## 目标

在**用户目录**创建最小 skill，不改 Hermes 核心。

## 前置

- Hermes 对话可用
- 能编辑 Hermes home 下文件（`~/.hermes/` 或 profile home）

## 步骤

1. 创建 skill 目录：

```bash
mkdir -p ~/.hermes/skills/hello-agent-eng
```

2. 写入 `~/.hermes/skills/hello-agent-eng/SKILL.md`：

```markdown
---
name: hello-agent-eng
description: Prints a short Agent eng checklist via terminal.
version: 0.1.0
author: Your Name
license: MIT
metadata:
  hermes:
    tags: [tutorial, lab]
    category: productivity
---

# Hello Agent Eng Skill

练习 Hermes 扩展 Labs 时使用本 skill。

## When to Use

- 想用一个极小 skill 验证加载是否正常

## How to Run

1. 用五条要点概括 Footprint Ladder。
2. 若需要一行 shell，使用 `terminal` 工具 — 不要把其他 CLI 当主界面。

## Quick Reference

| 步骤 | 动作 |
| ---- | ---- |
| 1 | 重述用户目标 |
| 2 | 选择 Footprint Ladder 档位 |
| 3 | 列出缓存风险 |
```

3. 按安装方式加载/刷新 skills（`/skills`、`hermes skills` 或重启会话）。若提示影响 system prompt，优先**延迟**生效；只有你愿意立刻付缓存代价时才用 `--now`。
4. 调用 skill（斜杠命令，或说：「按 hello-agent-eng skill 执行」）。

## 预期结果

- 目录与合法 frontmatter 存在
- Agent 遵循清单（或明确加载了 skill 内容）
- 理解 deferred 与 `--now`

## 验证

1. `description` 保持一句短句（冲上游质量时 ≤ 60 字符）
2. 正文用反引号引用原生工具（如 `terminal`），而不是把 `grep`/`cat` 当主界面
3. hermes-agent git 树无改动

## 常见坑

- 把 skill 写进仓库的 `skills/`（那是内置贡献区，不是本 lab）
- description 写成小说，污染列表
- 习惯性 `--now`，然后奇怪对话为何变贵

## 进阶

- 增加 `scripts/hello.py`，经 `terminal` 用 skill 相对路径调用
- 阅读 `skills/AGENTS.md` / `website/docs/developer-guide/creating-skills.md`

## 下一 Lab

[编写一个 Plugin 工具]({{< ref "hermes/labs/03-write-a-plugin-tool" >}})
