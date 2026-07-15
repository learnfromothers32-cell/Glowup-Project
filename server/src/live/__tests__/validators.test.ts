import {
  createLiveSessionSchema,
  updateLiveSessionSchema,
  sessionIdParamSchema,
  discoverSessionsQuerySchema,
} from '../validators';

describe('Live Validators', () => {
  describe('createLiveSessionSchema', () => {
    it('should validate a valid session', () => {
      const input = {
        title: 'Test Session',
        description: 'A test session',
        category: 'beauty',
        tags: ['hair', 'makeup'],
      };

      const result = createLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const input = {
        description: 'No title',
      };

      const result = createLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject title over 200 chars', () => {
      const input = {
        title: 'a'.repeat(201),
      };

      const result = createLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject more than 10 tags', () => {
      const input = {
        title: 'Test',
        tags: Array(11).fill('tag'),
      };

      const result = createLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept valid scheduledAt', () => {
      const input = {
        title: 'Test',
        scheduledAt: '2026-12-31T23:59:59.000Z',
      };

      const result = createLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid scheduledAt', () => {
      const input = {
        title: 'Test',
        scheduledAt: 'not-a-date',
      };

      const result = createLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('updateLiveSessionSchema', () => {
    it('should validate a valid update', () => {
      const input = {
        title: 'Updated Title',
        category: 'new-category',
      };

      const result = updateLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept partial updates', () => {
      const input = {
        title: 'Only title updated',
      };

      const result = updateLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept settings updates', () => {
      const input = {
        settings: {
          chatEnabled: false,
          slowModeMs: 5000,
        },
      };

      const result = updateLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid maxViewers', () => {
      const input = {
        settings: {
          maxViewers: 0,
        },
      };

      const result = updateLiveSessionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('sessionIdParamSchema', () => {
    it('should validate a valid ObjectId', () => {
      const input = { id: '507f1f77bcf86cd799439011' };
      const result = sessionIdParamSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid ObjectId', () => {
      const input = { id: 'invalid-id' };
      const result = sessionIdParamSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('discoverSessionsQuerySchema', () => {
    it('should validate a valid query', () => {
      const input = {
        category: 'beauty',
        sort: 'trending',
        limit: '20',
      };

      const result = discoverSessionsQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it('should default limit to 20', () => {
      const input = {};

      const result = discoverSessionsQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it('should cap limit at 50', () => {
      const input = {
        limit: '100',
      };

      const result = discoverSessionsQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should accept valid sort values', () => {
      const sorts = ['trending', 'newest', 'popular'];
      for (const sort of sorts) {
        const result = discoverSessionsQuerySchema.safeParse({ sort });
        expect(result.success).toBe(true);
      }
    });
  });
});
