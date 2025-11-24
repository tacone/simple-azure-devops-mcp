import { describe, it, expect } from 'vitest';
import { parsePRUrl, type GetPRCommentsOptions } from '../src/pr-comments';

describe('PR Comments utilities', () => {
  describe('GetPRCommentsOptions', () => {
    it('should accept options with statusFilter', () => {
      const options: GetPRCommentsOptions = { statusFilter: 'active' };
      expect(options.statusFilter).toBe('active');
    });

    it('should accept options with includeSystemComments', () => {
      const options: GetPRCommentsOptions = { includeSystemComments: true };
      expect(options.includeSystemComments).toBe(true);
    });

    it('should accept empty options object', () => {
      const options: GetPRCommentsOptions = {};
      expect(options).toEqual({});
    });

    it('should default includeSystemComments to false', () => {
      const options: GetPRCommentsOptions = {};
      expect(options.includeSystemComments).toBeUndefined();
    });

    it('should accept both options together', () => {
      const options: GetPRCommentsOptions = {
        statusFilter: 'active',
        includeSystemComments: false
      };
      expect(options.statusFilter).toBe('active');
      expect(options.includeSystemComments).toBe(false);
    });
  });

  describe('parsePRUrl', () => {
    it('should parse dev.azure.com URL format', () => {
      const url = 'https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/123';
      const result = parsePRUrl(url);

      expect(result.organization).toBe('myorg');
      expect(result.project).toBe('myproject');
      expect(result.repositoryId).toBe('myrepo');
      expect(result.pullRequestId).toBe('123');
    });

    it('should parse visualstudio.com URL format', () => {
      const url = 'https://myorg.visualstudio.com/myproject/_git/myrepo/pullrequest/456';
      const result = parsePRUrl(url);

      expect(result.organization).toBe('myorg');
      expect(result.project).toBe('myproject');
      expect(result.repositoryId).toBe('myrepo');
      expect(result.pullRequestId).toBe('456');
    });

    it('should throw error for invalid URL format', () => {
      const url = 'https://invalid.com/some/path';

      expect(() => parsePRUrl(url)).toThrow('Invalid Azure DevOps PR URL format');
    });

    it('should handle URLs with special characters in project names', () => {
      const url = 'https://dev.azure.com/myorg/my-project-123/_git/my-repo/pullrequest/789';

      const result = parsePRUrl(url);
      expect(result.organization).toBe('myorg');
      expect(result.project).toBe('my-project-123');
      expect(result.repositoryId).toBe('my-repo');
      expect(result.pullRequestId).toBe('789');
    });

    it('should handle numeric PR IDs correctly', () => {
      const url = 'https://dev.azure.com/org/proj/_git/repo/pullrequest/999999';
      const result = parsePRUrl(url);

      expect(result.pullRequestId).toBe('999999');
    });
  });
});
