/**
 * LiveMediaProvider Interface
 *
 * Abstract interface for live media operations.
 * Implementations: MockLiveMediaProvider (dev/testing), LiveKitMediaProvider (production).
 * Business logic must depend ONLY on this interface.
 * The provider is the only layer that knows about LiveKit SDK.
 */

// ── Result Types ──

export interface CreateRoomResult {
  roomName: string;
  maxParticipants: number;
}

export interface RoomInfoResult {
  roomName: string;
  sid: string;
  emptyTimeout: number;
  maxParticipants: number;
  metadata: string;
  numParticipants: number;
  createdAt: number;
}

export interface TokenResult {
  token: string;
  expiresAt: Date;
}

export interface RecordingResult {
  egressId: string;
}

export interface ParticipantResult {
  identity: string;
  name: string;
  state: string;
  tracks: string[];
  metadata: string;
  joinedAt: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  provider: string;
  latencyMs: number;
  details: string;
  timestamp: Date;
  sdkVersion?: string;
  liveKitUrl?: string;
}

// ── Provider Role (for token generation) ──

export type ProviderTokenRole = 'host' | 'viewer' | 'guest' | 'moderator';

// ── LiveMediaProvider Interface ──

export interface LiveMediaProvider {
  // ── Room Management ──

  /**
   * Create a new room for a live session.
   */
  createRoom(roomName: string, maxParticipants: number): Promise<CreateRoomResult>;

  /**
   * Delete a room.
   */
  deleteRoom(roomName: string): Promise<void>;

  /**
   * Get room info. Throws if room not found.
   */
  getRoom(roomName: string): Promise<RoomInfoResult>;

  // ── Token Generation ──

  /**
   * Generate a JWT token for the host (publish + subscribe + room admin).
   */
  generateHostToken(
    roomName: string,
    userId: string,
    ttlSeconds?: number
  ): Promise<TokenResult>;

  /**
   * Generate a JWT token for a viewer (subscribe-only).
   */
  generateViewerToken(
    roomName: string,
    userId: string,
    ttlSeconds?: number
  ): Promise<TokenResult>;

  /**
   * Generate a JWT token for a guest (subscribe-only, limited metadata).
   */
  generateGuestToken(
    roomName: string,
    guestId: string,
    ttlSeconds?: number
  ): Promise<TokenResult>;

  /**
   * Generate a JWT token for a moderator (publish + subscribe + room admin).
   */
  generateModeratorToken(
    roomName: string,
    userId: string,
    ttlSeconds?: number
  ): Promise<TokenResult>;

  // ── Participant Management ──

  /**
   * List all participants in a room.
   */
  listParticipants(roomName: string): Promise<ParticipantResult[]>;

  /**
   * Disconnect a participant from a room.
   */
  disconnectParticipant(roomName: string, identity: string): Promise<void>;

  /**
   * Update a participant's permissions.
   */
  updateParticipantPermissions(
    roomName: string,
    identity: string,
    permissions: { canPublish: boolean; canSubscribe: boolean; canPublishData: boolean }
  ): Promise<void>;

  // ── Recording (Phase 3H) ──

  startRecording(roomName: string): Promise<RecordingResult>;
  stopRecording(egressId: string): Promise<void>;

  // ── Health ──

  /**
   * Check if the provider is available and healthy.
   */
  isHealthy(): Promise<boolean>;

  /**
   * Detailed health check with latency and status info.
   */
  healthCheck(): Promise<HealthCheckResult>;
}

// ── Mock Implementation (Development / Testing) ──

export class MockLiveMediaProvider implements LiveMediaProvider {
  private rooms = new Map<string, CreateRoomResult>();
  private participants = new Map<string, ParticipantResult[]>();

  async createRoom(roomName: string, maxParticipants: number): Promise<CreateRoomResult> {
    const result = { roomName, maxParticipants };
    this.rooms.set(roomName, result);
    this.participants.set(roomName, []);
    return result;
  }

  async deleteRoom(roomName: string): Promise<void> {
    this.rooms.delete(roomName);
    this.participants.delete(roomName);
  }

  async getRoom(roomName: string): Promise<RoomInfoResult> {
    const room = this.rooms.get(roomName);
    if (!room) {
      throw new Error(`Room not found: ${roomName}`);
    }
    const parts = this.participants.get(roomName) || [];
    return {
      roomName,
      sid: `mock_sid_${roomName}`,
      emptyTimeout: 300,
      maxParticipants: room.maxParticipants,
      metadata: '',
      numParticipants: parts.length,
      createdAt: Date.now(),
    };
  }

  async generateHostToken(
    roomName: string,
    userId: string,
    ttlSeconds: number = 3600
  ): Promise<TokenResult> {
    return {
      token: `mock_host_token_${roomName}_${userId}`,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  async generateViewerToken(
    roomName: string,
    userId: string,
    ttlSeconds: number = 3600
  ): Promise<TokenResult> {
    return {
      token: `mock_viewer_token_${roomName}_${userId}`,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  async generateGuestToken(
    roomName: string,
    guestId: string,
    ttlSeconds: number = 3600
  ): Promise<TokenResult> {
    return {
      token: `mock_guest_token_${roomName}_${guestId}`,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  async generateModeratorToken(
    roomName: string,
    userId: string,
    ttlSeconds: number = 3600
  ): Promise<TokenResult> {
    return {
      token: `mock_moderator_token_${roomName}_${userId}`,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }

  async listParticipants(roomName: string): Promise<ParticipantResult[]> {
    return this.participants.get(roomName) || [];
  }

  async disconnectParticipant(roomName: string, identity: string): Promise<void> {
    const parts = this.participants.get(roomName) || [];
    this.participants.set(
      roomName,
      parts.filter((p) => p.identity !== identity)
    );
  }

  async updateParticipantPermissions(
    _roomName: string,
    _identity: string,
    _permissions: { canPublish: boolean; canSubscribe: boolean; canPublishData: boolean }
  ): Promise<void> {
    // Mock: no-op
  }

  async startRecording(roomName: string): Promise<RecordingResult> {
    return { egressId: `mock_egress_${roomName}` };
  }

  async stopRecording(_egressId: string): Promise<void> {
    // Mock: no-op
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    return {
      healthy: true,
      provider: 'mock',
      latencyMs: 0,
      details: 'Mock provider always healthy',
      timestamp: new Date(),
      sdkVersion: undefined,
      liveKitUrl: undefined,
    };
  }
}
