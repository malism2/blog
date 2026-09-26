---
title: "Design invariants"
description: "Hard contracts: prompt caching, role alternation, compression, session surface, profiles"
weight: 23
draft: false
tags: ["hermes", "agent", "architecture"]
---

# Design invariants

Philosophy becomes **contracts**. Breaking these is a bug even if demos look fine.

## 1. System prompt byte-stability

For the life of a conversation, the system prompt should stay byte-stable.

- Do not rebuild it mid-conversation to refresh skills/memory/tools
- Mid-turn content rides a **user message** or **tool result**
- Skill slash commands inject as user messages
- Subdirectory `AGENTS.md` hints append to tool results (not the system prompt)

## 2. Compression is the sanctioned cache break

Context compression (agent compressor + gateway hygiene thresholds) is the designed way to mutate history for length.

- Keep compression the **only** routine cache break
- Manual `/compress` goes through the shared compression entry points across surfaces

## 3. Strict role alternation

Messages use OpenAI-shaped roles: `system | user | assistant | tool`.

- Never two same-role messages in a row (except consecutive `tool` results after tool calls)
- Never inject a synthetic user message mid-loop (exception: `/steer` after a tool result at a legal boundary)
- Cron deliveries live in their own session partly for this reason

## 4. Session surface ≠ process environment

A capability that depends on *who is watching* (desktop panes, in-app browser, …) must resolve from the **session**, not from an env var on the backend process.

- Put GUI tools in a named toolset folded in by the session’s platform resolver
- Do **not** gate them only on `HERMES_DESKTOP=1` inside a process-wide `check_fn`
- `HERMES_DESKTOP=1` means “spawned by the app”, not “a GUI is watching”

## 5. Profile isolation and secret scope

Under multiplexing, `os.environ` holds the **launch** profile. Secondary profiles need scoped secret reads and an explicit profile runtime scope for off-turn work (eviction, cron tick, RPC teardown).

- Never hardcode `~/.hermes` — use `get_hermes_home()` / `display_hermes_home()`
- Never invent a second credential reader that falls through to `os.environ` after a scoped miss

## 6. Registration ≠ exposure

`registry.register()` makes a tool discoverable. A name in `toolsets.py` (or a platform toolset selection) makes it visible to the model.

## Quick self-test for a proposed change

1. Does the system prompt stay identical across turns unless the user opted into invalidation?
2. Does message history still alternate legally?
3. If this is GUI-only, is the gate session-scoped?
4. If this adds a tool, did you climb the Footprint Ladder first?
5. Under two profiles, does the secondary still see *its* secrets?

Practice on paper in [Cache-safe change review]({{< ref "hermes/labs/05-cache-safe-change-review" >}}).

## Next

[Data flows]({{< ref "hermes/architecture/04-data-flows" >}})

## Further reading

- Root `AGENTS.md` — caching, alternation, session surface
- `website/docs/developer-guide/prompt-assembly.md`
- `website/docs/developer-guide/context-compression-and-caching.md`
- `website/docs/developer-guide/agent-loop.md`
