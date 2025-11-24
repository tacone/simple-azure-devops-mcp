# Azure PR MCP Server

A Model Context Protocol (MCP) server for reviewing Azure DevOps Pull Request comments using the Azure CLI.

🔒 Readonly.

🤖 Made by the AI for the AI.

## Features

- ✅ **Azure CLI Validation** - Automatically checks for Azure CLI availability
- 🔐 **Authentication Handling** - Verifies Azure CLI authentication status
- 💬 **PR Comment Retrieval** - Fetches PR comments with full metadata
- 🔍 **Status Filtering** - Filter comments by status (active, fixed, closed, etc.)
- 🧪 **Unit Tests** - Comprehensive test coverage using Vitest

## Prerequisites

1. **Node.js** >= 18
2. **pnpm** >= 9.0.0
3. **Azure CLI** - [Installation guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
4. **Azure DevOps Organization** - Access to an Azure DevOps organization with pull requests

## Installation

### Install dependencies

```bash
pnpm install
```

### Build the project

```bash
pnpm build
```

## Azure CLI Setup

1. **Install Azure CLI** (if not already installed):
   - macOS: `brew install azure-cli`
   - Windows: Download from [Microsoft Docs](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows)
   - Linux: Follow [Linux installation guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-linux)

2. **Login to Azure**:

   ```bash
   az login
   ```

3. **The Azure DevOps extension will be automatically installed** when you first use the server.

## Usage

### Running the MCP Server

The server runs on stdio and is designed to be used with MCP clients:

```bash
node dist/index.js
```

### Available Tools

#### 1. `check_azure_cli`

Checks if Azure CLI is installed and the user is authenticated.

**Input**: None

**Output**:

```json
{
  "cli_installed": true,
  "cli_version": "2.50.0",
  "authenticated": true,
  "account": "user@example.com",
  "devops_extension": true,
  "status": "ready"
}
```

#### 2. `get_pr_comments`

Retrieves comments from an Azure DevOps Pull Request with optional status filtering.

**Input**:

- `pr_url` (required): Full Azure DevOps PR URL
  - Format: `https://dev.azure.com/{org}/{project}/_git/{repo}/pullrequest/{id}`
  - Legacy format: `https://{org}.visualstudio.com/{project}/_git/{repo}/pullrequest/{id}`
- `status_filter` (optional): Filter by comment status
  - Options: `active`, `fixed`, `closed`, `wontfix`, `pending`, `bydesign`, `unknown`, `system`

**Output**:

```json
{
  "pr_url": "https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/123",
  "status_filter": "active",
  "total_comments": 5,
  "comments": [
    {
      "id": 1,
      "thread_id": 100,
      "author": "John Doe",
      "author_email": "john.doe@example.com",
      "content": "Please add error handling here",
      "status": "active",
      "thread_status": "active",
      "comment_type": "text",
      "published_date": "2025-11-20T10:30:00Z",
      "last_updated_date": "2025-11-20T10:30:00Z"
    }
  ]
}
```

### Example PR URL Formats

```plaintext
https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/123

https://myorg.visualstudio.com/myproject/_git/myrepo/pullrequest/456
```

## MCP Client Configuration

### VS Code with GitHub Copilot (User-Level Global Configuration)

For global access across all workspaces, add the server to your user-level MCP configuration:

**File Location**: `~/.config/Code/User/mcp.json` (Linux/macOS) or `%APPDATA%\Code\User\mcp.json` (Windows)

Add this entry to the `servers` object:

```json
{
  "servers": {
    "simple-azure-devops-mcp": {
      "command": "node",
      "type": "stdio",
      "args": ["/absolute/path/to/azure-mcp/dist/index.js"]
    }
  }
}
```

**Important**: Replace `/absolute/path/to/azure-mcp/dist/index.js` with the actual path to your built project.

**Setup Steps**:

1. Build the project: `pnpm build`
2. Edit `~/.config/Code/User/mcp.json` and add the server configuration
3. Reload VS Code window (Cmd/Ctrl + Shift + P → "Developer: Reload Window")
4. Open GitHub Copilot Chat
5. The MCP tools will be available in all workspaces

### VS Code with GitHub Copilot (Workspace Level)

Create or edit `.vscode/settings.json` to automatically enable MCP server for the current workspace:

```json
{
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.servers": {
    "simple-azure-devops-mcp": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"]
    }
  }
}
```

**Setup Steps**:

1. Open this workspace in VS Code
2. Ensure the project is built: `pnpm build`
3. Reload VS Code window (Cmd/Ctrl + Shift + P → "Developer: Reload Window")
4. Open GitHub Copilot Chat
5. The MCP tools will be automatically available

**Note**: Make sure you have GitHub Copilot enabled and MCP support is available in your VS Code version.

### VS Code (Cline Extension)

1. **Install the Cline extension** from the VS Code marketplace
2. **Open Cline Settings** (click the gear icon in Cline panel)
3. **Add MCP Server** in the MCP Servers section:

```json
{
  "mcpServers": {
    "simple-azure-devops-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/azure-mcp/dist/index.js"]
    }
  }
}
```

**Important**: Use the absolute path to your project. For example:

- Linux/macOS: `/home/username/Code/azure-mcp/dist/index.js`
- Windows: `C:\\Users\\username\\Code\\azure-mcp\\dist\\index.js`

4. **Restart Cline** or reload VS Code
5. The tools should now appear in Cline's available tools

### VS Code Settings Location

You can also manually edit the Cline configuration file:

- **Linux**: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **macOS**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

### Claude Desktop

Add this server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "simple-azure-devops-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/azure-mcp/dist/index.js"]
    }
  }
}
```

Configuration file location:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## Development

**This project uses [pnpm](https://pnpm.io/) as its official package manager.** Please use pnpm for all package management operations to ensure consistency and proper dependency resolution.

### Run tests

```bash
pnpm test
```

### Run tests with coverage

```bash
pnpm test:coverage
```

### Linting and Formatting

This project uses ESLint for linting and Prettier for code formatting:

```bash
# Run linter
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting without making changes
pnpm format:check
```

### Git Hooks

Husky is configured to run lint-staged on pre-commit, which automatically:

- Runs ESLint with auto-fix on staged TypeScript files
- Formats code with Prettier

This ensures code quality and consistency before commits.

### Watch mode for development

```bash
pnpm dev
```

## Project Structure

```
azure-mcp/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── azure-cli.ts          # Azure CLI utilities
│   ├── pr-comments.ts        # PR comment retrieval logic
│   ├── azure-cli.test.ts     # Tests for Azure CLI utilities
│   └── pr-comments.test.ts   # Tests for PR comment parsing
├── dist/                     # Compiled JavaScript (generated)
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
├── vitest.config.ts          # Vitest test configuration
└── README.md                 # This file
```

## Comment Status Types

- **active**: Comment thread is active and requires attention
- **fixed**: Issue has been addressed
- **closed**: Thread is closed
- **wontfix**: Issue won't be addressed
- **pending**: Waiting for action
- **bydesign**: Behavior is intentional
- **unknown**: Status is not determined
- **system**: System-generated comment

## Troubleshooting

### Azure CLI not found

```
Error: Azure CLI is not installed or not available in PATH
```

**Solution**: Install Azure CLI and ensure it's in your PATH.

### Not authenticated

```
Error: Not authenticated. Please run: az login
```

**Solution**: Run `az login` and complete the authentication flow.

### Azure DevOps extension missing

The server will automatically attempt to install the `azure-devops` extension. If this fails:

```bash
az extension add --name azure-devops
```

### Invalid PR URL format

```
Error: Invalid Azure DevOps PR URL format
```

**Solution**: Ensure your PR URL matches one of these formats:

- `https://dev.azure.com/{org}/{project}/_git/{repo}/pullrequest/{id}`
- `https://{org}.visualstudio.com/{project}/_git/{repo}/pullrequest/{id}`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/)
- [Azure DevOps REST API](https://docs.microsoft.com/en-us/rest/api/azure/devops/)
