/**
 * User profile endpoint integration tests
 *
 * Tests the user profile GET and PATCH endpoints.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestContext, getTestContext, type IntegrationTestContext } from '../_helpers/test-context';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  image: string | null;
  tier: string;
}

describe('User Profile Endpoints', () => {
  let ctx: IntegrationTestContext;

  beforeAll(() => {
    ctx = getTestContext();
  });

  afterAll(async () => {
    await cleanupTestContext();
  });

  describe('GET /api/user/profile', () => {
    it('should return user profile with API key auth', async () => {
      const result = await ctx.apiKeyClient.get<{
        success: boolean;
        data: UserProfile;
      }>('/api/user/profile');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.success).toBe(true);
        expect(result.data.data.id).toBeDefined();
        expect(result.data.data.email).toBeDefined();
        expect(result.data.data.username).toBe(ctx.auth.username);
      }
    });

    it('should reject without auth', async () => {
      const result = await ctx.publicClient.get('/api/user/profile');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe('PATCH /api/user/profile', () => {
    it('should update user profile', async () => {
      // First, get current profile
      const profileResult = await ctx.apiKeyClient.get<{
        success: boolean;
        data: UserProfile;
      }>('/api/user/profile');

      expect(profileResult.ok).toBe(true);

      if (profileResult.ok) {
        const originalName = profileResult.data.data.name;

        // Update name
        const updateResult = await ctx.apiKeyClient.patch<{
          success: boolean;
          data: UserProfile;
        }>('/api/user/profile', {
          name: 'Updated Test Name',
        });

        expect(updateResult.ok).toBe(true);
        if (updateResult.ok) {
          expect(updateResult.data.data.name).toBe('Updated Test Name');
        }

        // Restore original name
        await ctx.apiKeyClient.patch('/api/user/profile', {
          name: originalName,
        });
      }
    });

    it('should reject profile update without auth', async () => {
      const result = await ctx.publicClient.patch('/api/user/profile', {
        name: 'Unauthorized Update',
      });

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });
});
