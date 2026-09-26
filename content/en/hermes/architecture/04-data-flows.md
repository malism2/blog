---
title: "Data flows"
description: "CLI turn, gateway message path, and cron — same AIAgent, different edges"
weight: 24
draft: false
tags: ["hermes", "agent", "architecture"]
---

# Data flows

Same core. Different edges. Trace three paths so reviews stay grounded in runtime.

## CLI turn

```text
User input (REPL / -q / TUI prompt.submit)
        │
        ▼
HermesCLI / tui_gateway methods
        │
        ▼
AIAgent.run_conversation / chat
        │
        ▼
agent/conversation_loop.py
  → assemble request (tools schemas from model_tools)
  → provider API call
  → if tool_calls: handle_function_call → append tool results
  → else: final assistant text
        │
        ▼
Session persistence (hermes_state) + UI stream
```

Notes:

- Tool schemas come from enabled toolsets for that session/platform
- Interrupt checks run inside the loop
- Display/spinner are entry-point concerns; the loop stays synchronous

## Gateway message path

```text
Platform event (Telegram/Discord/…)
        │
        ▼
Adapter (gateway/platforms/*)
  → canonicalize identity / session key
  → authz (allowlists, gates) via scoped readers
        │
        ▼
Gateway runner (gateway/run*.py)
  → busy guards (/stop, /approve, …)
  → bind profile runtime scope for the turn
        │
        ▼
Same AIAgent conversation loop
        │
        ▼
Delivery adapter send / stream (platform quirks stay here)
```

Notes:

- Two busy guards exist (adapter queue + runner control commands); approval-style commands must bypass both
- Intake adapter (who received) vs delivery adapter (who answers) can differ under shared-bot routing — do not invent a third resolver
- Streaming platforms with `draft_stream_is_message` have extra prefix-stability rules

## Cron path

```text
cron ticker (per served profile, under profile scope)
        │
        ▼
Job due → advance next_run / claim → spawn agent session
        │
        ▼
AIAgent with cron session settings
  (typically skip_memory=True)
        │
        ▼
Optional delivery / mirror into a user-facing conversation
  (role alternation preserved)
```

Notes:

- Tick ownership and locks are per profile home
- Cron is not “the CLI with a timer” — it has its own session and delivery rules
- Background `delegate_task` is process-local; durable work prefers cron or `terminal(background=True, notify_on_complete=True)`

## Shared lesson

When debugging “works in CLI, fails in Telegram”, compare **edges** first: identity, authz, toolset selection, profile scope, delivery — not the model math inside `AIAgent`.

## Next

Start the [Code tour]({{< ref "hermes/code-tour/01-reading-order" >}}).

## Further reading

- `website/docs/developer-guide/gateway-internals.md`
- `website/docs/developer-guide/cron-internals.md`
- `website/docs/developer-guide/cli-internals.md`
- `gateway/AGENTS.md`, `cron/AGENTS.md`
