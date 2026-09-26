---
title: "设计不变量"
description: "硬契约：prompt caching、角色交替、压缩、session 表面、profiles"
weight: 23
draft: false
tags: ["hermes", "agent", "architecture"]
---

# 设计不变量

哲学变成**契约**。打破它们就是 bug——即使 demo 看起来能跑。

## 1. System prompt 字节级稳定

一次对话生命周期内，system prompt 应保持字节稳定。

- 不要为了刷新 skills/memory/tools 中途重建
- 回合中内容走**用户消息**或**工具结果**
- Skill 斜杠命令以用户消息注入
- 子目录 `AGENTS.md` 提示追加到工具结果（不是 system prompt）

## 2. 压缩是被批准的缓存破坏

上下文压缩（Agent 压缩器 + Gateway 卫生阈值）是为长度而设计的历史变更方式。

- 让压缩成为**唯一**的常规缓存破坏
- 各表面的手动 `/compress` 应走共享入口

## 3. 严格角色交替

消息使用 OpenAI 形角色：`system | user | assistant | tool`。

- 不要连续两条同角色消息（tool_calls 之后连续多条 `tool` 除外）
- 不要在循环中途插入合成用户消息（例外：`/steer` 在合法边界）
- Cron 投递使用独立会话，部分原因也在此

## 4. Session 表面 ≠ 进程环境

依赖「谁在看」（桌面窗格、应用内浏览器等）的能力必须从 **session** 解析，而不是后端进程的环境变量。

- GUI 工具放进由 session 平台解析器折叠进来的具名 toolset
- **不要**只在进程级 `check_fn` 里用 `HERMES_DESKTOP=1` 门控
- `HERMES_DESKTOP=1` 表示「由应用拉起」，不表示「有 GUI 在看」

## 5. Profile 隔离与密钥作用域

多路复用时，`os.environ` 是**启动** profile。次要 profile 需要 scoped 密钥读取，以及为非回合路径显式绑定 runtime scope。

- 不要硬编码 `~/.hermes`——用 `get_hermes_home()` / `display_hermes_home()`
- 不要自造「scoped miss 后再 `os.environ`」的泄密读法

## 6. 注册 ≠ 暴露

`registry.register()` 让工具可被发现。出现在 `toolsets.py`（或平台 toolset 选择）里才对模型可见。

## 提案改动自测

1. 除非用户选择失效/压缩，system prompt 是否跨轮一致？
2. 历史是否仍合法交替？
3. 若仅 GUI，门控是否 session 作用域？
4. 若加工具，是否先爬过 Footprint Ladder？
5. 两个 profile 时，次要侧是否仍读到*自己的*密钥？

在 [缓存安全变更评审]({{< ref "hermes/labs/05-cache-safe-change-review" >}}) 上练习。

## 下一章

[数据流]({{< ref "hermes/architecture/04-data-flows" >}})

## 延伸阅读

- 根目录 `AGENTS.md`
- `website/docs/developer-guide/prompt-assembly.md`
- `website/docs/developer-guide/context-compression-and-caching.md`
