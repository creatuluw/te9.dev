# Installation Guide

Complete installation and setup instructions for NueJS development environment.

## System Requirements

- **Bun 1.2** or later (recommended for macOS, Linux, and Windows)
- **Node.js 20.8** or later (alternative to Bun)
- Operating Systems: macOS, Linux, Windows (experimental)

## Installation Steps

### 1. Install Bun (Recommended)

Bun is the preferred runtime for Nue due to its superior web standards support, including native CSS parsing.

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Verify installation:**
```bash
bun --version
```

### 2. Install Nue Globally

Install Nue as a global command-line tool:

```bash
bun install --global nuekit
```

**Why global?** Nue is a command-line tool like Git or Docker. Global installation allows you to run `nue` from any directory.

**Verify installation:**
```bash
nue --version
```

### 3. Create Your First Project

Choose a starter template:

**Simple Blog:**
```bash
nue create simple-blog
```

**Multi-page Application:**
```bash
nue create simple-mpa
```

**What happens:**
- Creates project directory with proper structure
- Installs necessary dependencies
- Sets up development server
- Opens browser to `http://localhost:8083/`

### 4. Start Development

Navigate to your project and start the development server:

```bash
cd simple-blog
nue serve
```

The server starts on port 8080 by default. Open `http://localhost:8080` in your browser.

## Node.js Setup (Alternative)

If you prefer Node.js over Bun, use npm, pnpm, or yarn:

### Install with pnpm (Recommended)
```bash
pnpm install --global nuekit esbuild lightningcss
```

### Install with npm
```bash
npm install --global nuekit esbuild lightningcss
```

### Install with yarn
```bash
yarn global add nuekit esbuild lightningcss
```

### Configure Node.js Runtime

The default engine is Bun, so the CLI starts with `#!/usr/bin/env bun`. To use Node.js:

**One-time usage:**
```bash
node $(which nue)
```

**Permanent alias (bash/zsh):**
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
alias node-nue="node $(which nue)"
```

Then reload your shell:
```bash
source ~/.bashrc  # or ~/.zshrc
```

## Development Dependencies

### Optional: Enhanced Build Tools

For production builds with optimization:

```bash
# ESBuild for JavaScript bundling
bun install --global esbuild

# Lightning CSS for CSS optimization
bun install --global lightningcss
```

Use with flags:
```bash
nue build --production --esbuild --lcss
```

## Project Structure After Installation

A typical Nue project structure:

```
my-project/
├── .dist/               # Build output (auto-generated)
│   ├── dev/            # Development builds
│   └── prod/           # Production builds
├── @global/            # Global styles and layouts
│   ├── layout.css      # Layout styles
│   ├── layout.html     # Header/footer templates
│   └── typography.css  # Typography system
├── @library/           # Reusable components (optional)
├── @shared/            # Shared resources (optional)
├── img/                # Images and icons
├── index.md            # Homepage
└── site.yaml           # Site configuration
```

## Verify Installation

Run these commands to verify everything is working:

```bash
# Check Bun version
bun --version

# Check Nue version
nue --version

# Test server
nue serve

# Build test
nue build --dry-run
```

## Common Installation Issues

### Issue: "command not found: nue"

**Cause:** Nue not in PATH

**Solution:**
```bash
# Bun global packages location
export PATH="$HOME/.bun/bin:$PATH"

# Or reinstall
bun install --global nuekit
```

### Issue: "Permission denied" errors

**Cause:** Insufficient permissions for global install

**Solution:**
```bash
# macOS/Linux: Use sudo (not recommended for production)
sudo bun install --global nuekit

# Better: Configure bun to use user directory
bun config set global-bin ~/.bun/bin
```

### Issue: Port 8080 already in use

**Cause:** Another service using default port

**Solution:**
```bash
# Use different port
nue serve --port 3000

# Or in site.yaml
port: 3000
```

### Issue: Hot reload not working

**Cause:** File watcher not detecting changes

**Solution:**
```bash
# Check if files are being saved
# Try restarting server
nue serve

# On macOS: Increase file watch limit
echo kern.maxfiles=65536 | sudo tee -a /etc/sysctl.conf
```

### Issue: Windows-specific problems

**Cause:** Experimental Windows support

**Solutions:**
- Use Windows Terminal or PowerShell
- Run as Administrator if needed
- Check Windows Defender isn't blocking file operations
- Use WSL2 for better compatibility

## Development Environment Setup

### Recommended Editor: VS Code

**Extensions:**
- Markdown All in One
- CSS Custom Properties
- HTML CSS Support
- YAML

**Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.quickSuggestions": {
    "markdown": true
  }
}
```

### Project Initialization

After creating a project, initialize version control:

```bash
cd my-project
git init
git add .
git commit -m "Initial commit"
```

### Environment Configuration

Create `.env` for local development (optional):

```bash
# .env
PORT=8080
NODE_ENV=development
```

## Upgrade Nue

Update to the latest version:

```bash
bun update --global nuekit
```

Check current version:
```bash
nue --version
```

## Next Steps

After installation:

1. **Tutorial**: Follow the [tutorial](tutorial.md) to build your first site
2. **Configuration**: Set up [site.yaml](configuration.md) with your settings
3. **Content**: Create your first [Markdown page](content-management.md)
4. **Layout**: Add [layout modules](layout-modules.md) for structure
5. **Styling**: Customize with [CSS](styling.md)

## Known Limitations

### Windows Support
- Tests pass but support remains experimental
- No active Windows users on core team
- Use WSL2 for best experience on Windows

### Reactive Components
- May struggle with complex nested loops
- Complex conditionals can cause issues
- Keep islands simple for best results

## System Architecture

Nue is built from six core packages (all in ~1MB total):

| Package | Purpose |
|---------|---------|
| Nuekit | Web framework core |
| Nuedom | HTML-first UI assembly |
| Nuestate | URL-first state management |
| Nuemark | Content-first development |
| Nueserver | Edge-first server development |
| Nueglow | CSS-first syntax highlighting |

## Getting Help

- **Documentation**: https://nuejs.org/docs/
- **GitHub Issues**: https://github.com/nuejs/nue/issues
- **Community Slack**: Join via nuejs.org
- **Examples**: Check `/examples` directory in installation

## Installation Checklist

- [ ] Bun 1.2+ installed
- [ ] Nue installed globally
- [ ] Project created with `nue create`
- [ ] Development server running
- [ ] Browser opens to localhost:8080
- [ ] Hot reload working
- [ ] Build command works: `nue build`

## System Requirements Detail

### Minimum Requirements
- RAM: 512MB
- Disk: 50MB
- CPU: Any modern processor

### Recommended
- RAM: 2GB+
- Disk: 500MB+ (for dependencies)
- CPU: Multi-core for faster builds

### Supported Platforms
- macOS 10.15+ (Catalina or later)
- Ubuntu 18.04+ / Debian 10+
- Windows 10+ (experimental)
- Other Linux distributions with glibc 2.17+