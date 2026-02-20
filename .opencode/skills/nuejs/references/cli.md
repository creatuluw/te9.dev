# Command Line Interface Reference

Complete reference for all Nue command-line commands and options.

## Basic Usage

```bash
nue [command] [options] [file_matches]
nue -v or --version
nue -h or --help
```

## Commands

### serve (default)

Starts the development server for real-time site viewing.

```bash
nue serve
nue serve --port 3000
nue serve --root ./my-site
```

**Default**: This is the default command when no command is specified.

**Features**:
- Hot reloading for instant updates
- Live preview in browser
- Automatic file watching
- Development-friendly error messages

**Options**:
- `--port, -P`: Set server port (default: 8080)
- `--root, -r`: Set source directory (default: current directory)
- `--environment, -e`: Load environment-specific config

### build

Compiles the site for production deployment.

```bash
nue build
nue build --production
nue build .md .css
```

**Output**: Files are placed in `.dist/` directory:
- `.dist/dev/` for development builds
- `.dist/prod/` for production builds

**Build speed**: Usually completes in less than 100 milliseconds, even with hundreds of files.

**Options**:
- `--production, -p`: Build optimized production version
- `--dry-run, -n`: Preview what would be built without creating files
- `--esbuild, -b`: Use esbuild for JavaScript bundling
- `--lcss`: Use lightningcss for CSS minification
- `--environment, -e`: Load environment-specific config

### create

Generates a new project from a starter template.

```bash
nue create simple-blog
nue create simple-mpa
```

**Available templates**:
- `simple-blog`: Basic blog with Markdown posts
- `simple-mpa`: Multi-page application structure

**What it does**:
- Creates project directory
- Sets up proper file structure
- Installs dependencies
- Opens browser to `http://localhost:8083/`

### init

Regenerates system files in `/@nue` directory.

```bash
nue init
```

**Use cases**:
- Reset environment to defaults
- Ensure latest system configurations
- Fix corrupted system files
- Update after version upgrade

## Global Options

### Port Configuration

```bash
# Command line
nue serve --port 3000
nue -P 3000

# Or in site.yaml
port: 3000
```

**Default**: 8080

**Priority**: Command line flag > site.yaml > default

### Root Directory

```bash
nue serve --root ./my-site
nue -r ./my-site
```

**Default**: Current directory (`.`)

### Environment Configuration

```bash
nue build --environment staging.yaml
nue -e staging.yaml
```

Loads additional YAML configuration to override defaults in `site.yaml`.

### Dry Run

```bash
nue build --dry-run
nue -n
```

Displays what would be built without creating any outputs. Useful for:
- Verifying build configuration
- Checking which files are affected
- Debugging build issues

### Production Build

```bash
nue build --production
nue -p
```

Creates optimized production build with:
- Minified CSS and JavaScript
- Inlined critical CSS (if configured)
- Optimized images
- Production metadata

### Bundler Options

```bash
# Use esbuild for JavaScript
nue build --esbuild
nue -b

# Use lightningcss for CSS
nue build --lcss
```

**Note**: These tools must be installed separately:
```bash
bun install --global esbuild lightningcss
```

## File Matches

Build specific file types by providing file extensions or patterns:

```bash
# Build all Markdown and CSS files
nue build .md .css

# Build TypeScript files only
nue build .ts

# Build specific pattern
nue build *.md
```

**How it works**:
- Filters build process to specified file types
- Ignores other files in the project
- Useful for faster incremental builds
- Supports multiple file extensions

## Common Examples

### Development Workflow

```bash
# Start developing
cd my-project
nue serve

# Server starts on http://localhost:8080
# Hot reload enabled
# Changes reflect immediately
```

### Production Build

```bash
# Build for production
nue build --production

# Output in .dist/prod/
# Ready for deployment
```

### Custom Port

```bash
# Use custom port
nue serve --port 3000

# Or set in site.yaml
# port: 3000
```

### Environment-Specific Builds

```bash
# Staging build
nue build --production --environment staging.yaml

# Production build with custom config
nue build -p -e prod.yaml
```

### Incremental Builds

```bash
# Build only Markdown files
nue build .md

# Build CSS and JavaScript
nue build .css .js

# Build specific directory
nue build blog/
```

### Preview Without Building

```bash
# See what would be built
nue build --dry-run

# Check production build without creating files
nue build --production --dry-run
```

## Command Combinations

### Full Development Setup

```bash
# Create new project
nue create simple-blog my-blog

# Navigate to project
cd my-blog

# Start development server
nue serve
```

### Production Deployment

```bash
# Build with optimizations
nue build --production --esbuild --lcss

# Deploy .dist/prod/ to hosting service
```

### Multi-Environment Setup

```bash
# Development
nue serve

# Staging build
nue build --production --environment staging.yaml

# Production build
nue build --production --environment production.yaml
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Build error |
| 4 | File not found |

## Performance

### Build Performance

**Typical build times**:
- Small site (<50 pages): 10-30ms
- Medium site (50-200 pages): 30-70ms
- Large site (200+ pages): 70-150ms

**Factors affecting speed**:
- Number of files
- Image optimization
- JavaScript bundling
- CSS processing

### Optimization Tips

1. **Use dry-run first**: Check what will be built
2. **Build specific file types**: Use file matches for incremental builds
3. **Enable caching**: Built files are cached for faster rebuilds
4. **Minimize dependencies**: Keep project lean

## Configuration Priority

Options are applied in this order (later overrides earlier):

1. Default values
2. `site.yaml` configuration
3. Environment file (`--environment`)
4. Command-line flags

**Example**:
```bash
# site.yaml has: port: 8080
# Environment has: port: 9000
# Command line: --port 3000
# Result: Port 3000 (command line wins)
```

## Troubleshooting

### Server Won't Start

**Issue**: Port already in use
```bash
# Use different port
nue serve --port 3000
```

### Build Fails

**Issue**: Configuration error
```bash
# Check configuration with dry-run
nue build --dry-run

# Validate YAML syntax
nue build --verbose
```

### Files Not Building

**Issue**: Wrong file patterns
```bash
# Check which files are detected
nue build --dry-run

# Build all files
nue build
```

### Slow Builds

**Issue**: Too many files
```bash
# Build only changed file types
nue build .md

# Skip production optimizations during development
nue build
```

## Advanced Usage

### Custom Build Scripts

Create npm scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "nue serve",
    "build": "nue build --production",
    "build:staging": "nue build --production -e staging.yaml",
    "preview": "nue build --dry-run"
  }
}
```

### Continuous Integration

Example CI/CD build command:

```bash
# Install dependencies
bun install

# Build for production
nue build --production --esbuild --lcss

# Deploy .dist/prod/
```

### Watch Mode (Coming Soon)

Future feature for automatic rebuilding:
```bash
nue build --watch
```

## Debugging

### Verbose Output

```bash
# Enable verbose logging (if available)
DEBUG=* nue serve

# Check build output
nue build --dry-run
```

### Log Files

Build logs are written to:
- `.dist/build.log` - Build output
- Console output - Real-time logging

## Best Practices

1. **Use dry-run first**: Verify configuration before building
2. **Separate environments**: Use different config files for staging/production
3. **Incremental builds**: Build specific file types during development
4. **Version control**: Track configuration changes
5. **Port management**: Use consistent ports across team

## Quick Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `nue` | Start dev server | `nue` |
| `nue serve` | Start dev server | `nue serve --port 3000` |
| `nue build` | Build site | `nue build --production` |
| `nue create` | Create project | `nue create simple-blog` |
| `nue init` | Reset system | `nue init` |
| `--port, -P` | Set port | `nue -P 3000` |
| `--production, -p` | Production build | `nue build -p` |
| `--dry-run, -n` | Preview build | `nue build -n` |
| `--root, -r` | Set root dir | `nue -r ./site` |
| `--environment, -e` | Load config | `nue -e staging.yaml` |
| `--esbuild, -b` | Use esbuild | `nue build -b` |
| `--lcss` | Use lightningcss | `nue build --lcss` |

## Getting Help

```bash
# Show help
nue --help
nue -h

# Show version
nue --version
nue -v

# Community support
# GitHub: https://github.com/nuejs/nue/issues
# Docs: https://nuejs.org/docs/
```
