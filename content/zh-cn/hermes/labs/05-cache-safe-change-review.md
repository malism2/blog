---
title: "Lab：缓存安全变更评审"
description: "对照 caching、角色交替与 session 表面规则，给提案打 PASS/FAIL"
weight: 55
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab：缓存安全变更评审

## 目标

评审六个简短「拟议 PR」。对每个标 **PASS** 或 **FAIL**，并引用你用的规则。

## 前置

- [设计哲学]({{< ref "hermes/architecture/01-design-philosophy" >}})
- [设计不变量]({{< ref "hermes/architecture/03-design-invariants" >}})

## 步骤

复制下表并填写 Verdict + Rule。

| # | 提案 | Verdict（PASS/FAIL） | Rule |
| - | ---- | -------------------- | ---- |
| 1 | 每轮重建 system prompt，以注入最新 memory prefetch | | |
| 2 | Skill 斜杠命令把说明追加为**用户**消息 | | |
| 3 | 循环中途在 tool 结果之间插入额外 `user` 消息「推一把」 | | |
| 4 | 证明 terminal+skill 不够后，把广泛有用的原语加入 `_HERMES_CORE_TOOLS` | | |
| 5 | 用 `check_fn` 检查 `os.getenv("HERMES_DESKTOP") == "1"` 来门控仅桌面窗格工具 | | |
| 6 | 窗口满时，上下文压缩总结中间回合 | | |

## 预期结果

每条 verdict 能用一句话解释。参考答案：

| # | Verdict | Rule |
| - | ------- | ---- |
| 1 | **FAIL** | Prompt caching / system prompt 字节稳定 — 记忆不该每轮重建前缀 |
| 2 | **PASS** | Skills 以用户消息注入；保住缓存前缀 |
| 3 | **FAIL** | 严格角色交替 — 禁止循环中途合成 user（`/steer` 有特定合法形状） |
| 4 | **PASS** | 核心工具是最后档，不是禁区；低档真失败且足够基础时允许 |
| 5 | **FAIL** | Session 表面 ≠ 进程 env — 用 session/toolset 门控，不要只靠桌面 env `check_fn` |
| 6 | **PASS** | 压缩是被批准的缓存破坏 |

## 验证

1. FAIL 集合至少包含 1、3、5
2. 2 与 6 标为 PASS
3. 对提案 4 能复述「先低档」的限定语

## 常见坑

- 永远把 4 标 FAIL — 核心工具是最后，不是禁止
- 因「桌面会设 env」把 5 标 PASS — 远程/云后端会打破该假设
- 忘记 `/steer` 是有精确落点的文档化例外

## 进阶

- 再自撰两个提案（一 PASS 一 FAIL）与同伴交换
- 扫读 `website/docs/developer-guide/context-compression-and-caching.md`

## 完成

回到 [系列首页]({{< ref "hermes" >}})，或拿一个你真正关心的想法重跑 [练习清单]({{< ref "hermes/extend/03-practice-checklist" >}})。
