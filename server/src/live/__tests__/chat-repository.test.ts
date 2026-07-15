import { Types } from 'mongoose';
import { LiveChatMessageRepository } from '../repositories/LiveChatMessageRepository';
import { LiveChatMessage } from '../models/LiveChatMessage';

const SESSION_ID = new Types.ObjectId().toHexString();
const USER_ID = new Types.ObjectId().toHexString();

jest.mock('../models/LiveChatMessage', () => ({
  LiveChatMessage: {
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('LiveChatMessageRepository', () => {
  let repo: LiveChatMessageRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new LiveChatMessageRepository();
  });

  describe('create', () => {
    it('should create a message', async () => {
      const input = {
        sessionId: SESSION_ID,
        senderId: USER_ID,
        senderName: 'Alice',
        content: 'Hello',
        messageId: 'msg-uuid-1',
        sequenceNumber: 1,
      };
      const mockDoc = { _id: new Types.ObjectId(), ...input };
      (LiveChatMessage.create as jest.Mock).mockResolvedValue(mockDoc);

      const result = await repo.create(input);
      expect(LiveChatMessage.create).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('findByMessageId', () => {
    it('should find message by messageId', async () => {
      const mockDoc = { _id: '123', messageId: 'msg-uuid-1' };
      (LiveChatMessage.findOne as jest.Mock).mockReturnValue(Promise.resolve(mockDoc));

      const result = await repo.findByMessageId('msg-uuid-1');
      expect(LiveChatMessage.findOne).toHaveBeenCalledWith({ messageId: 'msg-uuid-1' });
      expect(result).toEqual(mockDoc);
    });

    it('should return null if not found', async () => {
      (LiveChatMessage.findOne as jest.Mock).mockReturnValue(Promise.resolve(null));

      const result = await repo.findByMessageId('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findRecentMessages', () => {
    it('should find recent non-deleted messages', async () => {
      const mockMessages = [{ _id: '1' }, { _id: '2' }];
      const mockSort = jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(mockMessages) });
      (LiveChatMessage.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const result = await repo.findRecentMessages(SESSION_ID, 25);
      expect(result).toEqual(mockMessages);
    });
  });

  describe('paginateMessages', () => {
    it('should return messages with hasMore=false when fewer than limit', async () => {
      const mockMessages = [{ _id: '1', createdAt: new Date('2026-01-01T00:00:00Z') }];
      const mockSort = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(mockMessages),
      });
      (LiveChatMessage.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const result = await repo.paginateMessages(SESSION_ID, undefined, 50);
      expect(result.hasMore).toBe(false);
      expect(result.messages).toEqual(mockMessages);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should return hasMore=true and nextCursor when more results exist', async () => {
      const extraMessages = Array.from({ length: 51 }, (_, i) => ({
        _id: String(i),
        createdAt: new Date(Date.UTC(2026, 0, 1 + i)),
      }));
      const mockSort = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(extraMessages),
      });
      (LiveChatMessage.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const result = await repo.paginateMessages(SESSION_ID, undefined, 50);
      expect(result.hasMore).toBe(true);
      expect(result.messages).toHaveLength(50);
      expect(result.nextCursor).toBeDefined();
    });

    it('should pass cursor to query when provided', async () => {
      const mockMessages = [{ _id: '1', createdAt: new Date('2026-01-01T00:00:00Z') }];
      const mockSort = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(mockMessages),
      });
      (LiveChatMessage.find as jest.Mock).mockReturnValue({ sort: mockSort });

      await repo.paginateMessages(SESSION_ID, '2026-01-15T00:00:00.000Z', 10);
      expect(LiveChatMessage.find).toHaveBeenCalled();
    });
  });

  describe('findMessageByIdAndSession', () => {
    it('should find message by _id and sessionId', async () => {
      const validMsgId = new Types.ObjectId().toHexString();
      const mockDoc = { _id: validMsgId };
      (LiveChatMessage.findOne as jest.Mock).mockReturnValue(Promise.resolve(mockDoc));

      const result = await repo.findMessageByIdAndSession(validMsgId, SESSION_ID);
      expect(LiveChatMessage.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a message', async () => {
      const mockUpdated = { _id: '123', isDeleted: true, content: '[message deleted]' };
      (LiveChatMessage.findByIdAndUpdate as jest.Mock).mockReturnValue(
        Promise.resolve(mockUpdated)
      );

      const result = await repo.softDelete('123', USER_ID, 'spam');
      expect(LiveChatMessage.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          $set: expect.objectContaining({ isDeleted: true }),
        }),
        { new: true }
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('pinMessage / unpinMessage', () => {
    it('should pin a message', async () => {
      const mockDoc = { _id: '123', type: 'pinned' };
      (LiveChatMessage.findByIdAndUpdate as jest.Mock).mockReturnValue(
        Promise.resolve(mockDoc)
      );

      const result = await repo.pinMessage('123');
      expect(LiveChatMessage.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { $set: { type: 'pinned' } },
        { new: true }
      );
      expect(result).toEqual(mockDoc);
    });

    it('should unpin a message', async () => {
      const mockDoc = { _id: '123', type: 'normal' };
      (LiveChatMessage.findByIdAndUpdate as jest.Mock).mockReturnValue(
        Promise.resolve(mockDoc)
      );

      const result = await repo.unpinMessage('123');
      expect(LiveChatMessage.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { $set: { type: 'normal' } },
        { new: true }
      );
      expect(result).toEqual(mockDoc);
    });
  });

  describe('getPinnedMessages', () => {
    it('should return pinned messages', async () => {
      const mockPinned = [{ _id: '1', type: 'pinned' }];
      const mockSort = jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(mockPinned),
      });
      (LiveChatMessage.find as jest.Mock).mockReturnValue({ sort: mockSort });

      const result = await repo.getPinnedMessages(SESSION_ID);
      expect(result).toEqual(mockPinned);
    });
  });

  describe('getNextSequenceNumber', () => {
    it('should return 1 if no messages exist yet', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      (LiveChatMessage.findOneAndUpdate as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await repo.getNextSequenceNumber(SESSION_ID);
      expect(result).toBe(1);
    });

    it('should return incremented value', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ sequenceNumber: 5 });
      (LiveChatMessage.findOneAndUpdate as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await repo.getNextSequenceNumber(SESSION_ID);
      expect(result).toBe(6);
    });
  });

  describe('countMessages', () => {
    it('should count non-deleted messages', async () => {
      (LiveChatMessage.countDocuments as jest.Mock).mockReturnValue(Promise.resolve(42));

      const result = await repo.countMessages(SESSION_ID);
      expect(result).toBe(42);
    });
  });

  describe('deleteMany', () => {
    it('should delete all messages for a session', async () => {
      (LiveChatMessage.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 10 });

      await repo.deleteMany(SESSION_ID);
      expect(LiveChatMessage.deleteMany).toHaveBeenCalled();
    });
  });
});
