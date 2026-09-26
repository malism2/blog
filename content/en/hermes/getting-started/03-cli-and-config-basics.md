---
title: "CLI and config basics"
description: "config.yaml vs .env, tools, slash commands, and where state lives"
weight: 13
draft: false
tags: ["hermes", "agent", "getting-started"]
---

# CLI and config basics

Once chat works, learn the three places Hermes keeps state — and which one is for secrets.

## Config vs secrets

| File | Purpose |
| ---- | ------- |
| `~/.hermes/config.yaml` (or profile home) | Behavioral settings: model defaults, timeouts, display, gateway, tools, cron, … |
| `~/.hermes/.env` | **Secrets only**: API keys, bot tokens, passwords |
| `~/.hermes/logs/` | `agent.log`, `errors.log`, `gateway.log` |

Do **not** put timeouts, feature flags, or display prefs in `.env`. If internal code needs an env mirror, Hermes bridges it from YAML in code.

Useful commands:

```bash
hermes config get model
hermes config set display.skin default
hermes doctor
hermes logs --follow
```

## Tools surface

```bash
hermes tools
```

Interactive (curses) enable/disable of toolsets per platform. Config also stores `tools.<platform>.enabled/disabled`.

## Slash commands (in-session)

Inside the CLI / TUI / messaging, slash commands come from a single registry (`hermes_cli/commands.py`). Common ones:

- `/help` — list commands
- `/model` — switch model (explicit user action; may affect routing)
- `/compress` — sanctioned context compaction
- `/skills` — skill management (mutations that affect the system prompt default to **deferred** invalidation; use `--now` when you intentionally want immediate effect)

Skill slash commands inject a **user message**, not a system-prompt rewrite — that preserves prompt caching.

## Working directory

- CLI: current `os.getcwd()`
- Messaging gateway: `terminal.cwd` in config (bridged internally for child tools)

## Profiles (preview)

```bash
hermes -p work
```

A profile is an island: its own home, secrets, sessions, and memory. No live config inheritance from the default profile (clone at create time if you want a starting copy).

## Checklist before architecture

- [ ] You can chat successfully
- [ ] You know `config.yaml` vs `.env`
- [ ] You can find logs for a failed turn
- [ ] You have not yet added custom core tools “just because”

## Next

Move to [Architecture → Design philosophy]({{< ref "hermes/architecture/01-design-philosophy" >}}).

## Further reading

- `website/docs/user-guide/configuration.md`
- `website/docs/user-guide/cli.md`
- `website/docs/reference/environment-variables.md`
