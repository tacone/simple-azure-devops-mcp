import { describe, it, expect, vi } from 'vitest';
import {
  checkAzCliAvailable,
  checkAzAuthentication,
  ensureAzDevOpsExtension,
} from '../src/azure-cli';
import { exec } from 'child_process';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

describe('Azure CLI utilities', () => {
  describe('checkAzCliAvailable', () => {
    it('should return available true when az cli is installed', async () => {
      const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
      mockExec.mockImplementation((cmd: string, callback: CallableFunction) => {
        callback(null, { stdout: 'azure-cli                         2.50.0' });
      });

      const result = await checkAzCliAvailable();
      expect(result.available).toBe(true);
      expect(result.version).toBe('2.50.0');
    });

    it('should return available false when az cli is not installed', async () => {
      const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
      mockExec.mockImplementation((cmd: string, callback: CallableFunction) => {
        callback(new Error('command not found: az'));
      });

      const result = await checkAzCliAvailable();
      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('checkAzAuthentication', () => {
    it('should return authenticated true when user is logged in', async () => {
      const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
      mockExec.mockImplementation((cmd: string, callback: CallableFunction) => {
        callback(null, {
          stdout: JSON.stringify({
            user: { name: 'test@example.com' },
            name: 'Test Subscription',
          }),
        });
      });

      const result = await checkAzAuthentication();
      expect(result.authenticated).toBe(true);
      expect(result.account).toBe('test@example.com');
    });

    it('should return authenticated false when user is not logged in', async () => {
      const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
      mockExec.mockImplementation((cmd: string, callback: CallableFunction) => {
        callback(new Error('Please run "az login"'));
      });

      const result = await checkAzAuthentication();
      expect(result.authenticated).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });

  describe('ensureAzDevOpsExtension', () => {
    it('should return installed true when extension is already installed', async () => {
      const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
      mockExec.mockImplementation((cmd: string, callback: CallableFunction) => {
        if (cmd.includes('extension list')) {
          callback(null, {
            stdout: JSON.stringify([{ name: 'azure-devops', version: '0.26.0' }]),
          });
        }
      });

      const result = await ensureAzDevOpsExtension();
      expect(result.installed).toBe(true);
    });

    it('should install extension when not present', async () => {
      const mockExec = exec as unknown as ReturnType<typeof vi.fn>;
      let callCount = 0;
      mockExec.mockImplementation((cmd: string, callback: CallableFunction) => {
        callCount++;
        if (cmd.includes('extension list')) {
          callback(null, { stdout: JSON.stringify([]) });
        } else if (cmd.includes('extension add')) {
          callback(null, { stdout: 'Extension installed' });
        }
      });

      const result = await ensureAzDevOpsExtension();
      expect(result.installed).toBe(true);
      expect(callCount).toBe(2);
    });
  });
});
