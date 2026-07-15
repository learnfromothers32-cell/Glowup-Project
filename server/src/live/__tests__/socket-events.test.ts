import {
  joinRoomSchema,
  leaveRoomSchema,
  heartbeatSchema,
  LIVE_ERROR_CODES,
} from '../socket/types';

describe('Live Socket Event Schemas', () => {
  describe('joinRoomSchema', () => {
    it('should accept valid join payload', () => {
      const result = joinRoomSchema.safeParse({
        sessionId: 'abc123',
        role: 'viewer',
      });
      expect(result.success).toBe(true);
    });

    it('should accept join with displayName', () => {
      const result = joinRoomSchema.safeParse({
        sessionId: 'abc123',
        role: 'host',
        displayName: 'Test Host',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid roles', () => {
      for (const role of ['host', 'viewer', 'moderator', 'admin', 'guest']) {
        const result = joinRoomSchema.safeParse({
          sessionId: 'abc123',
          role,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject empty sessionId', () => {
      const result = joinRoomSchema.safeParse({
        sessionId: '',
        role: 'viewer',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const result = joinRoomSchema.safeParse({
        sessionId: 'abc123',
        role: 'superadmin',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing sessionId', () => {
      const result = joinRoomSchema.safeParse({
        role: 'viewer',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing role', () => {
      const result = joinRoomSchema.safeParse({
        sessionId: 'abc123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject displayName exceeding 100 chars', () => {
      const result = joinRoomSchema.safeParse({
        sessionId: 'abc123',
        role: 'viewer',
        displayName: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('leaveRoomSchema', () => {
    it('should accept valid leave payload', () => {
      const result = leaveRoomSchema.safeParse({ sessionId: 'abc123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      const result = leaveRoomSchema.safeParse({ sessionId: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('heartbeatSchema', () => {
    it('should accept valid heartbeat', () => {
      const result = heartbeatSchema.safeParse({ sessionId: 'abc123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty sessionId', () => {
      const result = heartbeatSchema.safeParse({ sessionId: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('LIVE_ERROR_CODES', () => {
    it('should have all required error codes', () => {
      expect(LIVE_ERROR_CODES.AUTH_REQUIRED).toBe('AUTH_REQUIRED');
      expect(LIVE_ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN');
      expect(LIVE_ERROR_CODES.ROOM_NOT_FOUND).toBe('ROOM_NOT_FOUND');
      expect(LIVE_ERROR_CODES.ROOM_CLOSED).toBe('ROOM_CLOSED');
      expect(LIVE_ERROR_CODES.DUPLICATE_JOIN).toBe('DUPLICATE_JOIN');
      expect(LIVE_ERROR_CODES.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
      expect(LIVE_ERROR_CODES.RATE_LIMITED).toBe('RATE_LIMITED');
      expect(LIVE_ERROR_CODES.INVALID_PAYLOAD).toBe('INVALID_PAYLOAD');
      expect(LIVE_ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });
});
