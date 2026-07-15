/**
 * Profanity Filter
 *
 * Server-side rule-based profanity filter.
 * Configurable word list, case-insensitive, supports replacement or rejection.
 * Extension points for future AI moderation.
 */

import logger from '../../utils/logger';

export type ProfanityAction = 'replace' | 'reject';

export interface ProfanityFilterConfig {
  /** List of banned words/phrases (lowercase) */
  bannedWords: string[];
  /** What to do with banned words: replace with *** or reject the message */
  action: ProfanityAction;
  /** Character used for replacement */
  replacementChar: string;
  /** Minimum match length (ignores single-char words) */
  minMatchLength: number;
}

const DEFAULT_CONFIG: ProfanityFilterConfig = {
  bannedWords: [],
  action: 'replace',
  replacementChar: '*',
  minMatchLength: 3,
};

export class ProfanityFilter {
  private config: ProfanityFilterConfig;
  private bannedSet: Set<string>;
  private bannedPatterns: RegExp[];

  constructor(config: Partial<ProfanityFilterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.bannedSet = new Set(this.config.bannedWords.map((w) => w.toLowerCase()));
    this.bannedPatterns = this.buildPatterns(this.config.bannedWords);
  }

  /**
   * Build regex patterns from banned words for efficient matching.
   * Handles word boundaries and case insensitivity.
   */
  private buildPatterns(words: string[]): RegExp[] {
    return words
      .filter((w) => w.length >= this.config.minMatchLength)
      .map((word) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'gi');
      });
  }

  /**
   * Check if content contains profanity.
   */
  hasProfanity(content: string): boolean {
    const lower = content.toLowerCase();

    // Check exact set matches
    const words = lower.split(/\s+/);
    for (const word of words) {
      if (this.bannedSet.has(word)) {
        return true;
      }
    }

    // Check pattern matches
    for (const pattern of this.bannedPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Filter content through the profanity filter.
   * Returns filtered content and whether profanity was detected.
   */
  filter(content: string): { filtered: string; hasProfanity: boolean } {
    if (!this.hasProfanity(content)) {
      return { filtered: content, hasProfanity: false };
    }

    if (this.config.action === 'reject') {
      return { filtered: '', hasProfanity: true };
    }

    // Replace banned words with replacement characters
    let filtered = content;
    for (const pattern of this.bannedPatterns) {
      pattern.lastIndex = 0;
      filtered = filtered.replace(pattern, (match) =>
        this.config.replacementChar.repeat(match.length)
      );
    }

    // Also check word-level matches
    const words = filtered.split(/(\s+)/);
    for (let i = 0; i < words.length; i++) {
      if (this.bannedSet.has(words[i].toLowerCase())) {
        words[i] = this.config.replacementChar.repeat(words[i].length);
      }
    }
    filtered = words.join('');

    return { filtered, hasProfanity: true };
  }

  /**
   * Update the banned word list at runtime.
   */
  updateWords(words: string[]): void {
    this.config.bannedWords = words;
    this.bannedSet = new Set(words.map((w) => w.toLowerCase()));
    this.bannedPatterns = this.buildPatterns(words);
    logger.info('Profanity filter word list updated', { count: words.length });
  }

  /**
   * Add words to the banned list.
   */
  addWords(words: string[]): void {
    this.config.bannedWords.push(...words);
    for (const w of words) {
      this.bannedSet.add(w.toLowerCase());
    }
    this.bannedPatterns = this.buildPatterns(this.config.bannedWords);
    logger.info('Profanity filter words added', { count: words.length });
  }

  /**
   * Get current config (for testing/debugging).
   */
  getConfig(): ProfanityFilterConfig {
    return { ...this.config };
  }
}

/**
 * Default profanity filter instance.
 * Initialized with empty list — can be configured at startup.
 */
export const defaultProfanityFilter = new ProfanityFilter();
