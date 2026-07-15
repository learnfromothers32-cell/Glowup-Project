/**
 * Live Analytics Service
 *
 * Collects operational metrics asynchronously.
 * Persists to MongoDB via LiveSession model fields + aggregated summaries.
 * No dashboards — raw data collection only.
 */

import { LiveSession } from '../models/LiveSession';
import { LiveModeration } from '../models/LiveModeration';
import { LiveParticipant } from '../models/LiveParticipant';
import { LiveChatMessage } from '../models/LiveChatMessage';
import logger from '../../utils/logger';

export interface SessionAnalytics {
  sessionId: string;
  streamsStarted: number;
  streamsEnded: number;
  averageDurationMs: number;
  peakViewers: number;
  averageViewers: number;
  totalChatMessages: number;
  bookingsFromLive: number;
  queueJoins: number;
  reactionsSent: number;
  guestRequests: number;
  reportsSubmitted: number;
  servicePins: number;
}

export interface LiveMetricsSnapshot {
  totalSessions: number;
  activeSessions: number;
  totalViewers: number;
  totalChatMessages: number;
  totalModerationActions: number;
  totalReports: number;
}

class LiveAnalyticsService {
  /** In-memory reaction counter per session (reset on session end) */
  private reactionCounts: Map<string, Map<string, number>> = new Map();

  /** In-memory guest request counter per session */
  private guestRequestCounts: Map<string, number> = new Map();

  /** In-memory service pin counter per session */
  private servicePinCounts: Map<string, number> = new Map();

  /** In-memory report counter per session */
  private reportCounts: Map<string, number> = new Map();

  /**
   * Record a reaction event (in-memory, async persistence).
   */
  recordReaction(sessionId: string, reactionType: string): void {
    if (!this.reactionCounts.has(sessionId)) {
      this.reactionCounts.set(sessionId, new Map());
    }
    const sessionReactions = this.reactionCounts.get(sessionId)!;
    sessionReactions.set(reactionType, (sessionReactions.get(reactionType) || 0) + 1);
  }

  /**
   * Get aggregated reaction counts for a session.
   */
  getReactionCounts(sessionId: string): Record<string, number> {
    const sessionReactions = this.reactionCounts.get(sessionId);
    if (!sessionReactions) return {};
    const result: Record<string, number> = {};
    sessionReactions.forEach((count, type) => {
      result[type] = count;
    });
    return result;
  }

  /**
   * Record a guest request event.
   */
  recordGuestRequest(sessionId: string): void {
    this.guestRequestCounts.set(
      sessionId,
      (this.guestRequestCounts.get(sessionId) || 0) + 1
    );
  }

  /**
   * Record a service pin event.
   */
  recordServicePin(sessionId: string): void {
    this.servicePinCounts.set(
      sessionId,
      (this.servicePinCounts.get(sessionId) || 0) + 1
    );
  }

  /**
   * Record a report event.
   */
  recordReport(sessionId: string): void {
    this.reportCounts.set(
      sessionId,
      (this.reportCounts.get(sessionId) || 0) + 1
    );
  }

  /**
   * Persist session analytics to the database on session end.
   * Updates the LiveSession document with final metrics.
   */
  async persistSessionAnalytics(sessionId: string): Promise<void> {
    try {
      const session = await LiveSession.findById(sessionId);
      if (!session) return;

      // Get moderation stats
      const moderationStats = await LiveModeration.aggregate([
        { $match: { sessionId: session._id } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
      ]);

      const moderationMap: Record<string, number> = {};
      moderationStats.forEach((s: any) => {
        moderationMap[s._id] = s.count;
      });

      // Get participant stats
      const participantStats = await LiveParticipant.aggregate([
        { $match: { sessionId: session._id } },
        {
          $group: {
            _id: null,
            totalParticipants: { $sum: 1 },
            totalWatchTimeMs: { $sum: '$watchDurationMs' },
          },
        },
      ]);

      const pStats = participantStats[0] || { totalParticipants: 0, totalWatchTimeMs: 0 };

      // Get chat message count
      const chatCount = await LiveChatMessage.countDocuments({
        sessionId: session._id,
        isDeleted: false,
      });

      // Update session with analytics
      const reactionCounts = this.getReactionCounts(sessionId);
      const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

      await LiveSession.findByIdAndUpdate(sessionId, {
        $set: {
          chatMessageCount: chatCount,
          reportCount: moderationMap['report'] || 0,
          'metrics.reactionsSent': totalReactions,
          'metrics.guestRequests': this.guestRequestCounts.get(sessionId) || 0,
          'metrics.servicePins': this.servicePinCounts.get(sessionId) || 0,
          'metrics.reportsSubmitted': this.reportCounts.get(sessionId) || 0,
        },
      });

      logger.info('Session analytics persisted', { sessionId, totalReactions, chatCount });
    } catch (error) {
      logger.error('Failed to persist session analytics', {
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get a full analytics snapshot for a session.
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
    try {
      const session = await LiveSession.findById(sessionId);
      if (!session) return null;

      const moderationStats = await LiveModeration.aggregate([
        { $match: { sessionId: session._id } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]);

      const moderationMap: Record<string, number> = {};
      moderationStats.forEach((s: any) => {
        moderationMap[s._id] = s.count;
      });

      const reactionCounts = this.getReactionCounts(sessionId);
      const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

      return {
        sessionId,
        streamsStarted: 1,
        streamsEnded: session.status === 'ended' ? 1 : 0,
        averageDurationMs: session.durationMs || 0,
        peakViewers: session.peakViewerCount,
        averageViewers: session.totalViews > 0
          ? Math.round(session.totalViews / Math.max(session.uniqueViewerCount, 1))
          : 0,
        totalChatMessages: session.chatMessageCount,
        bookingsFromLive: session.bookingCount,
        queueJoins: 0,
        reactionsSent: totalReactions,
        guestRequests: this.guestRequestCounts.get(sessionId) || 0,
        reportsSubmitted: moderationMap['report'] || 0,
        servicePins: this.servicePinCounts.get(sessionId) || 0,
      };
    } catch (error) {
      logger.error('Failed to get session analytics', {
        sessionId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Get overall platform metrics snapshot.
   */
  async getPlatformMetrics(): Promise<LiveMetricsSnapshot> {
    try {
      const [totalSessions, activeSessions, moderationStats] = await Promise.all([
        LiveSession.countDocuments(),
        LiveSession.countDocuments({ status: { $in: ['live', 'paused'] } }),
        LiveModeration.aggregate([
          { $group: { _id: '$action', count: { $sum: 1 } } },
        ]),
      ]);

      const moderationMap: Record<string, number> = {};
      moderationStats.forEach((s: any) => {
        moderationMap[s._id] = s.count;
      });

      return {
        totalSessions,
        activeSessions,
        totalViewers: 0,
        totalChatMessages: 0,
        totalModerationActions: Object.values(moderationMap).reduce((a, b) => a + b, 0),
        totalReports: moderationMap['report'] || 0,
      };
    } catch (error) {
      logger.error('Failed to get platform metrics', { error: (error as Error).message });
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalViewers: 0,
        totalChatMessages: 0,
        totalModerationActions: 0,
        totalReports: 0,
      };
    }
  }

  /**
   * Cleanup in-memory counters for a session.
   */
  cleanupSession(sessionId: string): void {
    this.reactionCounts.delete(sessionId);
    this.guestRequestCounts.delete(sessionId);
    this.servicePinCounts.delete(sessionId);
    this.reportCounts.delete(sessionId);
  }
}

export const liveAnalyticsService = new LiveAnalyticsService();
