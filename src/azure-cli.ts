import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface AzureExtension {
  experimental: boolean;
  extensionType: string;
  name: string;
  path: string;
  preview: boolean;
  version: string;
}

/**
 * Check if Azure CLI is installed and available
 */
export async function checkAzCliAvailable(): Promise<{
  available: boolean;
  version?: string;
  error?: string;
}> {
  try {
    const { stdout } = await execAsync('az --version');
    const versionMatch = stdout.match(/azure-cli\s+(\S+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';

    return { available: true, version };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Azure CLI not found',
    };
  }
}

/**
 * Check if user is authenticated with Azure CLI
 */
export async function checkAzAuthentication(): Promise<{
  authenticated: boolean;
  account?: string;
  error?: string;
}> {
  try {
    const { stdout } = await execAsync('az account show');
    const account = JSON.parse(stdout);

    return {
      authenticated: true,
      account: account.user?.name || account.name,
    };
  } catch {
    return {
      authenticated: false,
      error: 'Not authenticated. Please run: az login',
    };
  }
}

/**
 * Ensure Azure DevOps extension is installed
 */
export async function ensureAzDevOpsExtension(): Promise<{ installed: boolean; error?: string }> {
  try {
    // Check if extension is installed
    const { stdout } = await execAsync('az extension list --output json');
    const extensions: AzureExtension[] = JSON.parse(stdout);
    const devopsExtension = extensions.find((ext) => ext.name === 'azure-devops');

    if (devopsExtension) {
      return { installed: true };
    }

    // Try to install it
    await execAsync('az extension add --name azure-devops');
    return { installed: true };
  } catch (error) {
    return {
      installed: false,
      error: error instanceof Error ? error.message : 'Failed to install azure-devops extension',
    };
  }
}
