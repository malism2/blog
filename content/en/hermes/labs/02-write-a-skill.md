---
title: "Lab: Write a skill"
description: "Author a minimal SKILL.md under ~/.hermes/skills and invoke it safely for caching"
weight: 52
draft: false
tags: ["hermes", "agent", "labs"]
---

# Lab: Write a skill

## Goal

Create a minimal user skill in **user space** and invoke it without patching Hermes core.

## Prereqs

- Working Hermes chat
- Ability to edit files under your Hermes home (`~/.hermes/` or profile home)

## Steps

1. Create a skill directory (adjust home if using a profile):

```bash
mkdir -p ~/.hermes/skills/hello-agent-eng
```

2. Write `~/.hermes/skills/hello-agent-eng/SKILL.md`:

```markdown
---
name: hello-agent-eng
description: Prints a short Agent eng checklist via terminal.
version: 0.1.0
author: Your Name
license: MIT
metadata:
  hermes:
    tags: [tutorial, lab]
    category: productivity
---

# Hello Agent Eng Skill

Use this skill when practicing Hermes extension labs.

## When to Use

- You want a tiny skill to verify skill loading

## How to Run

1. Summarize the Footprint Ladder in five bullets.
2. If you need a shell one-liner, use the `terminal` tool — do not invent other CLIs as the primary interface.

## Quick Reference

| Step | Action |
| ---- | ------ |
| 1 | Restate the user goal |
| 2 | Pick a Footprint Ladder rung |
| 3 | List cache risks |
```

3. Load / refresh skills per your install (`/skills`, `hermes skills`, or restart session). Prefer **deferred** activation if prompted; only use `--now` if you intentionally want immediate system-prompt invalidation.
4. Invoke the skill (slash command derived from the skill, or ask: “Follow the hello-agent-eng skill”).

## Expected outcome

- Skill directory exists with valid frontmatter
- Agent follows the checklist (or clearly loads the skill content)
- You understand deferred vs `--now` for cache-affecting skill changes

## Verify

1. Frontmatter `description` is one short sentence (keep it ≤ 60 characters when aiming for upstream quality)
2. Prose references native tools in backticks (for example `terminal`) instead of raw `grep`/`cat` as the headline interface
3. No files under the hermes-agent git tree were modified

## Common pitfalls

- Putting the skill inside the git checkout `skills/` folder (that is for bundled contributions, not this lab)
- Writing a novel-length description that pollutes listings
- Using `--now` by habit and wondering why the conversation got more expensive

## Stretch

- Add `scripts/hello.py` and call it via `terminal` with a skill-relative path
- Read authoring hardlines in `skills/AGENTS.md` / `website/docs/developer-guide/creating-skills.md`

## Next lab

[Write a plugin tool]({{< ref "hermes/labs/03-write-a-plugin-tool" >}})
