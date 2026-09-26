---
title: "System map"
description: "Entry points, AIAgent core, tools, backends, and directory map"
weight: 22
draft: false
tags: ["hermes", "agent", "architecture"]
---

# System map

Orient yourself in the codebase, then dive by subsystem.

## Big picture

```text
┌─────────────────────────────────────────────────────────────┐
│                     Entry Points                             │
│  CLI (cli.py)   Gateway (gateway/run.py)   ACP   Batch/API   │
│  TUI / Desktop (tui_gateway)               Cron              │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  AIAgent (run_agent.py facade)               │
│  Prompt builder │ Provider resolution │ Tool dispatch        │
│  Compression/cache │ API modes │ Session persistence         │
└───────────┬─────────────────────────────┬───────────────────┘
            ▼                             ▼
   Session storage (SQLite)      Tool backends
   hermes_state*.py              terminal / browser / web / MCP …
```

## Directory map (load-bearing)

| Path | Role |
| ---- | ---- |
| `run_agent.py` | Public `AIAgent` facade |
| `agent/conversation_loop.py` + `agent/turn_*.py` | Real turn loop and phases |
| `agent/prompt_builder.py` | System prompt assembly |
| `model_tools.py` | Discover tools, build schemas, `handle_function_call` |
| `tools/registry.py` | Zero-dep registry; tools self-register on import |
| `toolsets.py` | Bundles / `_HERMES_CORE_TOOLS` — **exposure** gate |
| `tools/` | Tool implementations + backends |
| `gateway/` | Messaging adapters, authz, sessions, slash commands |
| `hermes_cli/` | CLI subcommands, config, plugins loader, updater |
| `plugins/` | Memory, model providers, context engines, … |
| `skills/` / `optional-skills/` | Bundled and opt-in skills |
| `tui_gateway/` | JSON-RPC backend for TUI + Desktop |
| `cron/` | Scheduler + job store |

## Dependency chain (tools)

```text
tools/registry.py          (no deps)
       ↑
tools/*.py                 (registry.register() at import)
       ↑
model_tools.py             (discovery + dispatch)
       ↑
run_agent.py / cli.py / gateway / batch_runner / environments
```

Registration happens at import time. A tool file with top-level `registry.register()` is discovered automatically — but it is only **exposed** if a toolset names it.

## Subsystems to know by name

- **Prompt + caching** — `prompt_builder`, compression, Anthropic cache breakpoints
- **Providers** — plugin profiles under `plugins/model-providers/`
- **Memory** — `MemoryProvider` ABC + manager; cron often skips memory
- **Delegation** — `tools/delegate_tool.py` (subagents)
- **Profiles / multiplex** — one process may serve many homes; scope must be bound per activity

## Next

[Design invariants]({{< ref "hermes/architecture/03-design-invariants" >}})

## Further reading

- `website/docs/developer-guide/architecture.md`
- `website/docs/developer-guide/agent-loop.md`
- `website/docs/developer-guide/tools-runtime.md`
