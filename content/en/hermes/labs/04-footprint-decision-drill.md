---
title: "Lab: Footprint decision drill"
description: "Pick the right Footprint Ladder rung for three feature prompts"
weight: 54
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab: Footprint decision drill

## Goal

For three feature ideas, choose a ladder rung, justify it in ≤5 bullets, and list files you would touch — without implementing them.

## Prereqs

- Read [Footprint Ladder]({{< ref "hermes/extend/01-footprint-ladder" >}}) and [Skills, plugins, and tools]({{< ref "hermes/extend/02-skills-plugins-tools" >}})

## Steps

For **each** scenario below, write:

1. Chosen rung (1–6)
2. Why lower rungs are insufficient (or why this rung is enough)
3. Files/paths you would touch (user space vs core)
4. One cache/session risk to watch

### Scenario A — Daily GitHub digest

“Every morning, summarize my open PRs and post to Telegram.”

### Scenario B — Custom weather API

“My company has an internal weather HTTP API with a private token; the agent should call it with structured args.”

### Scenario C — React to Discord messages

“When someone reacts with 👀, the bot should acknowledge in-thread.”

## Expected outcome

A short writeup (markdown note is fine) with three decisions. Suggested reference answers (compare after you write yours):

| Scenario | Suggested rung | Why |
| -------- | -------------- | --- |
| A | CLI/cron + skill (and gateway delivery) | Scheduling + procedure; reuse `cron` / messaging — not a new core tool |
| B | Plugin tool (or MCP) | Niche authenticated API; keep token in secrets; avoid core schema |
| C | Gateway / Discord adapter edge feature | Reaction handling is platform surface, not an `AIAgent` core tool |

Your answers may differ slightly; the grading bar is **reasoning quality**, not identical labels.

## Verify

1. None of your plans start with “add to `_HERMES_CORE_TOOLS`” without exhausting lower rungs
2. Scenario B does not put the API token in `config.yaml`
3. Scenario C does not propose `check_fn` based solely on `HERMES_DESKTOP`

## Common pitfalls

- Treating “agent should do X” as automatic justification for a core tool
- Putting cron logic inside a skill with no durable scheduler
- Solving Discord UX inside `run_agent.py`

## Stretch

- Re-do Scenario A with `no_agent` script-only cron vs full agent cron — when is each better?
- See `website/docs/user-guide/features/cron.md` and `website/docs/guides/`

## Next lab

[Cache-safe change review]({{< ref "hermes/labs/05-cache-safe-change-review" >}})
