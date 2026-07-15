import { LiveChatService } from '../services/LiveChatService';
import { MockChatBroadcaster } from '../socket/broadcast/MockChatBroadcaster';

const SESSION_ID = 'spam_test_session';

const mockSession = {
  _id: SESSION_ID,
  status: 'live',
  settings: { chatEnabled: true, slowModeMs: 0 },
};

jest.mock('../repositories/LiveChatMessageRepository', () => ({
  liveChatMessageRepository: {
    findByMessageId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({
      _id: 'created-msg',
      sequenceNumber: 1,
      createdAt: new Date(),
    }),
    getNextSequenceNumber: jest.fn().mockResolvedValue(1),
    findMessageByIdAndSession: jest.fn().mockResolvedValue(null),
    softDelete: jest.fn().mockResolvedValue(null),
    pinMessage: jest.fn().mockResolvedValue(null),
    unpinMessage: jest.fn().mockResolvedValue(null),
    findRecentMessages: jest.fn().mockResolvedValue([]),
    paginateMessages: jest.fn().mockResolvedValue({ messages: [], hasMore: false }),
    countMessages: jest.fn().mockResolvedValue(0),
  },
}));

jest.mock('../repositories/LiveSessionRepository', () => ({
  liveSessionRepository: {
    findById: jest.fn().mockResolvedValue(null),
    incrementChatMessageCount: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { liveChatMessageRepository } from '../repositories/LiveChatMessageRepository';
import { liveSessionRepository } from '../repositories/LiveSessionRepository';

function resetAll() {
  const repo = liveChatMessageRepository as any;
  repo.findByMessageId.mockReset();
  repo.findByMessageId.mockResolvedValue(null);
  repo.create.mockReset();
  repo.create.mockImplementation((input: any) =>
    Promise.resolve({
      _id: 'created-msg',
      ...input,
      sequenceNumber: input.sequenceNumber || 1,
      createdAt: new Date(),
    })
  );
  repo.getNextSequenceNumber.mockReset();
  repo.getNextSequenceNumber.mockResolvedValue(1);

  const sessionRepo = liveSessionRepository as any;
  sessionRepo.findById.mockReset();
  sessionRepo.findById.mockResolvedValue(mockSession);
  sessionRepo.incrementChatMessageCount.mockReset();
}

describe('Chat Spam Protection', () => {
  beforeEach(() => {
    resetAll();
  });

  it('should allow normal messages', async () => {
    const broadcaster = new MockChatBroadcaster();
    const service = new LiveChatService({ broadcaster });
    const result = await service.sendMessage({
      sessionId: SESSION_ID,
      senderId: 'spam_user_01',
      senderName: 'Alice',
      content: 'Hello!',
      messageId: 'spam_msg_01',
    });
    expect(result.success).toBe(true);
  });

  it('should reject duplicate messages within cooldown window', async () => {
    const broadcaster = new MockChatBroadcaster();
    const service = new LiveChatService({ broadcaster });
    await service.sendMessage({
      sessionId: SESSION_ID,
      senderId: 'spam_user_02',
      senderName: 'Alice',
      content: 'Same message',
      messageId: 'spam_msg_02',
    });

    const result = await service.sendMessage({
      sessionId: SESSION_ID,
      senderId: 'spam_user_02',
      senderName: 'Alice',
      content: 'Same message',
      messageId: 'spam_msg_03',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Duplicate');
  });

  it('should rate-limit after max messages', async () => {
    const broadcaster = new MockChatBroadcaster();
    const service = new LiveChatService({ broadcaster });
    for (let i = 0; i < 5; i++) {
      await service.sendMessage({
        sessionId: SESSION_ID,
        senderId: 'spam_user_03',
        senderName: 'Alice',
        content: `Unique message ${i} alpha`,
        messageId: `spam_msg_ratelimit_${i}`,
      });
    }

    const result = await service.sendMessage({
      sessionId: SESSION_ID,
      senderId: 'spam_user_03',
      senderName: 'Alice',
      content: 'Message 5 unique beta',
      messageId: 'spam_msg_ratelimit_6',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('too many');
  });

  it('should track spam per-user per-session (different users allowed)', async () => {
    const broadcaster = new MockChatBroadcaster();
    const service = new LiveChatService({ broadcaster });
    for (let i = 0; i < 5; i++) {
      await service.sendMessage({
        sessionId: SESSION_ID,
        senderId: 'spam_user_04',
        senderName: 'Alice',
        content: `Alice msg ${i} unique`,
        messageId: `spam_msg_user_${i}`,
      });
    }

    const result = await service.sendMessage({
      sessionId: SESSION_ID,
      senderId: 'spam_user_05',
      senderName: 'Bob',
      content: 'Bob msg 1 totally unique',
      messageId: 'spam_msg_bob_01',
    });

    expect(result.success).toBe(true);
  });
});

describe('Chat Idempotency', () => {
  beforeEach(() => {
    resetAll();
  });

  it('should return existing message when messageId already exists', async () => {
    const broadcaster = new MockChatBroadcaster();
    const service = new LiveChatService({ broadcaster });
    const existing = {
      _id: 'existing-id',
      messageId: 'idempotent-msg',
      content: 'Original',
      sequenceNumber: 42,
    };
    (liveChatMessageRepository as any).findByMessageId.mockResolvedValue(existing);

    const result = await service.sendMessage({
      sessionId: SESSION_ID,
      senderId: 'idemp_user_01',
      senderName: 'Alice',
      content: 'Duplicate attempt',
      messageId: 'idempotent-msg',
    });

    expect(result.success).toBe(true);
    expect(result.message).toEqual(existing);
    expect((liveChatMessageRepository as any).create).not.toHaveBeenCalled();
    expect(broadcaster.getPublishLog()).toHaveLength(0);
  });
});

describe('Chat Message Ordering', () => {
  beforeEach(() => {
    resetAll();
  });

  it('should assign sequential sequenceNumbers', async () => {
    const broadcaster = new MockChatBroadcaster();
    const service = new LiveChatService({ broadcaster });
    (liveChatMessageRepository as any).getNextSequenceNumber
      .mockReset()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3);

    for (let i = 0; i < 3; i++) {
      const result = await service.sendMessage({
        sessionId: SESSION_ID,
        senderId: `order_user_${i}`,
        senderName: 'Alice',
        content: `Order message ${i}`,
        messageId: `order_msg_${i}`,
      });
      expect(result.success).toBe(true);
    }

    const createCalls = (liveChatMessageRepository as any).create.mock.calls;
    expect(createCalls).toHaveLength(3);
    const seqNums = createCalls.map((call: any[]) => call[0].sequenceNumber);
    expect(seqNums).toEqual([1, 2, 3]);
  });
});

describe('Chat Slow Mode', () => {
  beforeEach(() => {
    resetAll();
  });

  it('should always allow host to bypass slow mode', async () => {
    (liveSessionRepository as any).findById.mockResolvedValue({
      ...mockSession,
      settings: { chatEnabled: true, slowModeMs: 30000 },
    });
    const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

    const result = await service.enforceSlowMode('host123', 'host', SESSION_ID);
    expect(result.allowed).toBe(true);
  });

  it('should always allow moderator to bypass slow mode', async () => {
    (liveSessionRepository as any).findById.mockResolvedValue({
      ...mockSession,
      settings: { chatEnabled: true, slowModeMs: 30000 },
    });
    const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

    const result = await service.enforceSlowMode('mod123', 'moderator', SESSION_ID);
    expect(result.allowed).toBe(true);
  });

  it('should always allow admin to bypass slow mode', async () => {
    (liveSessionRepository as any).findById.mockResolvedValue({
      ...mockSession,
      settings: { chatEnabled: true, slowModeMs: 30000 },
    });
    const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

    const result = await service.enforceSlowMode('admin123', 'admin', SESSION_ID);
    expect(result.allowed).toBe(true);
  });

  it('should allow viewer when slow mode is disabled', async () => {
    (liveSessionRepository as any).findById.mockResolvedValue({
      ...mockSession,
      settings: { chatEnabled: true, slowModeMs: 0 },
    });
    const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

    const result = await service.enforceSlowMode('viewer_slow_01', 'viewer', SESSION_ID);
    expect(result.allowed).toBe(true);
  });

  it('should allow viewer with no previous messages', async () => {
    (liveSessionRepository as any).findById.mockResolvedValue({
      ...mockSession,
      settings: { chatEnabled: true, slowModeMs: 5000 },
    });
    const service = new LiveChatService({ broadcaster: new MockChatBroadcaster() });

    const result = await service.enforceSlowMode('fresh_viewer_01', 'viewer', SESSION_ID);
    expect(result.allowed).toBe(true);
  });
});
