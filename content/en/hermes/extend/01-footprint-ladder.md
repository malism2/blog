---
title: "Footprint Ladder"
description: "Choose the highest rung that still solves the problem — core tools last"
weight: 41
draft: false
tags: ["hermes", "agent", "extend"]
---

# Footprint Ladder

Every new capability should climb from the **least footprint** that still works.

## The rungs

1. **Extend existing code** — variation of something that exists; zero new surface
2. **CLI command + skill** — express setup/ops as `hermes <subcommand>` + a skill that teaches the agent; default for many workflows
3. **Service-gated tool (`check_fn`)** — structured tool that appears only when a prerequisite is configured (process/profile reachability — **not** “who is watching”)
4. **Plugin** — third-party / niche / user-specific; `~/.hermes/plugins/` or pip entry points
5. **MCP server (catalog)** — tool-shaped but not core-fundamental; reusable across MCP hosts
6. **New core tool** — last resort: fundamental, broadly useful, unreachable via terminal + file / skill / MCP

## Why the order exists

Core tool schemas ride (nearly) every API call. Skills and plugins keep that waist thin while still shipping power at the edges — matching [Design philosophy]({{< ref "hermes/architecture/01-design-philosophy" >}}).

## Session vs process gates

| Question | Right mechanism |
| -------- | --------------- |
| Is Home Assistant configured? | `check_fn` / toolset enablement |
| Is a GUI session watching? | Named toolset from session platform — not `HERMES_DESKTOP` alone |
| Is this only for one user’s niche API? | Plugin |

## Decision drill (preview)

Practice fully in [Footprint decision drill]({{< ref "hermes/labs/04-footprint-decision-drill" >}}). Quick examples:

| Idea | Likely rung |
| ---- | ----------- |
| Document a deploy checklist the agent should follow | Skill |
| Wrap a private internal HTTP API as a tool | Plugin tool |
| Add WhatsApp as a chat surface | Platform adapter (edge), not a core tool |
| Universal `read_file`-class primitive | Already core — extend carefully |

## Next

[Skills, plugins, and tools]({{< ref "hermes/extend/02-skills-plugins-tools" >}})

## Further reading

- Root `AGENTS.md` § Footprint Ladder
- `website/docs/developer-guide/adding-tools.md`
- `plugins/AGENTS.md`
