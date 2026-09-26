---
title: "What is Hermes"
description: "One agent core across CLI, gateway, TUI, and Desktop — capability at the edges"
weight: 11
draft: false
tags: ["hermes", "agent", "getting-started"]
---

# What is Hermes

Hermes is a personal AI agent with **one agent core** shared across many surfaces:

- **CLI** — interactive terminal assistant
- **Messaging gateway** — Telegram, Discord, Slack, and many other platforms
- **TUI** — Ink terminal UI (`hermes --tui`)
- **Desktop** — Electron app talking to the same backend over JSON-RPC

It learns across sessions (memory + skills), can delegate to subagents, run scheduled jobs, and drive a real terminal and browser. New capability should arrive primarily as **plugins and skills**, not by growing the core forever.

## Mental model

```text
  CLI / Gateway / TUI / Desktop / Cron / ACP
                    │
                    ▼
              AIAgent (one core)
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Prompt      Providers    Tools
     + cache                  + backends
```

Everything above the core is an **entry point**. Platform differences belong there — not inside `AIAgent`.

## Two ideas you will see everywhere

1. **Prompt caching is sacred.** A long conversation reuses a cached system-prompt prefix every turn. Mutating past context, swapping toolsets, or rebuilding the system prompt mid-conversation multiplies cost. Compression is the rare, sanctioned exception.
2. **Narrow waist, rich edges.** Every *core* model tool is sent on every API call. Prefer skills, CLI commands, plugins, or MCP before adding a new core tool.

You will study both in depth under [Architecture]({{< ref "hermes/architecture" >}}).

## What you will build toward

By the end of this series you should be able to:

- Run Hermes and verify a clean chat
- Explain the architecture in one diagram
- Find code by topic (`stem_*.py` siblings, not god-file reading)
- Choose the right extension rung (skill → plugin → tool)
- Complete the [Labs]({{< ref "hermes/labs" >}}) without touching core source

## Next

[Install and first chat]({{< ref "hermes/getting-started/02-install-and-first-chat" >}})

## Further reading

- Repository root `AGENTS.md` — project invariants
- Official docs: `website/docs/getting-started/`
