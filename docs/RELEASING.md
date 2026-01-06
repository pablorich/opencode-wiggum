# Setting Up GitHub Releases

This guide explains how to set up your GitHub repository to support one-line installation similar to OpenCode.

## 1. Repository Configuration

### Repository Configuration
Repository is already set up at https://github.com/pablorich/opencode-wiggum

All files have been updated with the correct repository references.

## 2. GitHub Actions Workflow

The `.github/workflows/release.yml` file is already configured. When you push a tag, it will:

1. Build the binaries using Bun
2. Create a ZIP archive for Linux x64
3. Create a GitHub release with the binaries and `install.sh`

## 3. Creating Your First Release

### Update Version
Update the version in `package.json`:
```json
{
  "version": "0.1.0"
}
```

### Create and Push Tag
```bash
# Add all changes
git add .

# Commit changes
git commit -m "Prepare for v0.1.0 release"

# Create tag
git tag v0.1.0

# Push to GitHub
git push origin main
git push --tags
```

### Create GitHub Release
After pushing the tag, either:
1. Wait for the GitHub Actions workflow to complete (recommended)
2. Or manually create the release at: https://github.com/pablorich/opencode-wiggum/releases/new

The workflow will automatically create the release and upload the files.

## 4. Test Installation

Once the release is created, test the installation:

```bash
curl -fsSL https://github.com/pablorich/opencode-wiggum/releases/latest/download/install.sh | bash
```

This should:
- Download the latest release
- Install `wiggum` and `task` to `~/.wiggum/bin`
- Update your PATH (unless using `--no-modify-path`)
- Display the Wiggum logo and usage instructions

## 5. Building Locally (for testing)

### Windows
```powershell
# Build binaries
bun run build

# Create release archive
.\scripts\build-release.ps1
```

### Linux/macOS
```bash
# Build binaries
bun run build

# Create release archive
cd bin
zip -r ../wiggum-linux-x64.zip wiggum task
cd ..

# Test installer with local binary
./install.sh --binary bin/wiggum
```

## 6. File Structure After Installation

After running the installer, the files will be in:
```
~/.wiggum/bin/
├── wiggum      # Main CLI binary
└── task        # Task management binary
```

Your PATH will be updated to include `~/.wiggum/bin`.

## 7. Troubleshooting

### Version Not Showing
If `wiggum --version` doesn't show the expected version:
1. Ensure the binaries were rebuilt after updating `package.json`
2. Try removing `~/.wiggum` and reinstalling: `rm -rf ~/.wiggum`

### Permission Denied
If you get "Permission denied" errors:
```bash
chmod +x ~/.wiggum/bin/wiggum
chmod +x ~/.wiggum/bin/task
```

### PATH Not Updated
If the binaries aren't in your PATH:
```bash
# Add to .bashrc or .zshrc
export PATH=$HOME/.wiggum/bin:$PATH

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

## 8. Cross-Platform Builds

Currently, the GitHub Actions workflow only builds for Linux x64. To support more platforms:

### Windows x64
Add a matrix to the workflow:
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
```

### macOS
Add macOS to the matrix and adjust the archive creation commands.

### ARM64
For ARM64 builds (Apple Silicon, ARM Linux), you'll need to cross-compile or use ARM64 runners.

## 9. Custom Installation Options

The installer supports these options:

```bash
# Install specific version
curl -fsSL https://github.com/pablorich/opencode-wiggum/releases/latest/download/install.sh | bash -s -- --version 0.1.0

# Install from local binary
./install.sh --binary /path/to/wiggum

# Don't modify PATH
./install.sh --no-modify-path
```

## 10. Next Steps

After setting up releases:

1. **Document versioning**: Document your versioning strategy (semantic versioning)
2. **Changelog**: Keep a CHANGELOG.md file for release notes
3. **Testing**: Test each release before publishing
4. **Announcements**: Create GitHub Discussions or releases notes for major versions
