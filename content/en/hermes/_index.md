---
title: "Hermes Agent Tutorials"
description: "From first chat to Agent development engineer — bilingual tutorials for Hugo"
weight: 1
draft: false
tags: ["hermes", "agent"]
cascade:
  showDate: false
  showAuthor: false
  showReadingTime: false
  showWordCount: false
  showPagination: true
---

# Hermes Agent Tutorials

This series takes you from a working Hermes install to reading and extending the agent core — the path toward becoming an **Agent development engineer**.

## Path

1. **[Getting Started]({{< ref "hermes/getting-started" >}})** — install, first chat, CLI and config
2. **[Architecture]({{< ref "hermes/architecture" >}})** — design philosophy, system map, invariants, data flows
3. **[Code Tour]({{< ref "hermes/code-tour" >}})** — how to navigate the codebase
4. **[Extend]({{< ref "hermes/extend" >}})** — Footprint Ladder, skills, plugins, tools
5. **[Labs]({{< ref "hermes/labs" >}})** — hands-on exercises in user space

## Who this is for

- New users who want the shortest path to a working chat
- Engineers who want to understand *why* Hermes is shaped the way it is
- Contributors choosing the right extension rung (skill vs plugin vs core tool)

## Conventions

- Plain Markdown for Hugo (no Docusaurus MDX)
- Examples prefer user home (`~/.hermes/`) over patching the Hermes core
- Deep API detail: see the official docs under `website/docs/` in the hermes-agent repository
