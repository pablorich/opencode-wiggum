# Installation Script Implementation Summary

## What Was Created

### 1. `install.sh` - Main installer script
A bash installer similar to OpenCode's that:
- Detects OS and architecture (Linux, macOS, Windows with Git Bash/WSL)
- Downloads binaries from GitHub releases
- Installs to `~/.wiggum/bin`
- Automatically updates PATH in shell config files
- Supports `--version`, `--binary`, and `--no-modify-path` options
- Shows version before installing to avoid duplicates
- Displays Wiggum branding after installation

### 2. Updated `bin/wiggum.ts` and `bin/task.ts`
Added `--version` flag to both binaries:
- `wiggum --version` outputs `wiggum 0.1.0`
- `task --version` outputs `task 0.1.0`

### 3. `.github/workflows/release.yml`
GitHub Actions workflow that:
- Triggers on version tags (e.g., `v0.1.0`)
- Builds binaries using Bun
- Creates Linux x64 ZIP archive
- Creates GitHub release with binaries and `install.sh`
- Auto-generates release notes

### 4. `scripts/build-release.ps1`
PowerShell script for Windows to:
- Build binaries locally
- Create release archive
- Prepare files for manual upload

### 5. `docs/RELEASING.md`
Comprehensive guide covering:
- Repository configuration
- Creating and pushing tags
- Testing installation
- Troubleshooting
- Cross-platform builds

### 6. Updated `README.md`
- Added quick install command at top
- Updated installation options
- Added "Creating Releases" section

## Usage

### Quick Install (after setting up GitHub releases)
```bash
curl -fsSL https://github.com/pablorich/opencode-wiggum/releases/latest/download/install.sh | bash
```

### Local Testing
```bash
# Test with local binary
./install.sh --binary bin/wiggum

# Test specific version
./install.sh --version 0.1.0

# Test without modifying PATH
./install.sh --no-modify-path
```

## What You Need to Do

### 1. Create GitHub Repository
```bash
# Already done - repo exists at https://github.com/pablorich/opencode-wiggum
git add .
git commit -m "Update repository references"
git push
```

### 3. Create First Release
```bash
# Update version in package.json if needed
# Commit changes
git add .
git commit -m "Prepare for v0.1.0 release"

# Create and push tag
git tag v0.1.0
git push origin main
git push --tags
```

### 4. Enable GitHub Actions
- Go to your repository on GitHub
- Navigate to "Actions" tab
- Enable workflows
- The workflow will automatically run when you push the tag

### 5. Test Installation
After the release is created, test:
```bash
curl -fsSL https://github.com/pablorich/opencode-wiggum/releases/latest/download/install.sh | bash
```

## File Structure

```
wiggum/
├── install.sh                    # Main installer script
├── bin/
│   ├── wiggum.ts                # Wiggum CLI (with --version)
│   └── task.ts                  # Task CLI (with --version)
├── .github/
│   └── workflows/
│       └── release.yml          # Automated release workflow
├── scripts/
│   └── build-release.ps1        # Windows release build script
├── docs/
│   └── RELEASING.md             # Release documentation
├── README.md                    # Updated with install instructions
└── package.json                 # Contains version
```

## Testing Checklist

- [x] Update all repository references
- [x] Create GitHub repository (https://github.com/pablorich/opencode-wiggum)
- [ ] Push code to GitHub
- [ ] Create and push v0.1.0 tag
- [ ] Verify GitHub Actions runs successfully
- [ ] Test installation from GitHub releases
- [ ] Verify `wiggum --version` works
- [ ] Verify `task --version` works
- [ ] Test installation with `--no-modify-path`
- [ ] Test installation with specific version
- [ ] Test installation with local binary

## Notes

- The installer currently only supports Linux x64 builds via GitHub Actions
- Windows builds need to be done locally or by adding Windows runners to the workflow
- macOS support can be added by including macOS runners
- The binaries are ~115MB because they include the entire Bun runtime
- The installer requires `curl` and `unzip` (or `tar` on Linux)
