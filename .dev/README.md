# Development Configuration Directory

This `.dev/` directory consolidates all development-related configuration, workflows, rules, and specifications that were previously scattered across multiple hidden directories.

## Directory Structure

```
.dev/
├── README.md                    # This file
├── prompt_instructions.md       # AI assistant system prompt
├── workflows/                   # Development workflow guides
│   └── ui-ux.md                # UI/UX development workflow
├── rules/                       # Development rules and guidelines
│   ├── smart-mcp.md            # Smart MCP tool usage rules
│   ├── react-vite.mdc          # React/Vite development guidelines
│   ├── clean-code.mdc          # Clean code principles
│   ├── code-quality.mdc        # Code quality standards
│   ├── create-prd.md           # PRD generation workflow
│   └── generate-tasks.md       # Task list generation workflow
└── specs/                      # Detailed project specifications
    ├── navigation-consolidation/
    │   ├── design.md           # Navigation consolidation design
    │   ├── requirements.md     # Navigation requirements
    │   └── tasks.md            # Navigation implementation tasks
    └── ui-ux-consolidation/
        ├── design.md           # UI/UX consolidation design
        ├── requirements.md     # UI/UX requirements
        └── tasks.md            # UI/UX implementation tasks
```

## Purpose

### Workflows
Development process guides and checklists for consistent project execution.

### Rules
Development standards, coding guidelines, and tool usage rules that ensure quality and consistency.

### Specs
Detailed specifications for major refactoring projects, including design documents, requirements, and implementation plans.

## Migration History

This directory consolidates content from:
- `.agent/` - AI assistant workflows and rules
- `.cursor/` - IDE-specific rules and guidelines
- `.kiro/specs/` - Project specifications

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