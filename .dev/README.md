# Development Configuration Directory

This `.dev/` directory consolidates all development-related configuration, workflows, rules, and specifications that were previously scattered across multiple hidden directories.

## Directory Structure

```
.dev/
├── README.md                    # This file
├── prompt_instructions.md       # AI assistant system prompt
├── workflows/                   # Development workflow guides
│   └── ui-ux.md                # UI/UX development workflow
├── rules/                       # AI-specific development rules
│   ├── smart-mcp.md            # Smart MCP tool usage rules
│   ├── react-vite.mdc          # AI React/Vite guidelines
│   ├── code-quality.mdc        # AI code quality standards
│   ├── create-prd.md           # PRD generation workflow
│   └── generate-tasks.md       # Task list generation workflow
└── workflows/                   # Agent development workflows
```

## Purpose

### AI Instructions

`.dev/` is primarily for AI assistant configuration, including system-level instructions and behavioral rules.

### Workflows

Agent-specific process guides and checklists for automated or semi-automated task execution.

### Rules

Tool usage rules and AI-specific coding guidelines that ensure consistent behavior and quality from AI coding partners.

## Documentation Hub

All primary project documentation, including standards, architectural specs, and roadmaps, are now centralized in the [docs/](file:///Users/aaron/Downloads/Naming-Nosferatu/docs/) directory.

## Migration History

This directory consolidates content from:

- `.agent/` - AI assistant workflows and rules
- `.cursor/` - IDE-specific rules and guidelines
- Project specs and general rules have been moved to [docs/](file:///Users/aaron/Downloads/Naming-Nosferatu/docs/)

## Usage

### For Developers

- Reference `rules/` for coding standards and development guidelines
- Follow `workflows/` for consistent development processes
- Use `specs/` for understanding major architectural changes

### For AI Assistants

- Read `prompt_instructions.md` for system-level context and expectations
- Follow rules in `rules/` for appropriate tool usage and code standards
- Reference `specs/` for detailed implementation guidance

## File Naming Conventions

- `.md` - Standard Markdown files
- `.mdc` - Cursor-specific rule files
- Directory names use `kebab-case`
- Files use `snake_case` for multi-word names
