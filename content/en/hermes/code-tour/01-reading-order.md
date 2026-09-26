---
title: "Reading order"
description: "Facade + siblings: find code by topic, not by opening the biggest file first"
weight: 31
draft: false
tags: ["hermes", "agent", "code-tour"]
---

# Reading order

Hermes decomposes former “god files” into a **facade** plus topical **siblings**. Reading the facade first is the expensive way.

## Habit

1. Name the *topic* you care about (overflow, slash command, MCP discovery, …)
2. Search siblings: `agent/turn_*.py`, `gateway/run_*.py`, `hermes_cli/cli_*_mixin.py`
3. Open the matching sibling; only then skim the facade for public entry points

Example: turn overflow lives under `agent/turn_overflow*.py` (and related), not as a mystery buried only in `run_agent.py`.

## Facade vs loop

| You open… | You actually get… |
| --------- | ----------------- |
| `run_agent.py` | `AIAgent` public surface, mixins assembly, constructors |
| `agent/conversation_loop.py` | The turn `while` loop |
| `agent/turn_*.py` | One phase per file (API call, tools, compression, recovery, …) |

`AIAgent.run_conversation` forwards into the conversation loop after taking a session turn lease.

## Patch where production reads

Siblings often late-import names from the facade inside functions so tests can `monkeypatch` the facade attribute. Patching only the defining module can silently miss the call site.

## Recommended tour sequence

```text
tools/registry.py
  → toolsets.py
  → model_tools.py
  → agent/conversation_loop.py (+ skim turn_*.py names)
  → run_agent.py (facade only)
  → agent/prompt_builder.py
  → gateway/run.py (facade) + one run_*.py of interest
  → hermes_cli/commands.py
```

That order matches the real import/dependency story: tools exist before agents call them.

## Anti-patterns while reading

- Treating line counts in a facade as “where the logic is”
- Grepping only `run_agent.py` for behavior that lives in `turn_*.py`
- Assuming `website/` docs mirror today’s file names without checking — prefer `AGENTS.md` routing tables

## Next

[Agent core tour]({{< ref "hermes/code-tour/02-agent-core-tour" >}})

## Further reading

- Root `AGENTS.md` § Facade + siblings
- `evals/codebase_navigability/` — metrics for file/function distributions
- `website/docs/developer-guide/architecture.md` — recommended reading order
