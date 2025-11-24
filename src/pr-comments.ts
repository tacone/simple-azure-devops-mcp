import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PullRequestComment {
  id: number;
  content: string;
  author: {
    displayName: string;
    uniqueName: string;
  };
  publishedDate: string;
  lastUpdatedDate: string;
  commentType: string;
  threadId?: number;
  status?: string;
  threadStatus?: string;
}

export interface ParsedPRUrl {
  organization: string;
  project: string;
  repositoryId: string;
  pullRequestId: string;
}

export interface GetPRCommentsOptions {
  statusFilter?: string;
  includeSystemComments?: boolean;
}

/**
 * Parse Azure DevOps PR URL to extract components
 * Supports formats like:
 * - https://dev.azure.com/{org}/{project}/_git/{repo}/pullrequest/{id}
 */
export function parsePRUrl(url: string): ParsedPRUrl {
  // Handle dev.azure.com format
  const devAzureMatch = url.match(
    /https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)\/pullrequest\/(\d+)/
  );

  if (devAzureMatch) {
    return {
      organization: devAzureMatch[1],
      project: decodeURIComponent(devAzureMatch[2]),
      repositoryId: decodeURIComponent(devAzureMatch[3]),
      pullRequestId: devAzureMatch[4],
    };
  }

  // Handle legacy format: {org}.visualstudio.com
  const legacyMatch = url.match(
    /https:\/\/([^\.]+)\.visualstudio\.com\/([^\/]+)\/_git\/([^\/]+)\/pullrequest\/(\d+)/
  );

  if (legacyMatch) {
    return {
      organization: legacyMatch[1],
      project: decodeURIComponent(legacyMatch[2]),
      repositoryId: decodeURIComponent(legacyMatch[3]),
      pullRequestId: legacyMatch[4],
    };
  }

  throw new Error('Invalid Azure DevOps PR URL format');
}

/**
 * Get PR comments using Azure CLI
 */
export async function getPRComments(
  prUrl: string,
  options: GetPRCommentsOptions = {}
): Promise<PullRequestComment[]> {
  const { statusFilter, includeSystemComments = false } = options;
  const { organization, project, repositoryId, pullRequestId } = parsePRUrl(prUrl);

  // Get PR work items and threads - no --project needed, org is sufficient
  const cmd = `az repos pr show --id ${pullRequestId} --org https://dev.azure.com/${organization} --output json`;

  try {
    // First, get the PR to validate it exists
    await execAsync(cmd);

    // Use az devops invoke to get PR threads
    const getThreadsCmd = `az devops invoke \
      --area git \
      --resource pullRequestThreads \
      --org https://dev.azure.com/${organization} \
      --route-parameters project="${project}" repositoryId="${repositoryId}" pullRequestId=${pullRequestId} \
      --api-version 7.0 \
      --http-method GET \
      --output json`;

    const { stdout } = await execAsync(getThreadsCmd);
    const response = JSON.parse(stdout);
    const threads = response.value || [];

    // Extract comments from threads
    const comments: PullRequestComment[] = [];

    for (const thread of threads) {
      const threadStatus = thread.status;

      if (thread.comments && Array.isArray(thread.comments)) {
        for (const comment of thread.comments) {
          const commentStatus =
            comment.commentType === 'system' ? 'system' : threadStatus?.toLowerCase() || 'active';

          // Skip system comments unless explicitly included
          if (!includeSystemComments && comment.commentType === 'system') {
            continue;
          }

          // Apply status filter if provided
          if (statusFilter && commentStatus !== statusFilter.toLowerCase()) {
            continue;
          }

          comments.push({
            id: comment.id,
            content: comment.content || '',
            author: {
              displayName: comment.author?.displayName || 'Unknown',
              uniqueName: comment.author?.uniqueName || '',
            },
            publishedDate: comment.publishedDate,
            lastUpdatedDate: comment.lastUpdatedDate || comment.publishedDate,
            commentType: comment.commentType || 'text',
            threadId: thread.id,
            status: commentStatus,
            threadStatus: threadStatus,
          });
        }
      }
    }

    return comments;
  } catch (error) {
    throw new Error(
      `Failed to get PR comments: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
