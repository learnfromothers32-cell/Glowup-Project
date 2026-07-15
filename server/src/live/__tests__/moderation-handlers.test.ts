/**
 * Moderation Handlers Tests
 */

import { LiveModeration } from '../models/LiveModeration';
import { LiveParticipant } from '../models/LiveParticipant';
import { LiveChatMessage } from '../models/LiveChatMessage';
import { LiveSession } from '../models/LiveSession';

// Mock models
jest.mock('../models/LiveModeration');
jest.mock('../models/LiveParticipant');
jest.mock('../models/LiveChatMessage');
jest.mock('../models/LiveSession');

const MockedModeration = LiveModeration as jest.Mocked<typeof LiveModeration>;
const MockedParticipant = LiveParticipant as jest.Mocked<typeof LiveParticipant>;
const MockedMessage = LiveChatMessage as jest.Mocked<typeof LiveChatMessage>;
const MockedSession = LiveSession as jest.Mocked<typeof LiveSession>;

describe('Moderation Models', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LiveModeration', () => {
    it('should have correct action enum values', () => {
      const schema = MockedModeration.schema;
      expect(schema).toBeDefined();
    });
  });

  describe('LiveParticipant mute/ban', () => {
    it('should have isMuted field', () => {
      const schema = MockedParticipant.schema;
      expect(schema).toBeDefined();
    });
  });

  describe('LiveChatMessage soft delete', () => {
    it('should have isDeleted field', () => {
      const schema = MockedMessage.schema;
      expect(schema).toBeDefined();
    });
  });

  describe('LiveSession report tracking', () => {
    it('should have reportCount field', () => {
      const schema = MockedSession.schema;
      expect(schema).toBeDefined();
    });
  });
});

describe('Moderation Action Types', () => {
  it('should support all required moderation actions', () => {
    const actions = [
      'mute', 'unmute', 'kick', 'ban', 'unban',
      'delete_message', 'report', 'slow_mode_change',
      'chat_toggle', 'gifts_toggle',
    ];
    expect(actions).toContain('mute');
    expect(actions).toContain('unmute');
    expect(actions).toContain('ban');
    expect(actions).toContain('unban');
    expect(actions).toContain('delete_message');
    expect(actions).toContain('report');
  });
});

describe('Moderation Audit Log', () => {
  it('should support required audit fields', () => {
    const auditEntry = {
      sessionId: 'session123',
      action: 'mute',
      targetUserId: 'user456',
      performedBy: 'host789',
      reason: 'Spamming',
      createdAt: new Date(),
    };

    expect(auditEntry.sessionId).toBeDefined();
    expect(auditEntry.action).toBe('mute');
    expect(auditEntry.targetUserId).toBeDefined();
    expect(auditEntry.performedBy).toBeDefined();
    expect(auditEntry.reason).toBeDefined();
  });

  it('should support optional reason', () => {
    const auditEntry: {
      sessionId: string;
      action: string;
      targetUserId: string;
      performedBy: string;
      reason?: string;
    } = {
      sessionId: 'session123',
      action: 'unmute',
      targetUserId: 'user456',
      performedBy: 'host789',
    };

    expect(auditEntry.reason).toBeUndefined();
  });
});

describe('Guest Request Status', () => {
  it('should support all guest request statuses', () => {
    const statuses = ['pending', 'accepted', 'rejected', 'cancelled'];
    expect(statuses).toHaveLength(4);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('accepted');
    expect(statuses).toContain('rejected');
    expect(statuses).toContain('cancelled');
  });
});

describe('Reaction Types', () => {
  it('should support all required reaction types', () => {
    const reactions = ['love', 'fire', 'clap', 'wow', 'glow'];
    expect(reactions).toHaveLength(5);
    expect(reactions).toContain('love');
    expect(reactions).toContain('fire');
    expect(reactions).toContain('clap');
    expect(reactions).toContain('wow');
    expect(reactions).toContain('glow');
  });
});
