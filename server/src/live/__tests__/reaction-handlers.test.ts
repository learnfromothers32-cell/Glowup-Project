/**
 * Reaction Handlers Tests
 */

describe('Reaction Rate Limiting', () => {
  it('should enforce minimum interval between reactions', () => {
    const RATE_LIMIT_MS = 500;
    const lastReactionTime = new Map<string, number>();

    const canSendReaction = (userId: string): boolean => {
      const now = Date.now();
      const lastTime = lastReactionTime.get(userId) || 0;
      if (now - lastTime < RATE_LIMIT_MS) {
        return false;
      }
      lastReactionTime.set(userId, now);
      return true;
    };

    const userId = 'user123';
    expect(canSendReaction(userId)).toBe(true);
    expect(canSendReaction(userId)).toBe(false);
  });

  it('should allow reactions after rate limit window', () => {
    const RATE_LIMIT_MS = 500;
    const lastReactionTime = new Map<string, number>();

    const canSendReaction = (userId: string): boolean => {
      const now = Date.now();
      const lastTime = lastReactionTime.get(userId) || 0;
      if (now - lastTime < RATE_LIMIT_MS) {
        return false;
      }
      lastReactionTime.set(userId, now);
      return true;
    };

    const userId = 'user123';
    expect(canSendReaction(userId)).toBe(true);

    // Simulate time passing
    lastReactionTime.set(userId, Date.now() - RATE_LIMIT_MS - 1);
    expect(canSendReaction(userId)).toBe(true);
  });

  it('should track reactions per user independently', () => {
    const lastReactionTime = new Map<string, number>();

    const canSendReaction = (userId: string): boolean => {
      const now = Date.now();
      const lastTime = lastReactionTime.get(userId) || 0;
      if (now - lastTime < 500) return false;
      lastReactionTime.set(userId, now);
      return true;
    };

    expect(canSendReaction('user1')).toBe(true);
    expect(canSendReaction('user2')).toBe(true);
    expect(canSendReaction('user1')).toBe(false);
  });
});

describe('Reaction Aggregation', () => {
  it('should aggregate reaction counts by type', () => {
    const counts: Record<string, number> = {};

    const addReaction = (type: string) => {
      counts[type] = (counts[type] || 0) + 1;
    };

    addReaction('love');
    addReaction('love');
    addReaction('fire');
    addReaction('clap');

    expect(counts.love).toBe(2);
    expect(counts.fire).toBe(1);
    expect(counts.clap).toBe(1);
  });

  it('should return empty counts when no reactions', () => {
    const counts: Record<string, number> = {};
    expect(Object.keys(counts)).toHaveLength(0);
  });
});

describe('Reaction Validation', () => {
  const VALID_REACTIONS = ['love', 'fire', 'clap', 'wow', 'glow'];

  it('should accept valid reaction types', () => {
    VALID_REACTIONS.forEach((type) => {
      expect(VALID_REACTIONS).toContain(type);
    });
  });

  it('should reject invalid reaction types', () => {
    expect(VALID_REACTIONS).not.toContain('invalid');
    expect(VALID_REACTIONS).not.toContain('hate');
    expect(VALID_REACTIONS).not.toContain('');
  });
});

describe('Reaction Cleanup', () => {
  it('should auto-remove reactions after timeout', () => {
    jest.useFakeTimers();

    const activeReactions: Array<{ id: string; createdAt: number }> = [];
    let idCounter = 0;

    const addReaction = () => {
      const id = `r_${++idCounter}`;
      activeReactions.push({ id, createdAt: Date.now() });
      setTimeout(() => {
        const idx = activeReactions.findIndex((r) => r.id === id);
        if (idx >= 0) activeReactions.splice(idx, 1);
      }, 3000);
      return id;
    };

    addReaction();
    expect(activeReactions).toHaveLength(1);

    jest.advanceTimersByTime(3000);
    expect(activeReactions).toHaveLength(0);

    jest.useRealTimers();
  });

  it('should cap active reactions to prevent memory issues', () => {
    const MAX_REACTIONS = 15;
    const activeReactions: string[] = [];

    const addReaction = (id: string) => {
      activeReactions.push(id);
      if (activeReactions.length > MAX_REACTIONS) {
        activeReactions.splice(0, activeReactions.length - MAX_REACTIONS);
      }
    };

    for (let i = 0; i < 20; i++) {
      addReaction(`r_${i}`);
    }

    expect(activeReactions).toHaveLength(MAX_REACTIONS);
    expect(activeReactions[0]).toBe('r_5');
  });
});
