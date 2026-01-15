# Wiggum

Automated task completion using OpenCode and Bun. Wiggum iteratively completes tasks from your project's PRD (Product Requirements Document) using AI assistance.
This is not built by the OpenCode team and is not affiliated with them in any way.

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://github.com/pablorich/opencode-wiggum/releases/latest/download/install.sh | bash
```

This will download and install the latest version of Wiggum automatically.

### Manual Install Options

#### Option 1: Global Installation (with Bun)

```bash
bun install -g
```

This installs both `wiggum` and `task` commands globally from npm registry.

#### Option 2: Build and Install Locally

For development or local use, you can build and install executables manually:

```bash
# From the wiggum project directory
bun run build

# Copy executables to global bin directory
cp bin/wiggum ~/.bun/bin/wiggum
cp bin/task ~/.bun/bin/task
```

#### Option 3: Download Prebuilt Executable

Download appropriate executable for your platform from [releases](https://github.com/pablorich/opencode-wiggum/releases) page and add it to your PATH.

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
- Shows last 5 completed tasks for context
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

## Creating Releases

To create a new release:

1. Update the version in `package.json`
2. Build the binaries: `bun run build`
3. Tag the release: `git tag v0.1.0`
4. Push the tag: `git push --tags`

The GitHub Actions workflow will automatically:

- Build the binaries
- Create a ZIP archive with `wiggum` and `task` executables
- Upload `install.sh` and the ZIP archive to the release

Alternatively, create a release manually:

```bash
# Build binaries
bun run build

# Create release archive
cd bin
zip -r ../wiggum-linux-x64.zip wiggum task
cd ..

# Upload to GitHub releases
```

## How It Works

1. **Wiggum Loop:**

   - Iterates up to `max-iterations` times
   - Gets list of recently completed and ready tasks
   - Provides task list and AGENTS.md context to OpenCode
   - OpenCode completes one task using available tools
   - Task is marked as completed, progress is logged, and git commit is created
   - Loop repeats with fresh session

2. **Task Selection:**

   - Only tasks with status `pending` and all dependencies completed are shown
   - OpenCode chooses the highest priority available task
   - Progress is preserved between iterations via `progress.txt`

3. **Safety:**

   - Each iteration is a fresh OpenCode session
   - OpenCode only completes ONE task per iteration
   - All changes are verified (typecheck, tests) before marking complete
   - Git commits ensure version control and rollback capability

## Inspiration

This project is inspired by the article [Ralph](https://ghuntley.com/ralph/) by Geoffrey Huntley.

## License

MIT
