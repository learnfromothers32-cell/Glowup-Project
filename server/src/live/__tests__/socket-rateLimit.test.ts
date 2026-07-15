import { LiveRateLimiter } from '../socket/rateLimit';

describe('LiveRateLimiter', () => {
  let limiter: LiveRateLimiter;

  beforeEach(() => {
    // Use in-memory mode (no Redis URL)
    limiter = new LiveRateLimiter(undefined, {
      'test:action': { windowMs: 1000, maxRequests: 3 },
    });
  });

  afterEach(async () => {
    await limiter.disconnect();
  });

  describe('isAllowed', () => {
    it('should allow requests within limit', async () => {
      expect(await limiter.isAllowed('user1', 'test:action')).toBe(true);
      expect(await limiter.isAllowed('user1', 'test:action')).toBe(true);
      expect(await limiter.isAllowed('user1', 'test:action')).toBe(true);
    });

    it('should deny requests exceeding limit', async () => {
      for (let i = 0; i < 3; i++) {
        expect(await limiter.isAllowed('user1', 'test:action')).toBe(true);
      }
      expect(await limiter.isAllowed('user1', 'test:action')).toBe(false);
    });

    it('should track different keys independently', async () => {
      for (let i = 0; i < 3; i++) {
        expect(await limiter.isAllowed('user1', 'test:action')).toBe(true);
        expect(await limiter.isAllowed('user2', 'test:action')).toBe(true);
      }
      // Both users should be rate limited now
      expect(await limiter.isAllowed('user1', 'test:action')).toBe(false);
      expect(await limiter.isAllowed('user2', 'test:action')).toBe(false);
    });

    it('should use default config for unknown actions', async () => {
      // Default live:join is 10 per 10 seconds
      for (let i = 0; i < 10; i++) {
        expect(await limiter.isAllowed(`user:${i}`, 'live:join')).toBe(true);
      }
    });

    it('should reset after window expires', async () => {
      const shortLimiter = new LiveRateLimiter(undefined, {
        'short:test': { windowMs: 50, maxRequests: 2 },
      });

      expect(await shortLimiter.isAllowed('user1', 'short:test')).toBe(true);
      expect(await shortLimiter.isAllowed('user1', 'short:test')).toBe(true);
      expect(await shortLimiter.isAllowed('user1', 'short:test')).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(await shortLimiter.isAllowed('user1', 'short:test')).toBe(true);

      await shortLimiter.disconnect();
    });
  });
});
