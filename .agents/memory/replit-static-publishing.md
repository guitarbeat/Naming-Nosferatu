---
name: Replit static publishing
description: Deployment target guidance for client-only Vite applications
---

Client-only Vite applications should use Replit's static publishing target with the Vite build command and `dist` as the public directory. They do not produce a Node server entrypoint for an autoscale run command.

**Why:** An autoscale command that points at a nonexistent generated server file fails during promotion even when the frontend build succeeds.

**How to apply:** When a project has no server runtime, configure publishing as static and verify the build output directory contains `index.html`.