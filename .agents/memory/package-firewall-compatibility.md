---
name: Package firewall compatibility
description: Dependency selection guidance for Replit package installs
---

Keep optional deployment CLIs out of the default dependency graph when the application does not use them at runtime, especially when they bring archive tooling that the Replit package firewall may reject.

**Why:** A blocked transitive archive package can prevent the entire locked install from completing, even though the application build itself does not need that CLI.

**How to apply:** Prefer the smallest runtime dependency graph for the active deployment target; install unrelated provider CLIs only in a dedicated publishing environment when needed.