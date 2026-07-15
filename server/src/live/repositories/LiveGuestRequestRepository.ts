/**
 * Live Guest Request Repository
 *
 * Handles guest request CRUD for the join-as-guest workflow.
 */

import { Types } from 'mongoose';
import { LiveGuestRequest, GuestRequestStatus } from '../models/LiveGuestRequest';
import logger from '../../utils/logger';

export interface CreateGuestRequestInput {
  sessionId: string;
  viewerId: string;
  displayName: string;
  reason?: string;
}

export class LiveGuestRequestRepository {
  async findById(id: string) {
    return LiveGuestRequest.findById(id);
  }

  async findBySessionAndViewer(sessionId: string, viewerId: string) {
    return LiveGuestRequest.findOne({
      sessionId: new Types.ObjectId(sessionId),
      viewerId: new Types.ObjectId(viewerId),
    });
  }

  async findPendingBySession(sessionId: string) {
    return LiveGuestRequest.find({
      sessionId: new Types.ObjectId(sessionId),
      status: 'pending',
    }).sort({ createdAt: 1 });
  }

  async findAllBySession(sessionId: string, status?: GuestRequestStatus) {
    const query: any = { sessionId: new Types.ObjectId(sessionId) };
    if (status) query.status = status;
    return LiveGuestRequest.find(query).sort({ createdAt: -1 });
  }

  async create(input: CreateGuestRequestInput) {
    const request = new LiveGuestRequest({
      sessionId: new Types.ObjectId(input.sessionId),
      viewerId: new Types.ObjectId(input.viewerId),
      displayName: input.displayName,
      reason: input.reason,
      status: 'pending',
    });
    await request.save();
    return request;
  }

  async updateStatus(
    id: string,
    status: GuestRequestStatus,
    respondedBy?: string
  ) {
    return LiveGuestRequest.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          respondedBy: respondedBy ? new Types.ObjectId(respondedBy) : undefined,
          respondedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  async cancelByViewer(sessionId: string, viewerId: string) {
    return LiveGuestRequest.findOneAndUpdate(
      {
        sessionId: new Types.ObjectId(sessionId),
        viewerId: new Types.ObjectId(viewerId),
        status: 'pending',
      },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
  }

  async countBySession(sessionId: string, status?: GuestRequestStatus) {
    const query: any = { sessionId: new Types.ObjectId(sessionId) };
    if (status) query.status = status;
    return LiveGuestRequest.countDocuments(query);
  }

  async deleteMany(sessionId: string) {
    return LiveGuestRequest.deleteMany({
      sessionId: new Types.ObjectId(sessionId),
    });
  }
}

export const liveGuestRequestRepository = new LiveGuestRequestRepository();
