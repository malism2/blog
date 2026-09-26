---
title: "Skills, plugins, and tools"
description: "When each extension style wins — and what plugins must never do"
weight: 42
draft: false
tags: ["hermes", "agent", "extend"]
---

# Skills, plugins, and tools

Three common extension styles. Pick one on purpose.

## Skills

- Markdown procedures (`SKILL.md`) plus optional `scripts/`, `references/`
- Teach the agent *how* to use existing tools well
- Slash skill commands inject as **user messages** (cache-friendly)
- Authoring standards matter (short description, native tool names in backticks, platforms gating, tests)

User-created skills live under `~/.hermes/skills/`. Bundled skills ship in `skills/`; heavier ones in `optional-skills/`.

## Plugins

- Live in `~/.hermes/plugins/`, project plugins, or pip entry points
- `register(ctx)` can attach hooks (`pre_tool_call`, `post_llm_call`, …), tools, CLI subcommands
- **Must not** modify core files (`run_agent.py`, `cli.py`, `gateway/run.py`, …)
- If you need a missing capability, widen the **generic** plugin surface — never hardcode one plugin into core
- Third-party product backends belong out-of-tree (catalog / standalone repo), not absorbed into `plugins/` as someone else’s SaaS

Kinds include general plugins, memory providers, model providers, context engines, image-gen, platform adapters — each with its own discovery rules (`plugins/AGENTS.md`).

## Tools (model-callable)

- Structured JSON in / JSON string out
- Core tools: `tools/*.py` + `toolsets.py` (high bar)
- Plugin tools: `ctx.register_tool(...)` (preferred for niche)
- Service-gated tools: `check_fn` + optional `requires_env`

## Side-by-side

| | Skill | Plugin tool | Core tool |
| - | ----- | ----------- | --------- |
| Schema on every API call | No | Only when plugin loaded / enabled | Yes if in selected toolsets |
| Best for | Procedures, checklists | Niche APIs, hooks | Universal primitives |
| Touches core tree | No | No | Yes |

## Cache note

Installing or enabling skills/tools that change system-prompt state should default to **deferred** invalidation; use `--now` when you intentionally pay the cache break.

## Next

[Practice checklist]({{< ref "hermes/extend/03-practice-checklist" >}}) · [Write a skill lab]({{< ref "hermes/labs/02-write-a-skill" >}}) · [Write a plugin tool lab]({{< ref "hermes/labs/03-write-a-plugin-tool" >}})

## Further reading

- `website/docs/developer-guide/creating-skills.md`
- `website/docs/developer-guide/plugins/index.md`
- `skills/AGENTS.md`, `plugins/AGENTS.md`
