import Queue from 'bull';
import { appConfig } from '../config/app';
import { HairstyleJob } from '../models/HairstyleJob';
import { Hairstyle } from '../models/Hairstyle';
import { UserCredit } from '../models/UserCredit';
import { generateHairstylePreview } from '../services/hairstyleGeneration.service';
import { analyzeFace } from '../services/faceAnalysis.service';
import logger from '../utils/logger';
import fs from 'fs';

let hairstyleQueue: Queue.Queue | null = null;

export const getHairstyleQueue = (): Queue.Queue => {
  if (!hairstyleQueue) {
    hairstyleQueue = new Queue('hairstyle-generation', appConfig.redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
      limiter: {
        max: 10,
        duration: 1000,
      },
    });

    hairstyleQueue.process(async (job) => {
      const { jobId, hairstyleId } = job.data as { jobId: string; hairstyleId: string };

      const jobDoc = await HairstyleJob.findById(jobId);
      if (!jobDoc) throw new Error(`Job ${jobId} not found`);

      jobDoc.status = 'processing';
      await jobDoc.save();

      try {
        const hairstyle = await Hairstyle.findById(hairstyleId);
        if (!hairstyle) throw new Error('Hairstyle not found');

        const faceAnalysis = await analyzeFace(jobDoc.originalImage);

        const generation = await generateHairstylePreview({
          originalImage: jobDoc.originalImage,
          hairstyleId,
          templateImage: hairstyle.templateImage,
          faceLandmarks: faceAnalysis.landmarks,
        });

        jobDoc.faceShape = faceAnalysis.faceShape;
        jobDoc.resultImage = generation.imageUrl;
        jobDoc.hairstyleId = hairstyle._id;
        jobDoc.status = 'completed';
        await jobDoc.save();

        if (jobDoc.originalImage.startsWith('/uploads/')) {
          const localPath = jobDoc.originalImage;
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        }

        return { imageUrl: generation.imageUrl, faceShape: faceAnalysis.faceShape };
      } catch (error) {
        jobDoc.status = 'failed';
        jobDoc.error = (error as Error).message;
        await jobDoc.save();

        // Refund credit on failure
        try {
          if (jobDoc.userId) {
            const credit = await UserCredit.findOne({ userId: jobDoc.userId });
            if (credit) {
              credit.balance += 1;
              credit.transactions.push({
                type: 'refund',
                amount: 1,
                description: 'Refund for failed hairstyle generation',
                createdAt: new Date(),
              });
              await credit.save();
            }
          }
        } catch (refundErr) {
          logger.error('Failed to refund credit for failed job', {
            jobId: jobDoc._id,
            error: (refundErr as Error).message,
          });
        }

        throw error;
      }
    });

    hairstyleQueue.on('completed', (job) => {
      logger.info(`Hairstyle job ${job.id} completed`);
    });

    hairstyleQueue.on('failed', (job, error) => {
      logger.error(`Hairstyle job ${job.id} failed`, { error: error.message });
    });
  }

  return hairstyleQueue;
};

export const addHairstyleJob = async (data: {
  jobId: string;
  hairstyleId: string;
}) => {
  const queue = getHairstyleQueue();
  const job = await queue.add(data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
  return job;
};
