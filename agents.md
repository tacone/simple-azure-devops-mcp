# Development Guidelines

## Package Manager

**The official package manager for this project is [pnpm](https://pnpm.io/).**

When working on this project, AI agents and developers should:

1. **Always use pnpm** for package management operations
2. **Never use npm or yarn** - this ensures consistency and proper dependency resolution
3. **Use pnpm commands** for all operations:
   - Install dependencies: `pnpm install`
   - Add dependencies: `pnpm add <package>`
   - Remove dependencies: `pnpm remove <package>`
   - Run scripts: `pnpm <script-name>`

## Why pnpm?

- **Disk space efficiency**: pnpm uses a content-addressable store for packages
- **Faster installations**: Packages are linked rather than copied
- **Strict dependency resolution**: Prevents phantom dependencies
- **Consistency**: Lockfile ensures reproducible builds across environments

## Common Commands

```bash
# Install all dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test run

# Run tests with coverage
pnpm test:coverage run

# Development mode (watch)
pnpm dev
```

## For AI Agents

When suggesting package installations or modifications:

- ✅ Use: `pnpm add <package>`
- ❌ Don't use: `npm install <package>` or `yarn add <package>`

When running scripts:

- ✅ Use: `pnpm test`
- ❌ Don't use: `npm test` or `yarn test`

## Project Structure

- `src/` - TypeScript source files
- `dist/` - Compiled JavaScript (gitignored)
- `node_modules/` - Dependencies managed by pnpm
- `pnpm-lock.yaml` - Lockfile (commit this)

## Testing

Tests are written using [Vitest](https://vitest.dev/):

- Test files: `*.test.ts`
- Location: Alongside source files in `src/`
- Run tests: `pnpm vitest run`

## Building

TypeScript is compiled to JavaScript in the `dist/` directory:

- Source: `src/`
- Output: `dist/`
- Config: `tsconfig.json`

Always build before running: `pnpm build`
