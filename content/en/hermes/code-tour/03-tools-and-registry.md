---
title: "Tools and registry"
description: "registry → toolsets → model_tools: discovery, exposure, and dispatch"
weight: 33
draft: false
tags: ["hermes", "agent", "code-tour"]
---

# Tools and registry

Three files define the tool story. Memorize the chain.

## Chain

```text
tools/registry.py  →  tools/*.py register()  →  model_tools.py discovery
                              ↓
                        toolsets.py names what the model sees
                              ↓
                   handle_function_call() dispatches handlers
```

## `tools/registry.py`

- Zero project deps — imported by every tool module
- `registry.register(name=..., toolset=..., schema=..., handler=..., check_fn=...)`
- `check_fn` answers reachability/opt-in for the **profile** it runs under; results are TTL-cached keyed by hermes home
- Handlers return a **JSON string**

## `toolsets.py`

- Single `TOOLSETS` dict and `_HERMES_CORE_TOOLS`
- Platforms inherit/enable toolsets via config (`hermes tools`)
- **Registered but unnamed in any selected toolset ⇒ invisible to the model**

## `model_tools.py`

- Triggers `discover_builtin_tools()`
- Builds OpenAPI-ish tool schemas for the API call
- `handle_function_call()` is the dispatch entry used by the turn loop
- May post-process schema descriptions for cross-tool references when those tools are actually available

## Adding capability (decision reminder)

| Need | Prefer |
| ---- | ------ |
| Procedure the agent should follow | Skill (`SKILL.md`) |
| Niche / user-specific tool | Plugin `ctx.register_tool` |
| Optional when a service is configured | Service-gated tool with `check_fn` |
| Fundamental + nearly universal | Core tool (last resort) — see Footprint Ladder |

For these tutorials, practice skills and plugins in user space ([Labs]({{< ref "hermes/labs" >}})) before proposing core tools.

## Schema hygiene

- Do not hardcode cross-toolset tool names into schema descriptions (the other tool may be disabled)
- Paths shown to users should use `display_hermes_home()`; state files resolve via `get_hermes_home()` at call time
- No `offset`/`limit` pagination on instructional loaders (skills, prompts) — models skip past page 1

## Exercise

1. Open any `tools/*_tool.py` and find the `registry.register(...)` call
2. Grep that tool name in `toolsets.py`
3. From `model_tools.py`, find `handle_function_call` and note how args reach the handler

## Next

[Gateway and CLI edges]({{< ref "hermes/code-tour/04-gateway-and-cli-edges" >}})

## Further reading

- `website/docs/developer-guide/tools-runtime.md`
- `website/docs/developer-guide/adding-tools.md`
- `tools/AGENTS.md`
