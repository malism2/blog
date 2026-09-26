---
title: "Install and first chat"
description: "Install Hermes, choose a provider, and verify one working conversation"
weight: 12
draft: false
tags: ["hermes", "agent", "getting-started"]
---

# Install and first chat

Goal: from zero to a **verified** chat. Do not add messaging bots, cron, or custom tools until this works.

## 1. Install

### Desktop installer (macOS / Windows)

Download the Hermes Desktop installer from the project site and run it. That path installs CLI + desktop together.

### CLI-only — Linux / macOS / WSL2 / Termux

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

Reload your shell afterward:

```bash
source ~/.bashrc   # or ~/.zshrc
```

### CLI-only — Windows (PowerShell)

```powershell
iex (irm https://hermes-agent.nousresearch.com/install.ps1)
```

### Verify the binary

```bash
hermes --help
```

## 2. Choose a provider

Pick the path that matches you:

| Goal | First command | Then |
| ---- | ------------- | ---- |
| Fastest first-time setup | `hermes setup` (often with portal/OAuth options) | Chat once |
| You already know the provider | `hermes model` | Save config, then chat |
| Local / self-hosted endpoint | `hermes model` → custom endpoint | Check model name + context length |
| Always-on messaging bot | Finish CLI chat first | Then `hermes gateway setup` |

**Rule:** if Hermes cannot complete a normal chat, stop and fix that before stacking features.

## 3. First conversation

Start the CLI:

```bash
hermes
```

Or a one-shot query:

```bash
hermes -q "Reply with exactly: hermes-ok"
```

You want a real model reply, not a credential or routing error.

### If it fails

1. Re-run `hermes model` / `hermes setup` and confirm the provider credentials
2. Check that secrets live in `~/.hermes/.env` (or your profile’s home), not only in a random shell export
3. Read logs under `~/.hermes/logs/` (`agent.log`, `errors.log`) — or `hermes logs`

Profiles use `get_hermes_home()`; with `hermes -p <name>` the home is that profile’s directory, not always `~/.hermes`.

## 4. Optional: messaging (after CLI works)

```bash
hermes gateway setup
```

Connect Telegram, Discord, Slack, or another platform only when CLI chat is already green.

## Expected outcome

- `hermes` starts without import/config crashes
- At least one user → assistant exchange completes
- You know where config and logs live for your active home

## Next

[CLI and config basics]({{< ref "hermes/getting-started/03-cli-and-config-basics" >}})

## Further reading

- `website/docs/getting-started/installation.md`
- `website/docs/getting-started/quickstart.md`
- Termux / Nix: `website/docs/getting-started/termux.md`, `nix-setup.md`
