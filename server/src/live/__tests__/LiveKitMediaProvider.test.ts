import { LiveKitMediaProvider, LiveKitProviderError } from '../providers/LiveKitMediaProvider';

jest.mock('livekit-server-sdk', () => {
  const mockCreateRoom = jest.fn();
  const mockDeleteRoom = jest.fn();
  const mockListRooms = jest.fn();
  const mockListParticipants = jest.fn();
  const mockRemoveParticipant = jest.fn();
  const mockUpdateParticipant = jest.fn();

  return {
    LiveKitAPI: jest.fn().mockImplementation(() => ({
      room: {
        createRoom: mockCreateRoom,
        deleteRoom: mockDeleteRoom,
        listRooms: mockListRooms,
        listParticipants: mockListParticipants,
        removeParticipant: mockRemoveParticipant,
        updateParticipant: mockUpdateParticipant,
      },
    })),
    AccessToken: jest.fn().mockImplementation(() => ({
      addGrant: jest.fn(),
      toJwt: jest.fn().mockResolvedValue('mock.jwt.token'),
    })),
  };
});

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { LiveKitAPI, AccessToken } from 'livekit-server-sdk';

const TEST_CONFIG = {
  url: 'http://localhost:7880',
  apiKey: 'testApiKey',
  apiSecret: 'testApiSecret',
  turnServerUrl: '',
  turnUsername: '',
  turnPassword: '',
  provider: 'livekit' as const,
};

describe('LiveKitMediaProvider', () => {
  let provider: LiveKitMediaProvider;
  let mockApi: any;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new LiveKitMediaProvider(TEST_CONFIG);
    mockApi = (LiveKitAPI as jest.Mock).mock.results[0].value;
  });

  describe('createRoom', () => {
    it('should create a room and return result', async () => {
      mockApi.room.createRoom.mockResolvedValue({
        name: 'test-room',
        sid: 'room_sid_123',
        maxParticipants: 100,
      });

      const result = await provider.createRoom('test-room', 100);

      expect(result.roomName).toBe('test-room');
      expect(result.maxParticipants).toBe(100);
      expect(mockApi.room.createRoom).toHaveBeenCalledWith({
        name: 'test-room',
        emptyTimeout: 300,
        maxParticipants: 100,
      });
    });

    it('should throw LiveKitProviderError on failure', async () => {
      mockApi.room.createRoom.mockRejectedValue(new Error('Connection refused'));

      await expect(provider.createRoom('test-room', 100)).rejects.toThrow(LiveKitProviderError);
    });

    it('should wrap room already exists as 409', async () => {
      mockApi.room.createRoom.mockRejectedValue(new Error('room already exists'));

      try {
        await provider.createRoom('test-room', 100);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LiveKitProviderError);
        expect((error as LiveKitProviderError).code).toBe('ROOM_ALREADY_EXISTS');
        expect((error as LiveKitProviderError).statusCode).toBe(409);
      }
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room', async () => {
      mockApi.room.deleteRoom.mockResolvedValue(undefined);

      await provider.deleteRoom('test-room');
      expect(mockApi.room.deleteRoom).toHaveBeenCalledWith('test-room');
    });

    it('should throw LiveKitProviderError on failure', async () => {
      mockApi.room.deleteRoom.mockRejectedValue(new Error('Room not found'));

      await expect(provider.deleteRoom('nonexistent')).rejects.toThrow(LiveKitProviderError);
    });
  });

  describe('getRoom', () => {
    it('should return room info when found', async () => {
      mockApi.room.listRooms.mockResolvedValue([
        { name: 'test-room', sid: 'sid123', emptyTimeout: 300, maxParticipants: 100, metadata: '', creationTime: BigInt(Math.floor(Date.now() / 1000)) },
      ]);
      mockApi.room.listParticipants.mockResolvedValue([{ identity: 'p1' }, { identity: 'p2' }]);

      const result = await provider.getRoom('test-room');

      expect(result.roomName).toBe('test-room');
      expect(result.sid).toBe('sid123');
      expect(result.numParticipants).toBe(2);
    });

    it('should throw when room not found', async () => {
      mockApi.room.listRooms.mockResolvedValue([]);

      await expect(provider.getRoom('nonexistent')).rejects.toThrow('Room not found');
    });
  });

  describe('generateHostToken', () => {
    it('should generate a host token with full permissions', async () => {
      const result = await provider.generateHostToken('test-room', 'user123', 3600);

      expect(result.token).toBe('mock.jwt.token');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());

      const mockAccessToken = (AccessToken as unknown as jest.Mock).mock.results[0].value;
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
        room: 'test-room',
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateMetadata: true,
      });
    });
  });

  describe('generateViewerToken', () => {
    it('should generate a viewer token with subscribe-only permissions', async () => {
      const result = await provider.generateViewerToken('test-room', 'user123');

      expect(result.token).toBe('mock.jwt.token');
      const mockAccessToken = (AccessToken as unknown as jest.Mock).mock.results[0].value;
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
        room: 'test-room',
        roomJoin: true,
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
        canUpdateMetadata: false,
      });
    });
  });

  describe('generateGuestToken', () => {
    it('should generate a guest token with prefixed identity', async () => {
      const result = await provider.generateGuestToken('test-room', 'guest123');

      expect(result.token).toBe('mock.jwt.token');
      const mockAccessToken = (AccessToken as unknown as jest.Mock).mock.results[0].value;
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith(
        expect.objectContaining({ room: 'test-room', canPublish: false })
      );
      // Check identity was prefixed
      expect(AccessToken).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ identity: 'guest_guest123' })
      );
    });
  });

  describe('generateModeratorToken', () => {
    it('should generate a moderator token with admin permissions', async () => {
      const result = await provider.generateModeratorToken('test-room', 'mod123');

      expect(result.token).toBe('mock.jwt.token');
      const mockAccessToken = (AccessToken as unknown as jest.Mock).mock.results[0].value;
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
        room: 'test-room',
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateMetadata: true,
        canRemoveParticipants: true,
      });
    });
  });

  describe('listParticipants', () => {
    it('should return mapped participants', async () => {
      mockApi.room.listParticipants.mockResolvedValue([
        {
          identity: 'user1',
          name: 'User 1',
          state: 1,
          tracks: [{ sid: 'track1' }],
          metadata: 'some data',
          joinedAt: BigInt(Math.floor(Date.now() / 1000)),
        },
      ]);

      const result = await provider.listParticipants('test-room');

      expect(result).toHaveLength(1);
      expect(result[0].identity).toBe('user1');
      expect(result[0].name).toBe('User 1');
      expect(result[0].tracks).toEqual(['track1']);
    });
  });

  describe('disconnectParticipant', () => {
    it('should remove a participant', async () => {
      mockApi.room.removeParticipant.mockResolvedValue(undefined);

      await provider.disconnectParticipant('test-room', 'user1');
      expect(mockApi.room.removeParticipant).toHaveBeenCalledWith('test-room', 'user1');
    });

    it('should throw LiveKitProviderError when participant not found', async () => {
      mockApi.room.removeParticipant.mockRejectedValue(new Error('participant not found'));

      await expect(provider.disconnectParticipant('test-room', 'missing')).rejects.toThrow(LiveKitProviderError);
    });
  });

  describe('updateParticipantPermissions', () => {
    it('should update participant permissions', async () => {
      mockApi.room.updateParticipant.mockResolvedValue({});

      await provider.updateParticipantPermissions('test-room', 'user1', {
        canPublish: false,
        canSubscribe: true,
        canPublishData: false,
      });

      expect(mockApi.room.updateParticipant).toHaveBeenCalledWith('test-room', 'user1', {
        permission: {
          canPublish: false,
          canSubscribe: true,
          canPublishData: false,
        },
      });
    });
  });

  describe('isHealthy', () => {
    it('should return true when LiveKit is reachable', async () => {
      mockApi.room.listRooms.mockResolvedValue([]);

      const result = await provider.isHealthy();
      expect(result).toBe(true);
    });

    it('should return false when LiveKit is unreachable', async () => {
      mockApi.room.listRooms.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await provider.isHealthy();
      expect(result).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status with latency', async () => {
      mockApi.room.listRooms.mockResolvedValue([]);

      const result = await provider.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.provider).toBe('livekit');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.details).toContain('LiveKit reachable');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return unhealthy status with error details', async () => {
      mockApi.room.listRooms.mockRejectedValue(new Error('Connection timeout'));

      const result = await provider.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.provider).toBe('livekit');
      expect(result.details).toContain('Connection timeout');
    });
  });

  describe('error wrapping', () => {
    it('should wrap unauthorized errors as 401', async () => {
      mockApi.room.createRoom.mockRejectedValue(new Error('Unauthorized access'));

      try {
        await provider.createRoom('test', 10);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LiveKitProviderError);
        expect((error as LiveKitProviderError).statusCode).toBe(401);
        expect((error as LiveKitProviderError).code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should wrap timeout errors as 503', async () => {
      mockApi.room.createRoom.mockRejectedValue(new Error('Connection timeout after 5000ms'));

      try {
        await provider.createRoom('test', 10);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LiveKitProviderError);
        expect((error as LiveKitProviderError).statusCode).toBe(503);
        expect((error as LiveKitProviderError).code).toBe('PROVIDER_UNAVAILABLE');
      }
    });

    it('should wrap not-found errors as 404', async () => {
      mockApi.room.deleteRoom.mockRejectedValue(new Error('Room not found'));

      try {
        await provider.deleteRoom('nonexistent');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LiveKitProviderError);
        expect((error as LiveKitProviderError).statusCode).toBe(404);
        expect((error as LiveKitProviderError).code).toBe('ROOM_NOT_FOUND');
      }
    });

    it('should wrap unknown errors as 500', async () => {
      mockApi.room.createRoom.mockRejectedValue('something weird');

      try {
        await provider.createRoom('test', 10);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LiveKitProviderError);
        expect((error as LiveKitProviderError).statusCode).toBe(500);
      }
    });
  });

  describe('recording stubs', () => {
    it('startRecording should throw not-implemented', async () => {
      await expect(provider.startRecording('test')).rejects.toThrow('Phase 3H');
    });

    it('stopRecording should throw not-implemented', async () => {
      await expect(provider.stopRecording('egress1')).rejects.toThrow('Phase 3H');
    });
  });
});
