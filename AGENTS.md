# Project Overview

Wiggum is a CLI tool for automated task completion using OpenCode and Bun. It iteratively completes tasks from a project's PRD (Product Requirements Document) using AI assistance.

## Project State

**Status:** Ready for use - CLI tools fully packaged
**Framework:** TypeScript 5.3.3, Bun 1.3.5
**Installation:** `bun install -g` or download prebuilt executables
**Purpose:** Iteratively complete development tasks using OpenCode AI

## Core Components

### `bin/wiggum.ts`

Main CLI entry point for wiggum command. Automated task completion loop that:
- Iterates up to max_iterations times
- Shows recently completed and ready tasks
- Provides task context to OpenCode
- Completes one task per iteration
- Logs progress and creates git commits

### `bin/task.ts`

CLI entry point for task command. Manual task management:
- Add new tasks interactively
- List tasks (default: recently completed + ready, or --all for all)
- Update tasks
- Complete tasks
- Show task summary

### `src/task-manager.ts`

Business logic for task management:
- TaskManager class with CRUD operations
- Task dependency validation
- Status tracking
- recentlyCompleted and getReadyTasks methods for filtered views

### `src/task-repository.ts`

Data persistence layer:
- TaskRepository class
- Read/write operations on prd.json
- File-based storage

### `src/types.ts`

TypeScript type definitions:
- TaskStatus: pending, in_progress, completed
- TaskCategory: infrastructure, feature, bugfix, refactor, docs
- Task interface with all fields
- Prd interface

### `src/utils.ts`

Utility functions:
- inferCategory(): Guesses task category from description keywords
- prompt(): Interactive user input using readline API

### `wiggum.ts`

Legacy script at root level. Replaced by bin/wiggum.ts but kept for compatibility.

### `package.json`

Package configuration:

- `name`: wiggum
- `bin`: { "wiggum": "./bin/wiggum.ts", "task": "./bin/task.ts" }
- Scripts: test, typecheck, lint, build:wiggum, build:task, build

### `tsconfig.json`

TypeScript configuration with:

- Strict mode enabled
- ES2022 target
- ESNext module system
- Includes src/, tests/, and bin/ directories

## Infrastructure

**Testing:** Bun's native test framework with 67 tests across 7 files
**Type Checking:** TypeScript compiler with noEmit flag
**Linting:** ESLint with TypeScript support
**Package Manager:** Bun (lockfile: bun.lock)
**Version Control:** Git with husky pre-commit hooks

## Installation

**Global install with Bun:**
```bash
bun install -g
```

**Download prebuilt executable:**
```bash
# Download from releases page and add to PATH
wiggum <prd-path> <max-iterations>
```

## Usage

**Wiggum:**
```bash
wiggum                    # Default: plans/prd.json, 10 iterations
wiggum ./my-prd.json     # Custom PRD
wiggum ./my-prd.json 20  # Custom iterations
```

**Task CLI:**
```bash
task add                    # Add new task interactively
task list                   # Show recently completed + ready tasks
task list --all             # Show all tasks
task complete <id>          # Mark task as complete
task update <id>            # Update task interactively
task status                 # Show summary
```

## Development Workflow

1. Make changes to source code
2. Run `bun test` to verify tests pass
3. Run `bun run typecheck` to verify type safety
4. Run `bun run lint` to verify code quality
5. Run `bun run build` to compile executables
6. Update progress.txt and plans/prd.json
7. Update AGENTS.md file with current project state
8. Commit changes

## Project Structure

```
wiggum/
├── bin/
│   ├── wiggum.ts          # Wiggum CLI entry point
│   ├── task.ts            # Task CLI entry point
│   ├── wiggum.exe         # Compiled wiggum binary
│   └── task.exe           # Compiled task binary
├── src/
│   ├── task-manager.ts     # Business logic
│   ├── task-repository.ts  # Data persistence
│   ├── types.ts           # Type definitions
│   └── utils.ts           # Utilities
├── tests/
│   └── *.test.ts          # 67 tests covering all components
├── plans/
│   └── prd.json          # Task definitions (per project)
├── progress.txt            # Progress log (auto-generated)
├── AGENTS.md              # This file - project context for AI
├── README.md              # User documentation
└── package.json           # Package config with bin field
```

## Key Features

- **Global installation:** Both `wiggum` and `task` commands available system-wide
- **Dual delivery:** `bun install -g` OR precompiled executables
- **Current directory operation:** Works in project directory like git
- **Custom PRD paths:** First parameter or --prd flag supports custom locations
- **Dependency-aware:** Only shows tasks with all dependencies completed
- **Context-aware:** Shows last 5 completed tasks for context
- **Git integration:** Auto-commits after each task completion
- **Safety:** Fresh OpenCode session per iteration, one task only per session

## Notes

- Wiggum is the project's main deliverable
- Task CLI can be used independently for manual task management
- PRD format follows standard JSON structure
- Uses AGENTS.md to provide project context to OpenCode
- All executables work without requiring Bun installation
- Binaries are 115MB+ but self-contained (include Bun runtime)
