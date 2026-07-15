/**
 * ProfanityFilter Tests
 */

import { ProfanityFilter } from '../services/ProfanityFilter';

describe('ProfanityFilter', () => {
  describe('hasProfanity', () => {
    it('should return false for clean content', () => {
      const filter = new ProfanityFilter({ bannedWords: ['badword'] });
      expect(filter.hasProfanity('hello world')).toBe(false);
    });

    it('should detect exact word matches', () => {
      const filter = new ProfanityFilter({ bannedWords: ['badword'] });
      expect(filter.hasProfanity('this is a badword here')).toBe(true);
    });

    it('should be case insensitive', () => {
      const filter = new ProfanityFilter({ bannedWords: ['badword'] });
      expect(filter.hasProfanity('BADWORD')).toBe(true);
      expect(filter.hasProfanity('BadWord')).toBe(true);
    });

    it('should respect minMatchLength for pattern matching', () => {
      // Words below minMatchLength (default 3) only match via exact set lookup
      const filter = new ProfanityFilter({ bannedWords: ['damn'] });
      expect(filter.hasProfanity('damn it')).toBe(true);
      expect(filter.hasProfanity('damned')).toBe(false); // 'damn' doesn't match 'damned' via word boundary
    });

    it('should match words at or above minMatchLength', () => {
      const filter = new ProfanityFilter({ bannedWords: ['damn'] });
      expect(filter.hasProfanity('damn it')).toBe(true);
    });

    it('should handle empty content', () => {
      const filter = new ProfanityFilter({ bannedWords: ['bad'] });
      expect(filter.hasProfanity('')).toBe(false);
    });

    it('should handle empty banned word list', () => {
      const filter = new ProfanityFilter({ bannedWords: [] });
      expect(filter.hasProfanity('anything goes')).toBe(false);
    });

    it('should handle multiple banned words', () => {
      const filter = new ProfanityFilter({ bannedWords: ['word1', 'word2', 'word3'] });
      expect(filter.hasProfanity('this has word2 in it')).toBe(true);
      expect(filter.hasProfanity('clean content')).toBe(false);
    });
  });

  describe('filter with replace action', () => {
    it('should replace banned words with asterisks', () => {
      const filter = new ProfanityFilter({
        bannedWords: ['badword'],
        action: 'replace',
        replacementChar: '*',
      });
      const result = filter.filter('this is a badword here');
      expect(result.hasProfanity).toBe(true);
      expect(result.filtered).toContain('***');
      expect(result.filtered).not.toContain('badword');
    });

    it('should not modify clean content', () => {
      const filter = new ProfanityFilter({
        bannedWords: ['badword'],
        action: 'replace',
      });
      const result = filter.filter('hello world');
      expect(result.hasProfanity).toBe(false);
      expect(result.filtered).toBe('hello world');
    });

    it('should handle multiple banned words', () => {
      const filter = new ProfanityFilter({
        bannedWords: ['word1', 'word2'],
        action: 'replace',
      });
      const result = filter.filter('word1 and word2');
      expect(result.hasProfanity).toBe(true);
      expect(result.filtered).not.toContain('word1');
      expect(result.filtered).not.toContain('word2');
    });
  });

  describe('filter with reject action', () => {
    it('should return empty string for content with profanity', () => {
      const filter = new ProfanityFilter({
        bannedWords: ['badword'],
        action: 'reject',
      });
      const result = filter.filter('this is a badword here');
      expect(result.hasProfanity).toBe(true);
      expect(result.filtered).toBe('');
    });
  });

  describe('updateWords', () => {
    it('should update the banned word list', () => {
      const filter = new ProfanityFilter({ bannedWords: ['old'] });
      expect(filter.hasProfanity('old content')).toBe(true);

      filter.updateWords(['new']);
      expect(filter.hasProfanity('old content')).toBe(false);
      expect(filter.hasProfanity('new content')).toBe(true);
    });
  });

  describe('addWords', () => {
    it('should add words to the banned list', () => {
      const filter = new ProfanityFilter({ bannedWords: ['existing'] });
      expect(filter.hasProfanity('existing content')).toBe(true);

      filter.addWords(['added']);
      expect(filter.hasProfanity('added content')).toBe(true);
      expect(filter.hasProfanity('existing content')).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const filter = new ProfanityFilter({
        bannedWords: ['test'],
        action: 'reject',
        replacementChar: '#',
        minMatchLength: 5,
      });
      const config = filter.getConfig();
      expect(config.bannedWords).toEqual(['test']);
      expect(config.action).toBe('reject');
      expect(config.replacementChar).toBe('#');
      expect(config.minMatchLength).toBe(5);
    });
  });
});
