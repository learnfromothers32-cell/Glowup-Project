/**
 * Live Commerce Handlers Integration Tests
 *
 * Tests the complete commerce event flow with mocked DB dependencies.
 * Covers: service pin/unpin, availability update, shelf toggle,
 * permission checks, and error handling.
 */

import { Types } from 'mongoose';
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

jest.mock('../../models/Service', () => ({
  Service: {
    findById: jest.fn(),
  },
}));

import { liveSessionRepository } from '../repositories/LiveSessionRepository';
import { Service } from '../../models/Service';

const HOST_ID = 'host_user_123';
const VIEWER_ID = 'viewer_user_456';
const SESSION_ID = new Types.ObjectId().toHexString();
const SERVICE_ID = new Types.ObjectId().toHexString();

function createMockSocket(userId: string, role: string = 'viewer'): Socket {
  const rooms = new Set<string>();
  const emitted: Record<string, any[]> = {};

  return {
    id: `socket_${userId}`,
    rooms,
    joinedRooms: rooms,
    handshake: { auth: {} },
    user: { id: userId, role },
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
  } as unknown as Socket;
}

function createMockDeps(overrides: Partial<LiveHandlerDeps> = {}): LiveHandlerDeps {
  return {
    presence: {
      addPresence: jest.fn().mockResolvedValue({
        userId: HOST_ID,
        socketId: 'socket_host',
        role: 'host',
        displayName: 'Host',
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

const mockHostSession = {
  _id: SESSION_ID,
  hostUserId: HOST_ID,
  status: 'live',
  settings: { chatEnabled: true, slowModeMs: 0 },
};

const mockService = {
  _id: SERVICE_ID,
  name: 'Blow Dry',
  price: 5000,
  duration: 30,
  category: 'Hair',
};

describe('Live Commerce Handlers (Integration)', () => {
  let deps: LiveHandlerDeps;

  beforeEach(() => {
    jest.clearAllMocks();
    deps = createMockDeps();
    (liveSessionRepository.findById as jest.Mock).mockResolvedValue(mockHostSession);
    (Service.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockService),
    });
  });

  describe('live:service:pin', () => {
    it('should pin a service when host requests', async () => {
      const socket = createMockSocket(HOST_ID, 'stylist');
      (socket as any).user = { id: HOST_ID, role: 'stylist' };

      registerLiveHandlers(socket, deps);

      const joinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:join'
      )?.[1];

      // Join as host first
      await joinHandler({ sessionId: SESSION_ID, role: 'host', displayName: 'Host' });

      const pinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:pin'
      )?.[1];

      const mockToEmit = jest.fn();
      (socket.to as jest.Mock).mockReturnValue({ emit: mockToEmit });

      await pinHandler({ sessionId: SESSION_ID, serviceId: SERVICE_ID });

      // Should emit to sender
      const pinEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:pinned'
      );
      expect(pinEmit).toBeDefined();
      expect(pinEmit![1].serviceId).toBe(SERVICE_ID);
      expect(pinEmit![1].service.name).toBe('Blow Dry');

      // Should broadcast to room
      expect(mockToEmit).toHaveBeenCalledWith('live:service:pinned', expect.objectContaining({
        sessionId: SESSION_ID,
        serviceId: SERVICE_ID,
      }));
    });

    it('should reject pin from non-host', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };

      registerLiveHandlers(socket, deps);

      const pinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:pin'
      )?.[1];

      await pinHandler({ sessionId: SESSION_ID, serviceId: SERVICE_ID });

      const errorEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorEmit).toBeDefined();
      expect(errorEmit![1].code).toBe('PERMISSION_DENIED');
    });

    it('should handle invalid payload', async () => {
      const socket = createMockSocket(HOST_ID, 'stylist');
      (socket as any).user = { id: HOST_ID, role: 'stylist' };

      registerLiveHandlers(socket, deps);

      const pinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:pin'
      )?.[1];

      await pinHandler({ sessionId: 'invalid' }); // missing serviceId

      const errorEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorEmit).toBeDefined();
      expect(errorEmit![1].code).toBe('INVALID_PAYLOAD');
    });

    it('should handle service not found', async () => {
      (Service.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const socket = createMockSocket(HOST_ID, 'stylist');
      (socket as any).user = { id: HOST_ID, role: 'stylist' };

      registerLiveHandlers(socket, deps);

      const pinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:pin'
      )?.[1];

      await pinHandler({ sessionId: SESSION_ID, serviceId: SERVICE_ID });

      const errorEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorEmit).toBeDefined();
      expect(errorEmit![1].message).toContain('not found');
    });
  });

  describe('live:service:unpin', () => {
    it('should unpin a service when host requests', async () => {
      const socket = createMockSocket(HOST_ID, 'stylist');
      (socket as any).user = { id: HOST_ID, role: 'stylist' };

      registerLiveHandlers(socket, deps);

      const unpinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:unpin'
      )?.[1];

      const mockToEmit = jest.fn();
      (socket.to as jest.Mock).mockReturnValue({ emit: mockToEmit });

      await unpinHandler({ sessionId: SESSION_ID });

      const unpinnedEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:unpinned'
      );
      expect(unpinnedEmit).toBeDefined();
      expect(mockToEmit).toHaveBeenCalledWith('live:service:unpinned', { sessionId: SESSION_ID });
    });

    it('should reject unpin from non-host', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };

      registerLiveHandlers(socket, deps);

      const unpinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:unpin'
      )?.[1];

      await unpinHandler({ sessionId: SESSION_ID });

      const errorEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorEmit).toBeDefined();
      expect(errorEmit![1].code).toBe('PERMISSION_DENIED');
    });
  });

  describe('live:availability:update', () => {
    it('should update availability when host requests', async () => {
      const socket = createMockSocket(HOST_ID, 'stylist');
      (socket as any).user = { id: HOST_ID, role: 'stylist' };

      registerLiveHandlers(socket, deps);

      const availHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:availability:update'
      )?.[1];

      const mockToEmit = jest.fn();
      (socket.to as jest.Mock).mockReturnValue({ emit: mockToEmit });

      await availHandler({ sessionId: SESSION_ID, availability: 'on-break' });

      const updatedEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:availability:updated'
      );
      expect(updatedEmit).toBeDefined();
      expect(updatedEmit![1].availability).toBe('on-break');
      expect(mockToEmit).toHaveBeenCalledWith('live:availability:updated', expect.objectContaining({
        availability: 'on-break',
      }));
    });

    it('should reject invalid availability value', async () => {
      const socket = createMockSocket(HOST_ID, 'stylist');
      (socket as any).user = { id: HOST_ID, role: 'stylist' };

      registerLiveHandlers(socket, deps);

      const availHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:availability:update'
      )?.[1];

      await availHandler({ sessionId: SESSION_ID, availability: 'invalid' });

      const errorEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorEmit).toBeDefined();
      expect(errorEmit![1].code).toBe('INVALID_PAYLOAD');
    });

    it('should reject availability update from non-host', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };

      registerLiveHandlers(socket, deps);

      const availHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:availability:update'
      )?.[1];

      await availHandler({ sessionId: SESSION_ID, availability: 'busy' });

      const errorEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorEmit).toBeDefined();
      expect(errorEmit![1].code).toBe('PERMISSION_DENIED');
    });
  });

  describe('live:shelf:toggle', () => {
    it('should toggle shelf visibility when host requests', async () => {
      const socket = createMockSocket(HOST_ID, 'stylist');
      (socket as any).user = { id: HOST_ID, role: 'stylist' };

      registerLiveHandlers(socket, deps);

      const shelfHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:shelf:toggle'
      )?.[1];

      const mockToEmit = jest.fn();
      (socket.to as jest.Mock).mockReturnValue({ emit: mockToEmit });

      await shelfHandler({ sessionId: SESSION_ID, visible: true });

      const updatedEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:shelf:updated'
      );
      expect(updatedEmit).toBeDefined();
      expect(updatedEmit![1].visible).toBe(true);
      expect(mockToEmit).toHaveBeenCalledWith('live:shelf:updated', expect.objectContaining({
        visible: true,
      }));
    });

    it('should reject shelf toggle from non-host', async () => {
      const socket = createMockSocket(VIEWER_ID, 'viewer');
      (socket as any).user = { id: VIEWER_ID, role: 'viewer' };

      registerLiveHandlers(socket, deps);

      const shelfHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:shelf:toggle'
      )?.[1];

      await shelfHandler({ sessionId: SESSION_ID, visible: true });

      const errorEmit = (socket.emit as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:error'
      );
      expect(errorEmit).toBeDefined();
      expect(errorEmit![1].code).toBe('PERMISSION_DENIED');
    });
  });

  describe('full commerce lifecycle', () => {
    it('should handle pin → update availability → toggle shelf → unpin sequence', async () => {
      const socket = createMockSocket(HOST_ID, 'stylist');
      (socket as any).user = { id: HOST_ID, role: 'stylist' };

      registerLiveHandlers(socket, deps);

      const mockToEmit = jest.fn();
      (socket.to as jest.Mock).mockReturnValue({ emit: mockToEmit });

      const pinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:pin'
      )?.[1];
      const availHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:availability:update'
      )?.[1];
      const shelfHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:shelf:toggle'
      )?.[1];
      const unpinHandler = (socket.on as jest.Mock).mock.calls.find(
        (c: any[]) => c[0] === 'live:service:unpin'
      )?.[1];

      // 1. Pin service
      await pinHandler({ sessionId: SESSION_ID, serviceId: SERVICE_ID });
      expect((socket.emit as jest.Mock).mock.calls.filter((c: any[]) => c[0] === 'live:service:pinned').length).toBe(1);

      // 2. Update availability
      await availHandler({ sessionId: SESSION_ID, availability: 'on-break' });
      expect((socket.emit as jest.Mock).mock.calls.filter((c: any[]) => c[0] === 'live:availability:updated').length).toBe(1);

      // 3. Toggle shelf
      await shelfHandler({ sessionId: SESSION_ID, visible: true });
      expect((socket.emit as jest.Mock).mock.calls.filter((c: any[]) => c[0] === 'live:shelf:updated').length).toBe(1);

      // 4. Unpin service
      await unpinHandler({ sessionId: SESSION_ID });
      expect((socket.emit as jest.Mock).mock.calls.filter((c: any[]) => c[0] === 'live:service:unpinned').length).toBe(1);

      // All broadcasts should have been made
      expect(mockToEmit).toHaveBeenCalledTimes(4);
    });
  });
});
