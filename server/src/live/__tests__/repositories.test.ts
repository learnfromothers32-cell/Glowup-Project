import { Types } from 'mongoose';
import { LiveSessionRepository } from '../repositories/LiveSessionRepository';
import { LiveParticipantRepository } from '../repositories/LiveParticipantRepository';
import { LiveModerationRepository } from '../repositories/LiveModerationRepository';
import { LiveSession } from '../models/LiveSession';
import { LiveParticipant } from '../models/LiveParticipant';
import { LiveModeration } from '../models/LiveModeration';

// Valid ObjectId strings for tests
const SESSION_ID = new Types.ObjectId().toHexString();
const STYLIST_ID = new Types.ObjectId().toHexString();
const USER_ID = new Types.ObjectId().toHexString();
const MOD_ID = new Types.ObjectId().toHexString();

// Mock mongoose models
jest.mock('../models/LiveSession', () => ({
  LiveSession: {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

jest.mock('../models/LiveParticipant', () => ({
  LiveParticipant: {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

jest.mock('../models/LiveModeration', () => ({
  LiveModeration: {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

describe('Live Repositories', () => {
  describe('LiveSessionRepository', () => {
    let repository: LiveSessionRepository;

    beforeEach(() => {
      jest.clearAllMocks();
      repository = new LiveSessionRepository();
    });

    describe('findById', () => {
      it('should find session by id', async () => {
        const mockSession = { _id: SESSION_ID };
        (LiveSession.findById as jest.Mock).mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSession),
        });

        const result = await repository.findById(SESSION_ID);
        expect(LiveSession.findById).toHaveBeenCalledWith(SESSION_ID);
      });
    });

    describe('findByRoomName', () => {
      it('should find session by room name', async () => {
        const roomName = `live_${STYLIST_ID}_${Date.now()}`;
        const mockSession = { _id: SESSION_ID, roomName };
        (LiveSession.findOne as jest.Mock).mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSession),
        });

        const result = await repository.findByRoomName(roomName);
        expect(LiveSession.findOne).toHaveBeenCalledWith({ roomName });
      });
    });

    describe('create', () => {
      it('should create a new session', async () => {
        const sessionData = {
          stylistId: STYLIST_ID,
          hostUserId: USER_ID,
          title: 'Test Session',
          category: 'beauty',
          roomName: `live_${STYLIST_ID}_${Date.now()}`,
        };
        const mockSession = { _id: SESSION_ID, ...sessionData };
        (LiveSession.create as jest.Mock).mockResolvedValue(mockSession);

        const result = await repository.create(sessionData);
        expect(LiveSession.create).toHaveBeenCalled();
        expect(result).toEqual(mockSession);
      });
    });

    describe('update', () => {
      it('should update session', async () => {
        const mockSession = { _id: SESSION_ID, title: 'Updated' };
        (LiveSession.findByIdAndUpdate as jest.Mock).mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSession),
        });

        const result = await repository.update(SESSION_ID, { title: 'Updated' });
        expect(LiveSession.findByIdAndUpdate).toHaveBeenCalled();
      });
    });

    describe('incrementViewerCount', () => {
      it('should increment viewer count', async () => {
        const mockSession = { _id: SESSION_ID, viewerCount: 11 };
        (LiveSession.findByIdAndUpdate as jest.Mock).mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockSession),
        });

        const result = await repository.incrementViewerCount(SESSION_ID);
        expect(LiveSession.findByIdAndUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('LiveParticipantRepository', () => {
    let repository: LiveParticipantRepository;

    beforeEach(() => {
      jest.clearAllMocks();
      repository = new LiveParticipantRepository();
    });

    describe('addParticipant', () => {
      it('should add a participant', async () => {
        const mockParticipant = {
          _id: new Types.ObjectId().toHexString(),
          sessionId: SESSION_ID,
          userId: USER_ID,
          role: 'viewer',
        };
        (LiveParticipant.create as jest.Mock).mockResolvedValue(mockParticipant);

        const result = await repository.addParticipant(SESSION_ID, USER_ID, 'viewer');
        expect(LiveParticipant.create).toHaveBeenCalled();
        expect(result).toEqual(mockParticipant);
      });
    });

    describe('isUserInSession', () => {
      it('should return true if user is in session', async () => {
        (LiveParticipant.findOne as jest.Mock).mockReturnValue(
          Promise.resolve({ userId: USER_ID })
        );

        const result = await repository.isUserInSession(SESSION_ID, USER_ID);
        expect(result).toBe(true);
      });

      it('should return false if user is not in session', async () => {
        (LiveParticipant.findOne as jest.Mock).mockReturnValue(
          Promise.resolve(null)
        );

        const result = await repository.isUserInSession(SESSION_ID, USER_ID);
        expect(result).toBe(false);
      });
    });

    describe('countActiveParticipants', () => {
      it('should count active participants', async () => {
        (LiveParticipant.countDocuments as jest.Mock).mockReturnValue(
          Promise.resolve(5)
        );

        const result = await repository.countActiveParticipants(SESSION_ID);
        expect(LiveParticipant.countDocuments).toHaveBeenCalled();
      });
    });
  });

  describe('LiveModerationRepository', () => {
    let repository: LiveModerationRepository;

    beforeEach(() => {
      jest.clearAllMocks();
      repository = new LiveModerationRepository();
    });

    describe('create', () => {
      it('should create a moderation record', async () => {
        const moderationData = {
          sessionId: SESSION_ID,
          action: 'mute' as const,
          performedBy: MOD_ID,
          targetUserId: USER_ID,
        };
        const mockRecord = { _id: new Types.ObjectId().toHexString(), ...moderationData };
        (LiveModeration.create as jest.Mock).mockResolvedValue(mockRecord);

        const result = await repository.create(moderationData);
        expect(LiveModeration.create).toHaveBeenCalled();
        expect(result).toEqual(mockRecord);
      });
    });

    describe('isUserBanned', () => {
      it('should return true if user is banned (no unban found)', async () => {
        const mockSort = jest.fn().mockResolvedValue({ action: 'ban', createdAt: new Date('2026-01-01') });
        (LiveModeration.findOne as jest.Mock)
          .mockReturnValueOnce({
            sort: mockSort,
          })
          .mockResolvedValueOnce(null);

        const result = await repository.isUserBanned(SESSION_ID, USER_ID);
        expect(result).toBe(true);
      });

      it('should return false if user is not banned', async () => {
        (LiveModeration.findOne as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(null),
        });

        const result = await repository.isUserBanned(SESSION_ID, USER_ID);
        expect(result).toBe(false);
      });

      it('should return false if banned but unbanned later', async () => {
        const mockSort = jest.fn().mockResolvedValue({ action: 'ban', createdAt: new Date('2026-01-01') });
        (LiveModeration.findOne as jest.Mock)
          .mockReturnValueOnce({
            sort: mockSort,
          })
          .mockResolvedValueOnce({ action: 'unban', createdAt: new Date('2026-01-02') });

        const result = await repository.isUserBanned(SESSION_ID, USER_ID);
        expect(result).toBe(false);
      });
    });

    describe('getReportCount', () => {
      it('should count reports', async () => {
        (LiveModeration.countDocuments as jest.Mock).mockReturnValue(
          Promise.resolve(3)
        );

        const result = await repository.getReportCount(SESSION_ID);
        expect(LiveModeration.countDocuments).toHaveBeenCalled();
      });
    });
  });
});
