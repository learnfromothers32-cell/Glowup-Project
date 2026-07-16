import { Types } from 'mongoose';
import { createChatEventConfigs } from '../socket/chatHandlers';
import { MockChatBroadcaster } from '../socket/broadcast/MockChatBroadcaster';
import { LiveChatService } from '../services/LiveChatService';
import { MiddlewareContext } from '../socket/middleware/types';

jest.mock('../repositories/LiveChatMessageRepository', () => ({
  liveChatMessageRepository: {
    findByMessageId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((input) =>
      Promise.resolve({
        _id: new (require('mongoose').Types.ObjectId)().toHexString(),
        ...input,
        sequenceNumber: 1,
        createdAt: new Date(),
      })
    ),
    findMessageByIdAndSession: jest.fn(),
    softDelete: jest.fn(),
    pinMessage: jest.fn(),
    unpinMessage: jest.fn(),
    findRecentMessages: jest.fn().mockResolvedValue([]),
    paginateMessages: jest.fn().mockResolvedValue({ messages: [], hasMore: false }),
    getNextSequenceNumber: jest.fn().mockResolvedValue(1),
    countMessages: jest.fn().mockResolvedValue(0),
  },
}));

jest.mock('../repositories/LiveSessionRepository', () => ({
  liveSessionRepository: {
    findById: jest.fn(),
    incrementChatMessageCount: jest.fn(),
  },
}));

jest.mock('../repositories/LiveModerationRepository', () => ({
  liveModerationRepository: {
    isUserMuted: jest.fn().mockResolvedValue(false),
    isUserBanned: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { liveSessionRepository } from '../repositories/LiveSessionRepository';

const SESSION_ID = new Types.ObjectId().toHexString();

const mockSession = {
  _id: SESSION_ID,
  hostUserId: 'host123',
  status: 'live',
  settings: { chatEnabled: true, slowModeMs: 0 },
};

function createMockSocket(overrides?: Record<string, unknown>) {
  const emitted: Array<{ event: string; data: unknown }> = [];
  return {
    emit: jest.fn((event: string, data: unknown) => { emitted.push({ event, data }); }),
    rooms: new Set([`live:${SESSION_ID}`]),
    user: { id: 'user123', role: 'viewer', name: 'TestUser' },
    ...overrides,
    __emitted: emitted,
  } as any;
}

function createContext(payload?: unknown): MiddlewareContext {
  return { payload, meta: {} };
}

describe('Chat Handlers', () => {
  let broadcaster: MockChatBroadcaster;
  let chatService: LiveChatService;

  beforeEach(() => {
    jest.clearAllMocks();
    broadcaster = new MockChatBroadcaster();
    chatService = new LiveChatService({ broadcaster });
    (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('live:chat:send', () => {
    it('should process valid chat send and emit ack', async () => {
      const configs = createChatEventConfigs({ chatService, rateLimiter: null as any });
      const sendConfig = configs.find((c) => c.event === 'live:chat:send');

      const socket = createMockSocket();
      const context = createContext({
        sessionId: SESSION_ID,
        content: 'Hello!',
        messageId: 'msg-uuid-1',
      });

      await sendConfig!.handler(socket, context, context.payload);

      const ackCall = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'live:chat:ack'
      );
      expect(ackCall).toBeDefined();
      expect(ackCall![1].success).toBe(true);
      expect(ackCall![1].messageId).toBe('msg-uuid-1');
    });

    it('should emit error if not in room', async () => {
      const configs = createChatEventConfigs({ chatService, rateLimiter: null as any });
      const sendConfig = configs.find((c) => c.event === 'live:chat:send');

      const socket = createMockSocket({ rooms: new Set() });
      const context = createContext({
        sessionId: SESSION_ID,
        content: 'Hello!',
        messageId: 'msg-uuid-2',
      });

      await sendConfig!.handler(socket, context, context.payload);

      const errorCall = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorCall).toBeDefined();
      expect(errorCall![1].code).toBe('ROOM_NOT_FOUND');
    });
  });

  describe('live:chat:history', () => {
    it('should return paginated history', async () => {
      const configs = createChatEventConfigs({ chatService, rateLimiter: null as any });
      const historyConfig = configs.find((c) => c.event === 'live:chat:history');

      const socket = createMockSocket();
      const context = createContext({
        sessionId: SESSION_ID,
        limit: 25,
      });

      await historyConfig!.handler(socket, context, context.payload);

      const historyCall = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'live:chat:history'
      );
      expect(historyCall).toBeDefined();
      expect(historyCall![1].sessionId).toBe(SESSION_ID);
      expect(historyCall![1].messages).toEqual([]);
      expect(historyCall![1].hasMore).toBe(false);
    });
  });

  describe('live:chat:delete', () => {
    it('should emit error when viewer tries to delete others message', async () => {
      const configs = createChatEventConfigs({ chatService, rateLimiter: null as any });
      const deleteConfig = configs.find((c) => c.event === 'live:chat:delete');

      const socket = createMockSocket({
        user: { id: 'viewer1', role: 'viewer', name: 'Viewer1' },
      });
      const context = createContext({
        messageId: 'msg123',
        sessionId: SESSION_ID,
      });

      await deleteConfig!.handler(socket, context, context.payload);

      const errorCall = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorCall).toBeDefined();
      expect(errorCall![1].code).toBe('PERMISSION_DENIED');
    });

    it('should allow host to delete', async () => {
      const { liveChatMessageRepository } = require('../repositories/LiveChatMessageRepository');
      const mockMsg = { _id: 'msg123', sessionId: SESSION_ID };
      liveChatMessageRepository.findMessageByIdAndSession.mockResolvedValue(mockMsg);
      liveChatMessageRepository.softDelete.mockResolvedValue({ ...mockMsg, isDeleted: true });

      const configs = createChatEventConfigs({ chatService, rateLimiter: null as any });
      const deleteConfig = configs.find((c) => c.event === 'live:chat:delete');

      const socket = createMockSocket({
        user: { id: 'host123', role: 'host', name: 'Host' },
      });
      const context = createContext({
        messageId: 'msg123',
        sessionId: SESSION_ID,
      });

      await deleteConfig!.handler(socket, context, context.payload);

      const deletedCall = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'live:chat:deleted'
      );
      expect(deletedCall).toBeDefined();
      expect(deletedCall![1].success).toBe(true);
    });
  });

  describe('live:chat:pin', () => {
    it('should emit error when viewer tries to pin', async () => {
      const configs = createChatEventConfigs({ chatService, rateLimiter: null as any });
      const pinConfig = configs.find((c) => c.event === 'live:chat:pin');

      const socket = createMockSocket();
      const context = createContext({
        messageId: 'msg123',
        sessionId: SESSION_ID,
      });

      await pinConfig!.handler(socket, context, context.payload);

      const errorCall = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorCall).toBeDefined();
      expect(errorCall![1].code).toBe('PERMISSION_DENIED');
    });

    it('should allow host to pin', async () => {
      const { liveChatMessageRepository } = require('../repositories/LiveChatMessageRepository');
      const mockMsg = { _id: 'msg123', type: 'normal' };
      liveChatMessageRepository.findMessageByIdAndSession.mockResolvedValue(mockMsg);
      liveChatMessageRepository.pinMessage.mockResolvedValue({ ...mockMsg, type: 'pinned' });

      const configs = createChatEventConfigs({ chatService, rateLimiter: null as any });
      const pinConfig = configs.find((c) => c.event === 'live:chat:pin');

      const socket = createMockSocket({
        user: { id: 'host123', role: 'host', name: 'Host' },
      });
      const context = createContext({
        messageId: 'msg123',
        sessionId: SESSION_ID,
      });

      await pinConfig!.handler(socket, context, context.payload);

      const pinnedCall = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'live:chat:pinned'
      );
      expect(pinnedCall).toBeDefined();
      expect(pinnedCall![1].success).toBe(true);
    });
  });
});
