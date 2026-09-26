---
title: "Practice checklist"
description: "Self-check before you propose or implement an Agent change"
weight: 43
draft: false
tags: ["hermes", "agent", "extend"]
---

# Practice checklist

Use this before opening a PR or starting a lab feature.

## 1. State the user problem in one sentence

If you cannot, you are inventing infrastructure.

## 2. Pick a Footprint Ladder rung

Write the rung name and **why lower rungs fail**. “I want a tool” is not a reason.

## 3. Name the files you would touch

| Rung | Likely touch points |
| ---- | ------------------- |
| Skill | `~/.hermes/skills/<name>/SKILL.md` (+ scripts) |
| Plugin | `~/.hermes/plugins/<name>/` only |
| Core tool | `tools/*.py` + `toolsets.py` (+ tests) — justify hard |
| Gateway adapter | `gateway/platforms/` or platform plugin |

If your list includes `run_agent.py` + `cli.py` + `gateway/run.py` for a niche feature, stop and re-rung.

## 4. Cache / alternation / session risks

- [ ] System prompt remains stable across turns (or user opted into `--now` / compression)
- [ ] No illegal double user/assistant rows
- [ ] Mid-turn guidance is user message or tool result
- [ ] GUI-only behavior is session-scoped, not env-only
- [ ] Secondary profiles do not read launch-profile secrets

## 5. Tests you would write

- Prefer **behavior contracts** over snapshots of model lists / config versions
- Anything touching resolution, config, security, or I/O: E2E with real imports and temp `HERMES_HOME`
- Run via `scripts/run_tests.sh`, not bare `pytest` with keys set

## 6. Docs / AGENTS.md

- New behavior: update the area `AGENTS.md` and user/developer docs in the same change when contributing upstream
- For this Hugo series, capture your notes in lab writeups instead of patching core

## Go practice

1. [Trace one turn]({{< ref "hermes/labs/01-trace-one-turn" >}})
2. [Write a skill]({{< ref "hermes/labs/02-write-a-skill" >}})
3. [Write a plugin tool]({{< ref "hermes/labs/03-write-a-plugin-tool" >}})
4. [Footprint decision drill]({{< ref "hermes/labs/04-footprint-decision-drill" >}})
5. [Cache-safe change review]({{< ref "hermes/labs/05-cache-safe-change-review" >}})
