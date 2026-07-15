import { LiveChatService } from '../services/LiveChatService';
import { MockChatBroadcaster } from '../socket/broadcast/MockChatBroadcaster';

const SESSION_A = 'session_a_001';

const mockSessionLive = {
  _id: SESSION_A,
  status: 'live',
  settings: { chatEnabled: true, slowModeMs: 0 },
};

jest.mock('../repositories/LiveChatMessageRepository', () => ({
  liveChatMessageRepository: {
    findByMessageId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((input) =>
      Promise.resolve({
        _id: new (require('mongoose').Types.ObjectId)().toHexString(),
        ...input,
        sequenceNumber: input.sequenceNumber || 1,
        createdAt: new Date(),
      })
    ),
    findMessageByIdAndSession: jest.fn().mockResolvedValue(null),
    softDelete: jest.fn().mockResolvedValue(null),
    pinMessage: jest.fn().mockResolvedValue(null),
    unpinMessage: jest.fn().mockResolvedValue(null),
    findRecentMessages: jest.fn().mockResolvedValue([]),
    paginateMessages: jest.fn().mockResolvedValue({ messages: [], hasMore: false }),
    getNextSequenceNumber: jest.fn().mockResolvedValue(1),
    countMessages: jest.fn().mockResolvedValue(0),
  },
}));

jest.mock('../repositories/LiveSessionRepository', () => ({
  liveSessionRepository: {
    findById: jest.fn().mockImplementation(() => Promise.resolve(null)),
    incrementChatMessageCount: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { liveChatMessageRepository } from '../repositories/LiveChatMessageRepository';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';

function setupMocks(sessionOverride?: Partial<typeof mockSessionLive> | null) {
  const repo = liveChatMessageRepository as any;
  repo.findByMessageId.mockResolvedValue(null);
  repo.create.mockClear();
  repo.findMessageByIdAndSession.mockResolvedValue(null);
  repo.softDelete.mockResolvedValue(null);
  repo.pinMessage.mockResolvedValue(null);
  repo.unpinMessage.mockResolvedValue(null);
  repo.getNextSequenceNumber.mockResolvedValue(1);

  const sessionRepo = liveSessionRepository as any;
  if (sessionOverride === null) {
    sessionRepo.findById.mockImplementation(() => Promise.resolve(null));
  } else if (sessionOverride) {
    sessionRepo.findById.mockImplementation(() => Promise.resolve({ ...mockSessionLive, ...sessionOverride }));
  } else {
    sessionRepo.findById.mockImplementation(() => Promise.resolve(mockSessionLive));
  }
  sessionRepo.incrementChatMessageCount.mockReset();
}

describe('LiveChatService', () => {
  describe('sendMessage - success', () => {
    it('should send a message successfully', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({ broadcaster });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_send_01',
        senderName: 'Alice',
        content: 'Hello world',
        messageId: 'msg-send-01',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
      expect((liveChatMessageRepository as any).create).toHaveBeenCalled();
      expect(broadcaster.getPublishLog()).toHaveLength(1);
      expect(broadcaster.getPublishLog()[0].event).toBe('live:chat:message');
    });

    it('should increment chat message count', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({ broadcaster });

      await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_count_01',
        senderName: 'Bob',
        content: 'Count me',
        messageId: 'msg-count-01',
      });

      expect((liveSessionRepository as any).incrementChatMessageCount).toHaveBeenCalledWith(SESSION_A);
    });
  });

  describe('sendMessage - idempotency', () => {
    it('should return existing message if messageId already exists', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const existingMsg = { _id: 'existing', messageId: 'msg-idempotent-01', content: 'Existing' };
      (liveChatMessageRepository as any).findByMessageId.mockResolvedValue(existingMsg);

      const service = new LiveChatService({ broadcaster });
      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_idemp_01',
        senderName: 'Alice',
        content: 'Hello world',
        messageId: 'msg-idempotent-01',
      });

      expect(result.success).toBe(true);
      expect(result.message).toEqual(existingMsg);
      expect((liveChatMessageRepository as any).create).not.toHaveBeenCalled();
      expect(broadcaster.getPublishLog()).toHaveLength(0);
    });
  });

  describe('sendMessage - validation', () => {
    it('should reject empty messages', async () => {
      setupMocks();
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_valid_01',
        senderName: 'Alice',
        content: '   ',
        messageId: 'msg-valid-01',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject messages exceeding max length', async () => {
      setupMocks();
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_valid_02',
        senderName: 'Alice',
        content: 'a'.repeat(501),
        messageId: 'msg-valid-02',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });

  describe('sendMessage - session checks', () => {
    it('should reject if session not found', async () => {
      setupMocks(null);
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_sess_01',
        senderName: 'Alice',
        content: 'Hello',
        messageId: 'msg-sess-01',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Session not found');
    });

    it('should reject if session is not live', async () => {
      setupMocks({ status: 'ended' });
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_sess_02',
        senderName: 'Alice',
        content: 'Hello',
        messageId: 'msg-sess-02',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not live');
    });

    it('should reject if chat is disabled', async () => {
      setupMocks({ settings: { chatEnabled: false, slowModeMs: 0 } });
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_sess_03',
        senderName: 'Alice',
        content: 'Hello',
        messageId: 'msg-sess-03',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
    });
  });

  describe('sendMessage - moderation hooks', () => {
    it('should run profanity filter when provided', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({
        broadcaster,
        moderation: {
          profanityFilter: (content) => ({
            filtered: true,
            content: content.replace(/bad/gi, '***'),
          }),
        },
      });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_mod_01',
        senderName: 'Alice',
        content: 'This is bad',
        messageId: 'msg-mod-01',
      });

      expect(result.success).toBe(true);
      const createCall = (liveChatMessageRepository as any).create.mock.calls;
      const lastCall = createCall[createCall.length - 1][0];
      expect(lastCall.content).toBe('This is ***');
    });

    it('should persist but not broadcast for shadow-banned users', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({
        broadcaster,
        moderation: {
          shadowBanCheck: async () => true,
        },
      });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_mod_02',
        senderName: 'Alice',
        content: 'Hello shadow',
        messageId: 'msg-mod-02',
      });

      expect(result.success).toBe(true);
      expect(broadcaster.getPublishLog()).toHaveLength(0);
      expect((liveChatMessageRepository as any).create).toHaveBeenCalled();
    });

    it('should reject if message not approved', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({
        broadcaster,
        moderation: {
          messageApproval: async () => ({ approved: false, reason: 'Not appropriate' }),
        },
      });

      const result = await service.sendMessage({
        sessionId: SESSION_A,
        senderId: 'user_mod_03',
        senderName: 'Alice',
        content: 'Hello approval',
        messageId: 'msg-mod-03',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not appropriate');
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message successfully', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({ broadcaster });
      const mockMsg = { _id: 'msg123', sessionId: SESSION_A };
      (liveChatMessageRepository as any).findMessageByIdAndSession.mockResolvedValue(mockMsg);
      (liveChatMessageRepository as any).softDelete.mockResolvedValue({ ...mockMsg, isDeleted: true });

      const result = await service.deleteMessage('msg123', SESSION_A, 'user_del_01', 'spam');
      expect(result.success).toBe(true);
      expect(broadcaster.getPublishLog()[0].event).toBe('live:chat:deleted');
    });

    it('should fail if message not found', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({ broadcaster });
      (liveChatMessageRepository as any).findMessageByIdAndSession.mockResolvedValue(null);

      const result = await service.deleteMessage('nonexistent', SESSION_A, 'user_del_02');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('pinMessage', () => {
    it('should pin a message', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({ broadcaster });
      const mockMsg = { _id: 'msg123', type: 'normal' };
      (liveChatMessageRepository as any).findMessageByIdAndSession.mockResolvedValue(mockMsg);
      (liveChatMessageRepository as any).pinMessage.mockResolvedValue({ ...mockMsg, type: 'pinned' });

      const result = await service.pinMessage('msg123', SESSION_A);
      expect(result.success).toBe(true);
      expect(broadcaster.getPublishLog()[0].event).toBe('live:chat:pinned');
    });

    it('should fail if message not found', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({ broadcaster });
      (liveChatMessageRepository as any).findMessageByIdAndSession.mockResolvedValue(null);

      const result = await service.pinMessage('nonexistent', SESSION_A);
      expect(result.success).toBe(false);
    });
  });

  describe('unpinnedMessage', () => {
    it('should unpin a message', async () => {
      setupMocks();
      const broadcaster = new MockChatBroadcaster();
      const service = new LiveChatService({ broadcaster });
      const mockMsg = { _id: 'msg123', type: 'pinned' };
      (liveChatMessageRepository as any).findMessageByIdAndSession.mockResolvedValue(mockMsg);
      (liveChatMessageRepository as any).unpinMessage.mockResolvedValue({ ...mockMsg, type: 'normal' });

      const result = await service.unpinnedMessage('msg123', SESSION_A);
      expect(result.success).toBe(true);
      expect(broadcaster.getPublishLog()[0].event).toBe('live:chat:unpinned');
    });
  });

  describe('loadHistory', () => {
    it('should return paginated messages in chronological order', async () => {
      setupMocks();
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });
      const mockMsgs = [
        { _id: '2', createdAt: new Date('2026-01-02') },
        { _id: '1', createdAt: new Date('2026-01-01') },
      ];
      (liveChatMessageRepository as any).paginateMessages.mockResolvedValue({
        messages: mockMsgs,
        hasMore: false,
      });

      const result = await service.loadHistory(SESSION_A);
      expect(result.messages).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('validateMessage', () => {
    it('should return null for valid content', () => {
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });
      expect(service.validateMessage('Hello')).toBeNull();
    });

    it('should reject empty content', () => {
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });
      expect(service.validateMessage('')).toContain('empty');
    });

    it('should reject content over 500 chars', () => {
      const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });
      expect(service.validateMessage('a'.repeat(501))).toContain('500');
    });
  });

  describe('canDeleteMessage', () => {
    let service: LiveChatService;
    beforeEach(() => {
      service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });
    });

    it('should allow host to delete any message', () => {
      expect(service.canDeleteMessage('user1', 'viewer', 'user2', true)).toBe(true);
    });

    it('should allow moderator to delete any message', () => {
      expect(service.canDeleteMessage('user1', 'moderator', 'user2', false)).toBe(true);
    });

    it('should allow admin to delete any message', () => {
      expect(service.canDeleteMessage('user1', 'admin', 'user2', false)).toBe(true);
    });

    it('should allow user to delete own message', () => {
      expect(service.canDeleteMessage('user1', 'viewer', 'user1', false)).toBe(true);
    });

    it('should not allow viewer to delete others message', () => {
      expect(service.canDeleteMessage('user1', 'viewer', 'user2', false)).toBe(false);
    });
  });

  describe('canPinMessage', () => {
    let service: LiveChatService;
    beforeEach(() => {
      service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });
    });

    it('should allow host to pin', () => {
      expect(service.canPinMessage('viewer', true)).toBe(true);
    });

    it('should allow moderator to pin', () => {
      expect(service.canPinMessage('moderator', false)).toBe(true);
    });

    it('should not allow viewer to pin', () => {
      expect(service.canPinMessage('viewer', false)).toBe(false);
    });
  });
});
