---
title: "Lab: Cache-safe change review"
description: "Mark proposed changes PASS or FAIL against caching, alternation, and session-surface rules"
weight: 55
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab: Cache-safe change review

## Goal

Review six short “proposed PR” ideas. Mark each **PASS** or **FAIL** against Hermes invariants, and cite the rule you used.

## Prereqs

- [Design philosophy]({{< ref "hermes/architecture/01-design-philosophy" >}})
- [Design invariants]({{< ref "hermes/architecture/03-design-invariants" >}})

## Steps

Copy the table and fill Verdict + Rule.

| # | Proposal | Verdict (PASS/FAIL) | Rule |
| - | -------- | ------------------- | ---- |
| 1 | Rebuild the system prompt every turn to inject the latest memory prefetch | | |
| 2 | Skill slash command appends instructions as a **user** message | | |
| 3 | Mid-loop, insert an extra `user` message between tool results to “nudge” the model | | |
| 4 | Add a widely useful primitive to `_HERMES_CORE_TOOLS` after proving terminal+skill cannot do it | | |
| 5 | Gate a desktop-only pane tool with `check_fn` that returns `os.getenv("HERMES_DESKTOP") == "1"` | | |
| 6 | Context compression summarizes middle turns when the window is full | | |

## Expected outcome

You can explain each verdict in one sentence. Reference answers:

| # | Verdict | Rule |
| - | ------- | ---- |
| 1 | **FAIL** | Prompt caching / byte-stable system prompt — memory belongs in overlays or other non-prefix channels, not a rebuild every turn |
| 2 | **PASS** | Skills inject as user messages; preserves cached prefix |
| 3 | **FAIL** | Strict role alternation — no synthetic user mid-loop (steer has a specific legal shape) |
| 4 | **PASS** | Core tool last is allowed when lower rungs truly fail and the tool is fundamental |
| 5 | **FAIL** | Session surface ≠ process env — use session/toolset gating, not desktop env `check_fn` alone |
| 6 | **PASS** | Compression is the sanctioned cache break |

## Verify

1. Your FAIL set includes at least proposals 1, 3, and 5
2. You marked 2 and 6 PASS
3. For proposal 4, you can restate the “lower rungs first” caveat

## Common pitfalls

- Marking 4 FAIL always — core tools are last, not forbidden
- Marking 5 PASS because “desktop sets the env” — remote/cloud backends break that assumption
- Forgetting that `/steer` is a documented exception with a precise placement

## Stretch

- Invent two more proposals (one PASS, one FAIL) and trade with a peer
- Skim `website/docs/developer-guide/context-compression-and-caching.md`

## Done

Return to the [series home]({{< ref "hermes" >}}) or re-run [Practice checklist]({{< ref "hermes/extend/03-practice-checklist" >}}) on a real idea you care about.
