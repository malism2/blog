---
title: "Agent core tour"
description: "run_agent facade, conversation_loop, turn phases, and prompt assembly"
weight: 32
draft: false
tags: ["hermes", "agent", "code-tour"]
---

# Agent core tour

Open these with a repo checkout. Skim; do not memorize every parameter.

## 1. `run_agent.py` — facade

`AIAgent` is assembled from mixins. Construction runs through `agent/agent_init.py`. Public helpers include:

- `chat(message) -> str` — simple path
- `run_conversation(...)` — returns `final_response` + `messages`

Constructor parameters cover credentials, routing, callbacks, session context, budgets, toolset enables, platform, and more. You rarely need all of them on day one — focus on `model`, `provider`, `enabled_toolsets`, `platform`, `session_id`.

## 2. `agent/conversation_loop.py` — the loop

Conceptual shape (simplified):

```python
while under_iteration_budget:
    if interrupted:
        break
    response = client.chat.completions.create(
        model=model, messages=messages, tools=tool_schemas
    )
    if response.tool_calls:
        for tc in response.tool_calls:
            messages.append(tool_result_message(
                handle_function_call(tc.name, tc.args, task_id)
            ))
    else:
        return response.content
```

Real code adds preflight, retries, overflow, compression, usage, and finalization — each in `agent/turn_*.py`.

## 3. Skim `agent/turn_*.py` by name

Find phases with:

```bash
rg -n "^def " agent/turn_*.py
```

Useful families: request assembly / API call / API error / tool round / overflow / truncation / context compaction / recovery / stop gates / final response.

## 4. Prompt assembly

- `agent/prompt_builder.py` — builds the system prompt tiers
- Related: prompt caching helpers, compression facade

Remember: stable/context tiers are cached; ephemeral overlays must not casually rewrite the cached prefix. See [Design invariants]({{< ref "hermes/architecture/03-design-invariants" >}}).

## 5. Inline / agent-level tools

Some tools (`todo`, `memory`, …) are intercepted via `INLINE_TOOL_EXECUTORS` in `agent/inline_tool_executors.py` before `handle_function_call()`. Adding one is table-driven — no `if name == ...` chains.

## Exercise (10 minutes)

1. Locate `run_conversation` on `AIAgent` and confirm it delegates to the conversation loop
2. List five `turn_*.py` filenames and guess their phase from the name
3. Find where tool schemas are passed into the API call (loop or a turn sibling)

## Next

[Tools and registry]({{< ref "hermes/code-tour/03-tools-and-registry" >}})

## Further reading

- `website/docs/developer-guide/agent-loop.md`
- `website/docs/developer-guide/prompt-assembly.md`
- `agent/AGENTS.md`
