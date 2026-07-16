/**
 * Live Socket Handlers Unit Tests
 *
 * Tests event handler logic with mocked Redis and service dependencies.
 */

import { Socket } from 'socket.io';
import { registerLiveHandlers, LiveHandlerDeps } from '../socket/handlers';
import { LivePresence } from '../socket/presence';
import { LiveViewerCount } from '../socket/viewerCount';
import { LiveRateLimiter } from '../socket/rateLimit';
import { PresenceEntry } from '../socket/types';

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('../repositories/LiveSessionRepository', () => ({
  liveSessionRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../repositories/LiveModerationRepository', () => ({
  liveModerationRepository: {
    isUserBanned: jest.fn().mockResolvedValue(false),
  },
}));

import { liveSessionRepository } from '../repositories/LiveSessionRepository';

function createMockSocket(overrides: Partial<Socket> = {}): Socket {
  const rooms = new Set<string>();
  const emitted: Record<string, any[]> = {};

  return {
    id: 'socket_abc123',
    rooms,
    joinedRooms: rooms,
    handshake: { auth: {} },
    user: { id: 'user123', role: 'stylist' },
    join: jest.fn((room: string) => { rooms.add(room); }),
    leave: jest.fn((room: string) => { rooms.delete(room); }),
    emit: jest.fn((event: string, ...args: any[]) => {
      emitted[event] = [...(emitted[event] || []), args];
      return true;
    }),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
    disconnect: jest.fn(),
    on: jest.fn(),
    ...overrides,
  } as unknown as Socket;
}

function createMockDeps(overrides: Partial<LiveHandlerDeps> = {}): LiveHandlerDeps {
  return {
    presence: {
      addPresence: jest.fn().mockResolvedValue({
        userId: 'user123',
        socketId: 'socket_abc123',
        role: 'viewer',
        displayName: 'Test User',
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
      } as PresenceEntry),
      removePresence: jest.fn().mockResolvedValue(null),
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
    ...overrides,
  };
}

describe('Live Socket Handlers', () => {
  let socket: Socket;
  let deps: LiveHandlerDeps;
  const SESSION_ID = 'session_abc123';
  const USER_ID = 'user123';

  beforeEach(() => {
    jest.clearAllMocks();
    socket = createMockSocket();
    (socket as any).user = { id: USER_ID, role: 'stylist' };
    deps = createMockDeps();
  });

  describe('authentication', () => {
    it('should disconnect if no userId', () => {
      const unauthSocket = createMockSocket();
      (unauthSocket as any).user = undefined;

      registerLiveHandlers(unauthSocket, deps);

      expect(unauthSocket.emit).toHaveBeenCalledWith(
        'live:error',
        expect.objectContaining({ code: 'AUTH_REQUIRED' })
      );
      expect(unauthSocket.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('live:join', () => {
    beforeEach(() => {
      (liveSessionRepository.findById as jest.Mock).mockResolvedValue({
        _id: SESSION_ID,
        hostUserId: 'host_user',
        status: 'live',
        settings: { maxViewers: 10000 },
      });
    });

    it('should join a room successfully', async () => {
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:join'
      )?.[1];

      if (joinHandler) {
        await joinHandler({ sessionId: SESSION_ID, role: 'viewer' });
      }

      expect(deps.presence.addPresence).toHaveBeenCalled();
      expect(socket.join).toHaveBeenCalledWith(`live:${SESSION_ID}`);
      expect(socket.emit).toHaveBeenCalledWith(
        'live:joined',
        expect.objectContaining({ sessionId: SESSION_ID })
      );
    });

    it('should reject invalid payload', async () => {
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:join'
      )?.[1];

      if (joinHandler) {
        await joinHandler({ sessionId: '', role: 'viewer' });
      }

      expect(socket.emit).toHaveBeenCalledWith(
        'live:error',
        expect.objectContaining({ code: 'INVALID_PAYLOAD' })
      );
    });

    it('should reject rate-limited joins', async () => {
      (deps.rateLimiter.isAllowed as jest.Mock).mockResolvedValue(false);

      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:join'
      )?.[1];

      if (joinHandler) {
        await joinHandler({ sessionId: SESSION_ID, role: 'viewer' });
      }

      expect(socket.emit).toHaveBeenCalledWith(
        'live:error',
        expect.objectContaining({ code: 'RATE_LIMITED' })
      );
    });

    it('should reject duplicate joins', async () => {
      (deps.presence.isUserInRoom as jest.Mock).mockResolvedValue(true);

      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:join'
      )?.[1];

      if (joinHandler) {
        await joinHandler({ sessionId: SESSION_ID, role: 'viewer' });
      }

      expect(socket.emit).toHaveBeenCalledWith(
        'live:error',
        expect.objectContaining({ code: 'DUPLICATE_JOIN' })
      );
    });

    it('should reject if session not found', async () => {
      (liveSessionRepository.findById as jest.Mock).mockResolvedValue(null);

      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:join'
      )?.[1];

      if (joinHandler) {
        await joinHandler({ sessionId: SESSION_ID, role: 'viewer' });
      }

      expect(socket.emit).toHaveBeenCalledWith(
        'live:error',
        expect.objectContaining({ code: 'ROOM_NOT_FOUND' })
      );
    });

    it('should reject if session not live', async () => {
      (liveSessionRepository.findById as jest.Mock).mockResolvedValue({
        _id: SESSION_ID,
        hostUserId: 'host_user',
        status: 'ended',
      });

      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:join'
      )?.[1];

      if (joinHandler) {
        await joinHandler({ sessionId: SESSION_ID, role: 'viewer' });
      }

      expect(socket.emit).toHaveBeenCalledWith(
        'live:error',
        expect.objectContaining({ code: 'ROOM_CLOSED' })
      );
    });

    it('should reject host role if not the actual host', async () => {
      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:join'
      )?.[1];

      if (joinHandler) {
        await joinHandler({ sessionId: SESSION_ID, role: 'host' });
      }

      expect(socket.emit).toHaveBeenCalledWith(
        'live:error',
        expect.objectContaining({ code: 'PERMISSION_DENIED' })
      );
    });
  });

  describe('live:leave', () => {
    it('should leave a room successfully', async () => {
      (deps.presence.removePresence as jest.Mock).mockResolvedValue({
        userId: USER_ID,
        socketId: 'socket_abc123',
        role: 'viewer',
        displayName: 'Test',
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
      });

      registerLiveHandlers(socket, deps);

      // First join the socket to a room
      (socket as any).rooms = new Set([`live:${SESSION_ID}`]);

      const leaveHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:leave'
      )?.[1];

      if (leaveHandler) {
        await leaveHandler({ sessionId: SESSION_ID });
      }

      expect(deps.presence.removePresence).toHaveBeenCalled();
      expect(socket.leave).toHaveBeenCalledWith(`live:${SESSION_ID}`);
      expect(socket.emit).toHaveBeenCalledWith('live:left', { sessionId: SESSION_ID });
    });
  });

  describe('live:heartbeat', () => {
    it('should respond with pong', async () => {
      registerLiveHandlers(socket, deps);

      const hbHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:heartbeat'
      )?.[1];

      if (hbHandler) {
        await hbHandler({ sessionId: SESSION_ID });
      }

      expect(deps.presence.updateHeartbeat).toHaveBeenCalledWith(SESSION_ID, USER_ID);
      expect(socket.emit).toHaveBeenCalledWith(
        'live:pong',
        expect.objectContaining({ sessionId: SESSION_ID })
      );
    });

    it('should ignore invalid heartbeat', async () => {
      registerLiveHandlers(socket, deps);

      const hbHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'live:heartbeat'
      )?.[1];

      if (hbHandler) {
        await hbHandler({ sessionId: '' });
      }

      expect(deps.presence.updateHeartbeat).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should clean up presence on disconnect', async () => {
      (deps.presence.removePresence as jest.Mock).mockResolvedValue({
        userId: USER_ID,
        socketId: 'socket_abc123',
        role: 'viewer',
        displayName: 'Test',
        joinedAt: Date.now(),
        lastHeartbeat: Date.now(),
      });

      registerLiveHandlers(socket, deps);

      // Simulate being in a live room
      (socket as any).rooms = new Set([`live:${SESSION_ID}`, socket.id]);

      const disconnectHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any) => c[0] === 'disconnect'
      )?.[1];

      if (disconnectHandler) {
        await disconnectHandler('transport close');
      }

      expect(deps.presence.removePresence).toHaveBeenCalledWith(SESSION_ID, 'socket_abc123');
    });
  });

  describe('event registration', () => {
    it('should register all required event handlers', () => {
      registerLiveHandlers(socket, deps);

      const eventNames = (socket.on as jest.Mock).mock.calls.map((c: any) => c[0]);

      expect(eventNames).toContain('live:join');
      expect(eventNames).toContain('live:leave');
      expect(eventNames).toContain('live:heartbeat');
      expect(eventNames).toContain('disconnect');
    });
  });
});
