---
title: "Lab: Write a plugin tool"
description: "Scaffold ~/.hermes/plugins with register(ctx) and a tiny model-callable tool"
weight: 53
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab: Write a plugin tool

## Goal

Register one plugin tool (or hook) under `~/.hermes/plugins/` without touching core.

## Prereqs

- Working Hermes chat
- Completed [Footprint Ladder]({{< ref "hermes/extend/01-footprint-ladder" >}}) reading
- Note: exact plugin manifest field names can evolve — if discovery fails, check `website/docs/developer-guide/plugins/index.md` and `hermes plugins` / doctor output for your version

## Steps

1. Create a plugin directory:

```bash
mkdir -p ~/.hermes/plugins/lab-echo
```

2. Add a minimal manifest `~/.hermes/plugins/lab-echo/plugin.yaml` (illustrative):

```yaml
name: lab-echo
version: 0.1.0
description: Tutorial echo tool for Agent eng labs
```

3. Add `~/.hermes/plugins/lab-echo/__init__.py` (illustrative API — adjust to your installed Hermes plugin ctx):

```python
import json


def register(ctx):
    def echo_handler(args, **kwargs):
        text = (args or {}).get("text", "")
        return json.dumps({"success": True, "echo": text})

    ctx.register_tool(
        name="lab_echo",
        description="Echo text back as JSON (tutorial plugin).",
        parameters={
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to echo"}
            },
            "required": ["text"],
        },
        handler=echo_handler,
    )
```

4. Restart Hermes / reload plugins so discovery picks up the new folder (`discover_plugins` runs with tool discovery — a fresh process is the reliable path).
5. In chat: “Use lab_echo to echo the text ping-lab”.

Optional hook variant: register `pre_tool_call` to log tool names — still only inside the plugin package.

## Expected outcome

- Plugin directory with manifest + `register(ctx)`
- Model can call `lab_echo` (or you see a clear enablement error you can fix without editing core)
- Zero modifications to hermes-agent tracked source

## Verify

1. `hermes plugins` / doctor lists the plugin or shows a actionable load error
2. Tool call returns JSON including your text
3. You did not add the tool to `tools/` or `toolsets.py`

## Common pitfalls

- Editing core `tools/` “because register looked similar” — that skips the ladder
- Forgetting process restart after dropping a plugin
- Manifest/`register` API drift — fix against *your* version’s plugin docs, keep the lab in user space

## Stretch

- Add a `pre_tool_call` hook that appends a prefix to args for one tool name
- Read native compatibility rules: additive kwargs, no core file patches (`plugins/AGENTS.md`)

## Next lab

[Footprint decision drill]({{< ref "hermes/labs/04-footprint-decision-drill" >}})
