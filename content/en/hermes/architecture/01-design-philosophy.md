---
title: "Design philosophy"
description: "Why Hermes is expansive at the edges and conservative at the waist"
weight: 21
draft: false
tags: ["hermes", "agent", "architecture"]
---

# Design philosophy

This page is the *why*. Later pages turn it into maps, hard invariants, and labs.

## What Hermes optimizes for

Hermes ships **one agent core** and many surfaces (CLI, gateway, TUI, Desktop, cron, ACP). It should:

- Feel the same agent wherever you talk to it
- Learn across sessions (memory + skills) without silently rewriting the past mid-chat
- Grow capability at the **edges** (skills, plugins, MCP, platform adapters) instead of stuffing every idea into the core tool schema

## Two lenses for every change

Before you write code, ask:

### 1. Does this break per-conversation prompt caching?

Long conversations reuse a cached system-prompt **prefix** every turn. Anything that mutates past context, swaps toolsets, reloads memories into the system prompt, or rebuilds the system prompt mid-conversation invalidates that cache and multiplies cost.

**Compression** is the deliberate, sanctioned exception. Slash commands that change system-prompt state (skills, tools, memory) should default to **deferred** invalidation (next session), with an opt-in `--now`.

### 2. Does this widen the narrow waist?

Every *core* model tool is attached to (nearly) every API call. The bar for a new core tool is high. Prefer, in order: extend existing code → CLI + skill → service-gated tool → plugin → MCP → **new core tool last**.

That ordering is the **Footprint Ladder** — see [Extend]({{< ref "hermes/extend/01-footprint-ladder" >}}).

## Expansive edges, conservative waist

Hermes is **not** a tiny product. Platforms, providers, desktop/TUI features expand on purpose.

Restraint targets the **core agent + model tool schema** — the one place every addition is paid for on every API call:

| Expand freely (edges) | Be conservative (waist) |
| --------------------- | ----------------------- |
| Platform adapters, providers, desktop UI | New entries in core tool schemas |
| Skills, optional skills, plugins | Mid-conversation system-prompt mutation |
| Gateway features, dashboards | Speculative hooks with no consumer |

## Architecture design principles

From the official architecture guide, with “good / bad” examples for engineers:

| Principle | Good change | Bad change |
| --------- | ----------- | ---------- |
| **Prompt stability** | Inject guidance via a user message or tool result | Rebuild system prompt every turn to “refresh memory” |
| **Observable execution** | Stream tool progress through existing callbacks | Silent background side effects the user never sees |
| **Interruptible** | Respect cancel/interrupt during long tools | Ignore `/stop` while a tool runs forever |
| **Platform-agnostic core** | Put Discord quirks in the Discord adapter | Special-case Discord inside `AIAgent` |
| **Loose coupling** | Gate optional tools with `check_fn` / registries | Hard-import a niche SaaS SDK in the core loop |
| **Profile isolation** | Key state by profile home / secret scope | Read a secondary profile’s secrets from process `os.environ` under multiplex |

## Contribution taste (summary)

**Wanted:** fix real bugs end-to-end; expand reach at the edges; extract god-files into `stem_topic.py` siblings; keep the core narrow; extend instead of duplicating; assert behavior contracts in tests; prove E2E against a temp `HERMES_HOME`.

**Not wanted (even if polished):** speculative hooks; new `HERMES_*` env vars for non-secret config; a new core tool when terminal + file or a skill already suffice; lazy `offset`/`limit` on instructional tools (skills/prompts) so models only read page 1; “security fixes” that destroy the feature; outbound telemetry without opt-in; plugins that patch core files; third-party product plugins absorbed into the core tree.

## Facade + siblings culture

Large modules are a **facade** plus topical siblings (`gateway/run.py` + `run_*.py`, `agent/turn_*.py`). Find code by **topic**, not by reading the facade first. Do not grow facades past the split signal (~2k lines / heavy functions).

## Bridge to the next pages

| Next | What it adds |
| ---- | ------------ |
| [System map]({{< ref "hermes/architecture/02-system-map" >}}) | Boxes and directories |
| [Design invariants]({{< ref "hermes/architecture/03-design-invariants" >}}) | Enforceable must-not-break rules |
| [Footprint Ladder]({{< ref "hermes/extend/01-footprint-ladder" >}}) | How to add capability |
| [Labs]({{< ref "hermes/labs" >}}) | Practice saying no to the wrong rung |

## Further reading

- Root `AGENTS.md` — What Hermes Is, Contribution Rubric, Footprint Ladder
- `website/docs/developer-guide/architecture.md` § Design Principles
