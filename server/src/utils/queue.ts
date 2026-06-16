import { getIO } from '../socket';

export interface QueueEntryPublic {
  userId: any;
  position: number;
  status: string;
  estimatedServiceMins: number;
  estimatedWaitMins: number;
  joinedAt: Date;
}

export interface QueuePublic {
  id: any;
  stylistId: any;
  currentPosition: number;
  predictedWaitMins: number;
  avgServiceDuration: number;
  lastUpdated: Date;
  entries: QueueEntryPublic[];
}

export function toPublicQueue(queue: any): QueuePublic {
  return {
    id: queue._id || queue.id,
    stylistId: queue.stylistId,
    currentPosition: queue.currentPosition,
    predictedWaitMins: queue.predictedWaitMins,
    avgServiceDuration: queue.avgServiceDuration,
    lastUpdated: queue.lastUpdated,
    entries: queue.entries
      .filter((e: any) => e.status !== 'done' && e.status !== 'skipped')
      .map((e: any) => ({
        userId: e.userId,
        position: e.position,
        status: e.status,
        estimatedServiceMins: e.estimatedServiceMins,
        estimatedWaitMins: e.estimatedWaitMins ?? 0,
        joinedAt: e.joinedAt,
      })),
  };
}

export function emitQueueUpdate(stylistId: string, queue: any) {
  try {
    const nsp = getIO().of('/queue');
    nsp.to(`queue:${stylistId}`).emit('queue:update', toPublicQueue(queue));
  } catch {
    // socket not initialized
  }
}
