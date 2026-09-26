---
title: "Lab: Trace one turn"
description: "Follow a tool-calling chat through conversation_loop and handle_function_call"
weight: 51
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab: Trace one turn

## Goal

Run a chat that triggers a tool call, then map the runtime path onto concrete symbols in the repo.

## Prereqs

- Working `hermes` chat ([Install and first chat]({{< ref "hermes/getting-started/02-install-and-first-chat" >}}))
- Optional but recommended: a local clone of hermes-agent for reading source
- Tools that can run commands/files enabled (default terminal/file toolsets)

## Steps

1. Start Hermes and ask something that needs a tool, for example:
   - “Show my current working directory using your tools.”
   - or “List files in the current directory.”
2. Watch the UI: you should see a tool invocation (name + args) before the final answer.
3. In the repo (read-only), open in order:
   1. `agent/conversation_loop.py` — find the loop that calls the provider with `tools=`
   2. `model_tools.py` — find `handle_function_call`
   3. The tool’s module under `tools/` (for example terminal/file tools) — find `registry.register` and the handler
4. On paper, write the message roles you expect after one tool round:
   - `user` → `assistant` (with `tool_calls`) → `tool` → `assistant` (final)

## Expected outcome

- At least one tool call visible in the session
- A short notes file (mental or markdown) listing: loop file → dispatch function → handler module
- Role sequence matches strict alternation rules

## Verify

1. Tool name you saw in the UI appears in `toolsets.py` or an enabled toolset
2. You can point to `handle_function_call` as the bridge from model → handler
3. You did **not** need to edit any core file

## Common pitfalls

- Asking a pure trivia question that never calls tools — nudge the prompt toward filesystem/shell
- Reading only `run_agent.py` and missing that the loop lives in `conversation_loop.py`
- Confusing “tool appeared in UI” with “tool is in `_HERMES_CORE_TOOLS`” — check the active platform toolset

## Stretch

- Repeat with gateway messaging once CLI works (`hermes gateway setup` + Telegram/Discord). Compare entry points using [Data flows]({{< ref "hermes/architecture/04-data-flows" >}}).
- Official Telegram path: `website/docs/user-guide/messaging/telegram.md`

## Next lab

[Write a skill]({{< ref "hermes/labs/02-write-a-skill" >}})
