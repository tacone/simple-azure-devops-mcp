#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import {
  checkAzCliAvailable,
  checkAzAuthentication,
  ensureAzDevOpsExtension,
} from './azure-cli.js';
import { getPRComments } from './pr-comments.js';

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'get_pr_comments',
    description:
      'Retrieves comments from an Azure DevOps Pull Request with their metadata. Optionally filter by comment status (active, fixed, closed, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        pr_url: {
          type: 'string',
          description:
            'The full URL of the Azure DevOps Pull Request (e.g., https://dev.azure.com/{org}/{project}/_git/{repo}/pullrequest/{id})',
        },
        status_filter: {
          type: 'string',
          description:
            'Optional filter for comment status. Values: active, fixed, closed, wontfix, pending, bydesign, unknown, system',
          enum: [
            'active',
            'fixed',
            'closed',
            'wontfix',
            'pending',
            'bydesign',
            'unknown',
            'system',
          ],
        },
      },
      required: ['pr_url'],
    },
  },
  {
    name: 'check_azure_cli',
    description: 'Checks if Azure CLI is installed and the user is authenticated',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: 'simple-azure-devops-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'check_azure_cli') {
      // Check Azure CLI availability
      const cliCheck = await checkAzCliAvailable();
      if (!cliCheck.available) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Azure CLI is not installed or not available in PATH',
                  details: cliCheck.error,
                  instructions:
                    'Please install Azure CLI from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Check authentication
      const authCheck = await checkAzAuthentication();
      if (!authCheck.authenticated) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  cli_installed: true,
                  cli_version: cliCheck.version,
                  authenticated: false,
                  error: authCheck.error,
                  instructions: 'Please run: az login',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Check Azure DevOps extension
      const extensionCheck = await ensureAzDevOpsExtension();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                cli_installed: true,
                cli_version: cliCheck.version,
                authenticated: true,
                account: authCheck.account,
                devops_extension: extensionCheck.installed,
                status: 'ready',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'get_pr_comments') {
      const { pr_url, status_filter } = args as { pr_url: string; status_filter?: string };

      if (!pr_url) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'pr_url is required' }, null, 2),
            },
          ],
          isError: true,
        };
      }

      // Verify Azure CLI is available and authenticated
      const cliCheck = await checkAzCliAvailable();
      if (!cliCheck.available) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Azure CLI is not available',
                  instructions: 'Please install Azure CLI and run: az login',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const authCheck = await checkAzAuthentication();
      if (!authCheck.authenticated) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Not authenticated with Azure CLI',
                  instructions: 'Please run: az login',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Ensure Azure DevOps extension is installed
      await ensureAzDevOpsExtension();

      // Get PR comments
      const comments = await getPRComments(pr_url, { statusFilter: status_filter });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                pr_url,
                status_filter: status_filter || 'all',
                total_comments: comments.length,
                comments: comments.map((c) => ({
                  id: c.id,
                  thread_id: c.threadId,
                  author: c.author.displayName,
                  author_email: c.author.uniqueName,
                  content: c.content,
                  status: c.status,
                  thread_status: c.threadStatus,
                  comment_type: c.commentType,
                  published_date: c.publishedDate,
                  last_updated_date: c.lastUpdatedDate,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Unknown tool: ${name}` }, null, 2),
        },
      ],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : 'Unknown error',
              tool: name,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Azure PR MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
