/**
 * Live Session Lifecycle Integration Tests
 *
 * Tests the complete session flow from host start to end,
 * covering viewer join/leave, reconnection, and error scenarios.
 */

import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { registerLiveHandlers, LiveHandlerDeps } from '../socket/handlers';
import { LivePresence } from '../socket/presence';
import { LiveViewerCount } from '../socket/viewerCount';
import { LiveRateLimiter } from '../socket/rateLimit';
import { PresenceEntry } from '../socket/types';
import { createChatEventConfigs } from '../socket/chatHandlers';
import { MockChatBroadcaster } from '../socket/broadcast/MockChatBroadcaster';
import { LiveChatService } from '../services/LiveChatService';

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../repositories/LiveSessionRepository', () => ({
  liveSessionRepository: {
    findById: jest.fn(),
    incrementChatMessageCount: jest.fn(),
  },
}));

jest.mock('../repositories/LiveChatMessageRepository', () => ({
  liveChatMessageRepository: {
    findByMessageId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((input) =>
      Promise.resolve({
        _id: new Types.ObjectId().toHexString(),
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

import { liveSessionRepository } from '../repositories/LiveSessionRepository';

const HOST_ID = 'host_user_123';
const VIEWER_ID = 'viewer_user_456';
const VIEWER2_ID = 'viewer_user_789';
const SESSION_ID = new Types.ObjectId().toHexString();

function createMockSocket(userId: string, role: string = 'viewer'): Socket {
  const rooms = new Set<string>();
  return {
    id: `socket_${userId}`,
    rooms,
    joinedRooms: rooms,
    handshake: { auth: {} },
    user: { id: userId, role },
    join: jest.fn((room: string) => { rooms.add(room); }),
    leave: jest.fn((room: string) => { rooms.delete(room); }),
    emit: jest.fn(),
    to: jest.fn(() => ({ emit: jest.fn() })),
    disconnect: jest.fn(),
    on: jest.fn(),
  } as unknown as Socket;
}

function createMockDeps(): LiveHandlerDeps {
  return {
    presence: {
      addPresence: jest.fn().mockImplementation((_sid, _sid2, userId, role, name) =>
        Promise.resolve({
          userId,
          socketId: `socket_${userId}`,
          role,
          displayName: name || userId,
          joinedAt: Date.now(),
          lastHeartbeat: Date.now(),
        } as PresenceEntry)
      ),
      removePresence: jest.fn().mockImplementation((_sessionId, socketId) => {
        // Extract userId from socketId pattern "socket_{userId}"
        const userId = socketId.replace('socket_', '');
        return Promise.resolve({
          userId,
          socketId,
          role: userId === HOST_ID ? 'host' : 'viewer',
          displayName: userId,
          joinedAt: Date.now(),
          lastHeartbeat: Date.now(),
        } as PresenceEntry);
      }),
      getPresence: jest.fn().mockResolvedValue([]),
      getPresenceCount: jest.fn().mockResolvedValue(0),
      updateHeartbeat: jest.fn().mockResolvedValue(undefined),
      isUserInRoom: jest.fn().mockResolvedValue(false),
      getHost: jest.fn().mockResolvedValue(null),
      cleanStale: jest.fn().mockResolvedValue([]),
    } as unknown as LivePresence,
    viewerCount: {
      increment: jest.fn().mockResolvedValue(1),
      decrement: jest.fn().mockResolvedValue(0),
      getCount: jest.fn().mockResolvedValue(0),
      getPeak: jest.fn().mockResolvedValue(1),
      reset: jest.fn().mockResolvedValue(undefined),
    } as unknown as LiveViewerCount,
    rateLimiter: {
      isAllowed: jest.fn().mockResolvedValue(true),
    } as unknown as LiveRateLimiter,
    sessionService: {} as any,
  };
}

const mockLiveSession = {
  _id: SESSION_ID,
  hostUserId: HOST_ID,
  status: 'live',
  settings: { chatEnabled: true, slowModeMs: 0 },
};

describe('Live Session Lifecycle (Integration)', () => {
  let deps: LiveHandlerDeps;

  beforeEach(() => {
    jest.clearAllMocks();
    deps = createMockDeps();
    (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockLiveSession);
  });

  describe('complete session lifecycle', () => {
    it('should handle host join → viewer join → viewer leave → host leave', async () => {
      // === Phase 1: Host joins ===
      const hostSocket = createMockSocket(HOST_ID, 'stylist');
      (hostSocket as any).user = { id: HOST_ID, role: 'stylist' };
      registerLiveHandlers(hostSocket, deps);

      const hostJoinHandler = (hostSocket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await hostJoinHandler({ sessionId: SESSION_ID, role: 'host', displayName: 'Stylist' });

      const hostJoined = (hostSocket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:joined'
      );
      expect(hostJoined).toBeDefined();
      expect(hostJoined![1].sessionId).toBe(SESSION_ID);

      // === Phase 2: Viewer joins ===
      const viewerSocket = createMockSocket(VIEWER_ID, 'viewer');
      (viewerSocket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(viewerSocket, deps);

      const viewerJoinHandler = (viewerSocket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await viewerJoinHandler({ sessionId: SESSION_ID, role: 'viewer', displayName: 'Viewer' });

      const viewerJoined = (viewerSocket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:joined'
      );
      expect(viewerJoined).toBeDefined();
      expect(deps.viewerCount.increment).toHaveBeenCalled();

      // === Phase 3: Viewer leaves ===
      const viewerLeaveHandler = (viewerSocket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:leave'
      )?.[1];

      await viewerLeaveHandler({ sessionId: SESSION_ID });

      const viewerLeft = (viewerSocket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:left'
      );
      expect(viewerLeft).toBeDefined();
      expect(deps.viewerCount.decrement).toHaveBeenCalled();
      expect(deps.presence.removePresence).toHaveBeenCalled();

      // === Phase 4: Host leaves ===
      const hostLeaveHandler = (hostSocket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:leave'
      )?.[1];

      await hostLeaveHandler({ sessionId: SESSION_ID });

      const hostLeft = (hostSocket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:left'
      );
      expect(hostLeft).toBeDefined();
    });

    it('should handle multiple viewers joining and leaving', async () => {
      const viewers = [VIEWER_ID, VIEWER2_ID, 'viewer_3'];
      const viewerSockets: Socket[] = [];

      for (const viewerId of viewers) {
        const viewerSocket = createMockSocket(viewerId, 'viewer');
        (viewerSocket as any).user = { id: viewerId, role: 'viewer' };
        registerLiveHandlers(viewerSocket, deps);
        viewerSockets.push(viewerSocket);

        const joinHandler = (viewerSocket.on as jest.Mock).mock.calls.find(
          (c: any[]) => c[0] === 'live:join'
        )?.[1];

        await joinHandler({ sessionId: SESSION_ID, role: 'viewer', displayName: `Viewer ${viewerId}` });

        const joined = (viewerSocket.emit as jest.Mock).mock.calls.find(
          (c: any[]) => c[0] === 'live:joined'
        );
        expect(joined).toBeDefined();
      }

      // All viewers should have joined
      expect(deps.viewerCount.increment).toHaveBeenCalledTimes(3);

      // Leave one viewer
      const leaveHandler = (viewerSockets[0].on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:leave'
      )?.[1];

      await leaveHandler({ sessionId: SESSION_ID });

      expect(deps.viewerCount.decrement).toHaveBeenCalled();
      expect(deps.presence.removePresence).toHaveBeenCalled();
    });

    it('should handle disconnect cleanup', async () => {
      const viewerSocket = createMockSocket(VIEWER_ID, 'viewer');
      (viewerSocket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(viewerSocket, deps);

      // First join (this adds the socket to the room via socket.join)
      const joinHandler = (viewerSocket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await joinHandler({ sessionId: SESSION_ID, role: 'viewer', displayName: 'Viewer' });

      // After join, socket.rooms should contain `live:${SESSION_ID}`
      expect(viewerSocket.rooms.has(`live:${SESSION_ID}`)).toBe(true);

      // Now disconnect — the handler iterates socket.rooms
      const disconnectHandler = (viewerSocket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'disconnect'
      )?.[1];

      await disconnectHandler('transport close');

      // Should clean up presence
      expect(deps.presence.removePresence).toHaveBeenCalledWith(SESSION_ID, viewerSocket.id);
    });
  });

  describe('error scenarios', () => {
    it('should reject join to non-existent session', async () => {
      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(null);

      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await joinHandler({ sessionId: SESSION_ID, role: 'viewer', displayName: 'Viewer' });

      const error = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(error).toBeDefined();
      expect(error![1].code).toBe('ROOM_NOT_FOUND');
    });

    it('should reject join to ended session', async () => {
      (liveSessionRepository.findById as jest.Mock).mockResolvedValue({
        ...mockLiveSession,
        status: 'ended',
      });

      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await joinHandler({ sessionId: SESSION_ID, role: 'viewer', displayName: 'Viewer' });

      const error = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(error).toBeDefined();
      expect(error![1].code).toBe('ROOM_CLOSED');
    });

    it('should reject viewer joining as host', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await joinHandler({ sessionId: SESSION_ID, role: 'host', displayName: 'Fake Host' });

      const error = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(error).toBeDefined();
      expect(error![1].code).toBe('PERMISSION_DENIED');
    });

    it('should handle rate limiting', async () => {
      (deps.rateLimiter.isAllowed as jest.Mock).mockResolvedValue(false);

      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await joinHandler({ sessionId: SESSION_ID, role: 'viewer', displayName: 'Viewer' });

      const error = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(error).toBeDefined();
      expect(error![1].code).toBe('RATE_LIMITED');
    });

    it('should handle duplicate join attempt', async () => {
      (deps.presence.isUserInRoom as jest.Mock).mockResolvedValue(true);

      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await joinHandler({ sessionId: SESSION_ID, role: 'viewer', displayName: 'Viewer' });

      const error = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(error).toBeDefined();
      expect(error![1].code).toBe('DUPLICATE_JOIN');
    });

    it('should disconnect socket with no userId', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = undefined;

      registerLiveHandlers(socket, deps);

      expect(socket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should handle invalid join payload', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      await joinHandler({ sessionId: '', role: 'bad_role' });

      const error = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(error).toBeDefined();
      expect(error![1].code).toBe('INVALID_PAYLOAD');
    });
  });

  describe('heartbeat handling', () => {
    it('should respond with pong on valid heartbeat', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(socket, deps);

      const heartbeatHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:heartbeat'
      )?.[1];

      await heartbeatHandler({ sessionId: SESSION_ID });

      const pong = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:pong'
      );
      expect(pong).toBeDefined();
      expect(pong![1].sessionId).toBe(SESSION_ID);
      expect(deps.presence.updateHeartbeat).toHaveBeenCalledWith(SESSION_ID, VIEWER_ID);
    });

    it('should silently ignore invalid heartbeat', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };
      registerLiveHandlers(socket, deps);

      const heartbeatHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:heartbeat'
      )?.[1];

      await heartbeatHandler({}); // invalid payload

      const pong = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:pong'
      );
      expect(pong).toBeUndefined();
    });
  });

  describe('chat integration', () => {
    it('should process chat message within live session', async () => {
      const broadcaster = new MockChatBroadcaster();
      const chatService = new LiveChatService({ broadcaster });

      const configs = createChatEventConfigs({ chatService, rateLimiter: null as any });
      const sendConfig = configs.find((c) => c.event === 'live:chat:send');

      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).rooms = new Set([`live:${SESSION_ID}`]);

      const context = {
        payload: {
          sessionId: SESSION_ID,
          content: 'Hello everyone!',
          messageId: 'msg-uuid-test-1',
        },
        meta: {},
      };

      await sendConfig!.handler(socket, context, context.payload);

      const ack = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:chat:ack'
      );
      expect(ack).toBeDefined();
      expect(ack![1].success).toBe(true);
      expect(ack![1].messageId).toBe('msg-uuid-test-1');
    });
  });
});
