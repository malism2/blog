---
title: "Gateway and CLI edges"
description: "How messaging and CLI bind the same AIAgent without putting platform logic in the core"
weight: 34
draft: false
tags: ["hermes", "agent", "code-tour"]
---

# Gateway and CLI edges

The core stays platform-agnostic. Surprises live at the edges.

## Gateway facade

- `gateway/run.py` — facade
- `gateway/run_*.py` — phases (startup, adapters, inbound, turn, busy, shutdown, …)
- `gateway/platforms/<name>.py` — one adapter per platform over `platforms/base.py`
- Slash handlers: mixins + `_command_handler_table` (no long `if canonical ==` ladders)

Identity is canonicalized **once** per event (`gateway/session_identity.py`). Keys and authz should read that identity rather than reinvent routing.

### Busy guards (both matter)

While an agent runs:

1. Adapter may queue inbound text for the active session
2. Runner intercepts control commands (`/stop`, `/approve`, …) before treating them as normal chat

New “must work while blocked” commands need to bypass **both**.

## CLI edge

- `cli.py` — `HermesCLI` facade + mixins (`hermes_cli/cli_*_mixin.py`)
- Slash dispatch: `HermesCLI._SLASH_DISPATCH` / `_handle_<name>_command` convention
- Single command registry: `hermes_cli/commands.py` → CLI, gateway help, bot menus stay aligned
- Config loaders differ by surface — if CLI sees a key and gateway does not, you are on the wrong loader (`load_cli_config` vs effective/raw gateway loaders)

## Config and secrets at the edge

- Behavioral settings → `config.yaml`
- Secrets → `.env` / secret scope
- Under multiplex, adapters must use shared scoped readers (`gateway/platforms/_shared.py` helpers), never a private `os.getenv` fallback that leaks the launch profile

## TUI / Desktop

`tui_gateway` speaks JSON-RPC. Desktop and dashboard chat are clients of that backend (dashboard embeds the real TUI over a PTY). Agent behavior still belongs in Python — not reimplemented in React.

## Exercise

1. Find `_SLASH_DISPATCH` or `COMMAND_REGISTRY` and pick one command; locate its CLI and gateway handlers
2. In `gateway/platforms/base.py`, find where active sessions queue messages
3. Skim `hermes_cli/config.py` / defaults for one key you used in Getting Started

## Next

[Extend → Footprint Ladder]({{< ref "hermes/extend/01-footprint-ladder" >}})

## Further reading

- `gateway/AGENTS.md`
- `hermes_cli/AGENTS.md`
- `tui_gateway/AGENTS.md`
- `website/docs/developer-guide/gateway-internals.md`
- `website/docs/developer-guide/cli-internals.md`
