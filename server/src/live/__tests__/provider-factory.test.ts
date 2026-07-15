import { createProvider, getMediaProvider, resetMediaProvider } from '../providers/factory';
import { MockLiveMediaProvider } from '../providers/types';

jest.mock('livekit-server-sdk', () => ({
  LiveKitAPI: jest.fn().mockImplementation(() => ({
    room: {
      createRoom: jest.fn(),
      deleteRoom: jest.fn(),
      listRooms: jest.fn().mockResolvedValue([]),
      listParticipants: jest.fn().mockResolvedValue([]),
      removeParticipant: jest.fn(),
      updateParticipant: jest.fn(),
    },
  })),
  AccessToken: jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockResolvedValue('mock.jwt.token'),
  })),
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('Provider Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    resetMediaProvider();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('createProvider', () => {
    it('should create MockLiveMediaProvider when provider=mock', () => {
      const config = {
        url: '',
        apiKey: '',
        apiSecret: '',
        turnServerUrl: '',
        turnUsername: '',
        turnPassword: '',
        provider: 'mock' as const,
      };

      const provider = createProvider(config);
      expect(provider).toBeInstanceOf(MockLiveMediaProvider);
    });

    it('should create LiveKitMediaProvider when provider=livekit', () => {
      const config = {
        url: 'http://localhost:7880',
        apiKey: 'key',
        apiSecret: 'secret',
        turnServerUrl: '',
        turnUsername: '',
        turnPassword: '',
        provider: 'livekit' as const,
      };

      const provider = createProvider(config);
      expect(provider.constructor.name).toBe('LiveKitMediaProvider');
    });
  });

  describe('getMediaProvider', () => {
    it('should return mock provider when LIVE_PROVIDER=mock', () => {
      process.env.LIVE_PROVIDER = 'mock';
      const provider = getMediaProvider();
      expect(provider).toBeInstanceOf(MockLiveMediaProvider);
    });

    it('should return mock provider when LIVE_PROVIDER is unset', () => {
      delete process.env.LIVE_PROVIDER;
      const provider = getMediaProvider();
      expect(provider).toBeInstanceOf(MockLiveMediaProvider);
    });

    it('should return same instance on multiple calls (singleton)', () => {
      process.env.LIVE_PROVIDER = 'mock';
      const p1 = getMediaProvider();
      const p2 = getMediaProvider();
      expect(p1).toBe(p2);
    });
  });

  describe('resetMediaProvider', () => {
    it('should allow creating a new provider after reset', () => {
      process.env.LIVE_PROVIDER = 'mock';
      const p1 = getMediaProvider();
      resetMediaProvider();
      const p2 = getMediaProvider();
      expect(p1).not.toBe(p2);
    });
  });

  describe('MockLiveMediaProvider', () => {
    it('should implement all LiveMediaProvider methods', () => {
      const provider = new MockLiveMediaProvider();

      expect(typeof provider.createRoom).toBe('function');
      expect(typeof provider.deleteRoom).toBe('function');
      expect(typeof provider.getRoom).toBe('function');
      expect(typeof provider.generateHostToken).toBe('function');
      expect(typeof provider.generateViewerToken).toBe('function');
      expect(typeof provider.generateGuestToken).toBe('function');
      expect(typeof provider.generateModeratorToken).toBe('function');
      expect(typeof provider.listParticipants).toBe('function');
      expect(typeof provider.disconnectParticipant).toBe('function');
      expect(typeof provider.updateParticipantPermissions).toBe('function');
      expect(typeof provider.startRecording).toBe('function');
      expect(typeof provider.stopRecording).toBe('function');
      expect(typeof provider.isHealthy).toBe('function');
      expect(typeof provider.healthCheck).toBe('function');
    });

    it('should create and delete rooms', async () => {
      const provider = new MockLiveMediaProvider();

      const room = await provider.createRoom('test-room', 100);
      expect(room.roomName).toBe('test-room');

      const info = await provider.getRoom('test-room');
      expect(info.roomName).toBe('test-room');

      await provider.deleteRoom('test-room');

      await expect(provider.getRoom('test-room')).rejects.toThrow('Room not found');
    });

    it('should generate different tokens for each role', async () => {
      const provider = new MockLiveMediaProvider();

      const host = await provider.generateHostToken('room', 'user1');
      const viewer = await provider.generateViewerToken('room', 'user1');
      const guest = await provider.generateGuestToken('room', 'guest1');
      const mod = await provider.generateModeratorToken('room', 'user1');

      expect(host.token).toContain('host');
      expect(viewer.token).toContain('viewer');
      expect(guest.token).toContain('guest');
      expect(mod.token).toContain('moderator');
    });

    it('should always be healthy', async () => {
      const provider = new MockLiveMediaProvider();

      expect(await provider.isHealthy()).toBe(true);
      const health = await provider.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.provider).toBe('mock');
    });
  });
});
