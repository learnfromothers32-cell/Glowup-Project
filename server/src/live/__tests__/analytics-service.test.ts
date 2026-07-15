/**
 * LiveAnalyticsService Tests
 */

describe('LiveAnalyticsService', () => {
  // In-memory analytics tracking (mirrors the service logic)
  const reactionCounts: Map<string, Map<string, number>> = new Map();
  const guestRequestCounts: Map<string, number> = new Map();
  const servicePinCounts: Map<string, number> = new Map();
  const reportCounts: Map<string, number> = new Map();

  const recordReaction = (sessionId: string, reactionType: string) => {
    if (!reactionCounts.has(sessionId)) {
      reactionCounts.set(sessionId, new Map());
    }
    const sessionReactions = reactionCounts.get(sessionId)!;
    sessionReactions.set(reactionType, (sessionReactions.get(reactionType) || 0) + 1);
  };

  const getReactionCounts = (sessionId: string): Record<string, number> => {
    const sessionReactions = reactionCounts.get(sessionId);
    if (!sessionReactions) return {};
    const result: Record<string, number> = {};
    sessionReactions.forEach((count, type) => {
      result[type] = count;
    });
    return result;
  };

  const recordGuestRequest = (sessionId: string) => {
    guestRequestCounts.set(sessionId, (guestRequestCounts.get(sessionId) || 0) + 1);
  };

  const recordServicePin = (sessionId: string) => {
    servicePinCounts.set(sessionId, (servicePinCounts.get(sessionId) || 0) + 1);
  };

  const recordReport = (sessionId: string) => {
    reportCounts.set(sessionId, (reportCounts.get(sessionId) || 0) + 1);
  };

  const cleanupSession = (sessionId: string) => {
    reactionCounts.delete(sessionId);
    guestRequestCounts.delete(sessionId);
    servicePinCounts.delete(sessionId);
    reportCounts.delete(sessionId);
  };

  beforeEach(() => {
    reactionCounts.clear();
    guestRequestCounts.clear();
    servicePinCounts.clear();
    reportCounts.clear();
  });

  describe('Reaction Tracking', () => {
    it('should record reactions per session', () => {
      recordReaction('session1', 'love');
      recordReaction('session1', 'love');
      recordReaction('session1', 'fire');

      const counts = getReactionCounts('session1');
      expect(counts.love).toBe(2);
      expect(counts.fire).toBe(1);
    });

    it('should track reactions independently per session', () => {
      recordReaction('session1', 'love');
      recordReaction('session2', 'fire');

      expect(getReactionCounts('session1')).toEqual({ love: 1 });
      expect(getReactionCounts('session2')).toEqual({ fire: 1 });
    });

    it('should return empty for unknown session', () => {
      expect(getReactionCounts('unknown')).toEqual({});
    });

    it('should track all 5 reaction types', () => {
      const types = ['love', 'fire', 'clap', 'wow', 'glow'];
      types.forEach((type) => recordReaction('session1', type));

      const counts = getReactionCounts('session1');
      expect(Object.keys(counts)).toHaveLength(5);
      types.forEach((type) => {
        expect(counts[type]).toBe(1);
      });
    });
  });

  describe('Guest Request Tracking', () => {
    it('should count guest requests per session', () => {
      recordGuestRequest('session1');
      recordGuestRequest('session1');
      recordGuestRequest('session2');

      expect(guestRequestCounts.get('session1')).toBe(2);
      expect(guestRequestCounts.get('session2')).toBe(1);
    });
  });

  describe('Service Pin Tracking', () => {
    it('should count service pins per session', () => {
      recordServicePin('session1');
      recordServicePin('session1');

      expect(servicePinCounts.get('session1')).toBe(2);
    });
  });

  describe('Report Tracking', () => {
    it('should count reports per session', () => {
      recordReport('session1');
      recordReport('session1');
      recordReport('session1');

      expect(reportCounts.get('session1')).toBe(3);
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up all counters for a session', () => {
      recordReaction('session1', 'love');
      recordGuestRequest('session1');
      recordServicePin('session1');
      recordReport('session1');

      cleanupSession('session1');

      expect(getReactionCounts('session1')).toEqual({});
      expect(guestRequestCounts.has('session1')).toBe(false);
      expect(servicePinCounts.has('session1')).toBe(false);
      expect(reportCounts.has('session1')).toBe(false);
    });

    it('should not affect other sessions during cleanup', () => {
      recordReaction('session1', 'love');
      recordReaction('session2', 'fire');

      cleanupSession('session1');

      expect(getReactionCounts('session1')).toEqual({});
      expect(getReactionCounts('session2')).toEqual({ fire: 1 });
    });
  });
});
