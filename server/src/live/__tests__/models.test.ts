import mongoose from 'mongoose';
import { LiveSession, ILiveSession } from '../models/LiveSession';
import { LiveParticipant, ILiveParticipant } from '../models/LiveParticipant';
import { LiveModeration, ILiveModeration } from '../models/LiveModeration';

describe('Live Models', () => {
  describe('LiveSession Model', () => {
    it('should create a valid session', async () => {
      const sessionData = {
        stylistId: new mongoose.Types.ObjectId(),
        hostUserId: new mongoose.Types.ObjectId(),
        title: 'Test Session',
        category: 'beauty',
        roomName: `live_test_${Date.now()}`,
      };

      const session = new LiveSession(sessionData);
      const validationError = session.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require title', () => {
      const sessionData = {
        stylistId: new mongoose.Types.ObjectId(),
        hostUserId: new mongoose.Types.ObjectId(),
        category: 'beauty',
        roomName: `live_test_${Date.now()}`,
      };

      const session = new LiveSession(sessionData);
      const validationError = session.validateSync();
      expect(validationError?.errors.title).toBeDefined();
    });

    it('should require category', () => {
      const sessionData = {
        stylistId: new mongoose.Types.ObjectId(),
        hostUserId: new mongoose.Types.ObjectId(),
        title: 'Test Session',
        roomName: `live_test_${Date.now()}`,
      };

      const session = new LiveSession(sessionData);
      const validationError = session.validateSync();
      expect(validationError?.errors.category).toBeDefined();
    });

    it('should require roomName', () => {
      const sessionData = {
        stylistId: new mongoose.Types.ObjectId(),
        hostUserId: new mongoose.Types.ObjectId(),
        title: 'Test Session',
        category: 'beauty',
      };

      const session = new LiveSession(sessionData);
      const validationError = session.validateSync();
      expect(validationError?.errors.roomName).toBeDefined();
    });

    it('should have default values', () => {
      const session = new LiveSession({
        stylistId: new mongoose.Types.ObjectId(),
        hostUserId: new mongoose.Types.ObjectId(),
        title: 'Test',
        category: 'beauty',
        roomName: 'test_room',
      });

      expect(session.status).toBe('scheduled');
      expect(session.viewerCount).toBe(0);
      expect(session.likeCount).toBe(0);
      expect(session.chatMessageCount).toBe(0);
      expect(session.giftCount).toBe(0);
      expect(session.totalGiftValue).toBe(0);
      expect(session.bookingCount).toBe(0);
      expect(session.durationMs).toBe(0);
      expect(session.reportCount).toBe(0);
      expect(session.isUnderReview).toBe(false);
      expect(session.settings.chatEnabled).toBe(true);
      expect(session.settings.slowModeMs).toBe(0);
      expect(session.settings.followersOnly).toBe(false);
      expect(session.settings.giftsEnabled).toBe(true);
      expect(session.settings.recordingEnabled).toBe(true);
      expect(session.settings.maxViewers).toBe(10000);
    });

    it('should validate max 10 tags', () => {
      const session = new LiveSession({
        stylistId: new mongoose.Types.ObjectId(),
        hostUserId: new mongoose.Types.ObjectId(),
        title: 'Test',
        category: 'beauty',
        roomName: 'test_room',
        tags: Array(11).fill('tag'),
      });

      const validationError = session.validateSync();
      expect(validationError?.errors['tags']).toBeDefined();
    });
  });

  describe('LiveParticipant Model', () => {
    it('should create a valid participant', () => {
      const participant = new LiveParticipant({
        sessionId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        role: 'viewer',
      });

      const validationError = participant.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should have default values', () => {
      const participant = new LiveParticipant({
        sessionId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
      });

      expect(participant.role).toBe('viewer');
      expect(participant.watchDurationMs).toBe(0);
      expect(participant.isMuted).toBe(false);
      expect(participant.isBanned).toBe(false);
    });

    it('should require sessionId', () => {
      const participant = new LiveParticipant({
        userId: new mongoose.Types.ObjectId(),
      });

      const validationError = participant.validateSync();
      expect(validationError?.errors.sessionId).toBeDefined();
    });

    it('should require userId', () => {
      const participant = new LiveParticipant({
        sessionId: new mongoose.Types.ObjectId(),
      });

      const validationError = participant.validateSync();
      expect(validationError?.errors.userId).toBeDefined();
    });

    it('should accept valid roles', () => {
      const roles = ['host', 'moderator', 'viewer'];
      for (const role of roles) {
        const participant = new LiveParticipant({
          sessionId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          role,
        });
        const validationError = participant.validateSync();
        expect(validationError).toBeUndefined();
      }
    });
  });

  describe('LiveModeration Model', () => {
    it('should create a valid moderation record', () => {
      const moderation = new LiveModeration({
        sessionId: new mongoose.Types.ObjectId(),
        action: 'mute',
        performedBy: new mongoose.Types.ObjectId(),
        targetUserId: new mongoose.Types.ObjectId(),
      });

      const validationError = moderation.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require sessionId', () => {
      const moderation = new LiveModeration({
        action: 'mute',
        performedBy: new mongoose.Types.ObjectId(),
      });

      const validationError = moderation.validateSync();
      expect(validationError?.errors.sessionId).toBeDefined();
    });

    it('should require action', () => {
      const moderation = new LiveModeration({
        sessionId: new mongoose.Types.ObjectId(),
        performedBy: new mongoose.Types.ObjectId(),
      });

      const validationError = moderation.validateSync();
      expect(validationError?.errors.action).toBeDefined();
    });

    it('should require performedBy', () => {
      const moderation = new LiveModeration({
        sessionId: new mongoose.Types.ObjectId(),
        action: 'mute',
      });

      const validationError = moderation.validateSync();
      expect(validationError?.errors.performedBy).toBeDefined();
    });

    it('should accept valid actions', () => {
      const actions = [
        'mute',
        'unmute',
        'kick',
        'ban',
        'unban',
        'delete_message',
        'report',
        'slow_mode_change',
        'chat_toggle',
        'gifts_toggle',
      ];

      for (const action of actions) {
        const moderation = new LiveModeration({
          sessionId: new mongoose.Types.ObjectId(),
          action,
          performedBy: new mongoose.Types.ObjectId(),
        });
        const validationError = moderation.validateSync();
        expect(validationError).toBeUndefined();
      }
    });

    it('should reject invalid action', () => {
      const moderation = new LiveModeration({
        sessionId: new mongoose.Types.ObjectId(),
        action: 'invalid_action',
        performedBy: new mongoose.Types.ObjectId(),
      });

      const validationError = moderation.validateSync();
      expect(validationError?.errors.action).toBeDefined();
    });
  });
});
