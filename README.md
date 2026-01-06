# Wiggum

Automated task completion using OpenCode and Bun. Wiggum iteratively completes tasks from your project's PRD (Product Requirements Document) using AI assistance.

## Installation

### Global Installation (with Bun)

```bash
bun install -g
```

This installs both `wiggum` and `task` commands globally.

### Download Prebuilt Executable

Download the appropriate executable for your platform from the [releases](https://github.com/pablorich/wiggum-opencode/releases) page and add it to your PATH.

## Usage

### Wiggum

Wiggum runs an automated loop to complete tasks from your PRD:

```bash
# Run with default settings (looks for ./plans/prd.json, 10 iterations)
wiggum

# Use custom PRD file
wiggum ./my-prd.json

# Specify max iterations
wiggum ./my-prd.json 20

# Use default PRD with custom iterations
wiggum 20
```

Wiggum works in the current directory (like git). It:

- Reads tasks from `plans/prd.json` (or custom path)
- Shows the last 5 completed tasks for context
- Lists all pending tasks with no unresolved dependencies
- Completes one task per iteration using OpenCode
- Updates `progress.txt` with completion details
- Creates a git commit after each successful completion

### Task CLI

Manually manage your PRD tasks:

```bash
# Add a new task interactively
task add

# Show recently completed and ready tasks (default)
task list

# Show all tasks
task list --all

# Filter by status or category
task list --status pending
task list --category feature
task list --all --status completed --category infrastructure

# Update a task interactively
task update <id>

# Mark a task as complete
task complete <id>

# Show task summary
task status
```

Task CLI also works in the current directory. Use `--prd <path>` to specify a custom PRD file location.

### Environment Variables

- `PRD_PATH` - Path to PRD file (overrides default `./plans/prd.json`)

```bash
PRD_PATH=/path/to/custom-prd.json task list
```

## Project Structure

A Wiggum project typically looks like:

```
my-project/
├── plans/
│   └── prd.json          # Your task definitions
├── progress.txt           # Progress log (auto-generated)
├── AGENTS.md             # Project context for AI (recommended)
└── [your project files]
```

## PRD Format

The `prd.json` file contains your project requirements:

```json
{
  "project": "My Project",
  "backlog": [
    {
      "id": "1",
      "priority": 1,
      "feature": "Task description",
      "status": "pending",
      "category": "feature",
      "createdAt": "2026-01-05T10:00:00Z",
      "completedAt": null,
      "completedBy": null,
      "dependencies": [],
      "notes": null
    }
  ]
}
```

### Task Fields

- `id` - Unique task identifier (auto-generated)
- `priority` - 1-5 (1 = highest)
- `feature` - Task description
- `status` - `pending`, `in_progress`, or `completed`
- `category` - `infrastructure`, `feature`, `bugfix`, `refactor`, or `docs`
- `createdAt` - ISO timestamp (auto-generated)
- `completedAt` - ISO timestamp (set when completed)
- `completedBy` - `manual` or `opencode` (set when completed)
- `dependencies` - Array of task IDs that must complete first
- `notes` - Optional notes or additional context

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun run typecheck

# Lint
bun run lint

# Build executables
bun run build
```

## How It Works

1. **Wiggum Loop**:

   - Iterates up to `max-iterations` times
   - Gets list of recently completed and ready tasks
   - Provides task list and AGENTS.md context to OpenCode
   - OpenCode completes one task using the available tools
   - Task is marked as completed, progress is logged, and git commit is created
   - Loop repeats with fresh session

2. **Task Selection**:

   - Only tasks with status `pending` and all dependencies completed are shown
   - OpenCode chooses the highest priority available task
   - Progress is preserved between iterations via `progress.txt`

3. **Safety**:
   - Each iteration is a fresh OpenCode session
   - OpenCode only completes ONE task per iteration
   - All changes are verified (typecheck, tests) before marking complete
   - Git commits ensure version control and rollback capability

## License

MIT
