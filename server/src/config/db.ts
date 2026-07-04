import mongoose from 'mongoose';
import { appConfig } from './app';
import logger from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export const connectDB = async (retries = MAX_RETRIES): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(appConfig.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info('MongoDB connected');

      return;
    } catch (error) {
      logger.error(`MongoDB connection failed (attempt ${attempt}/${retries})`, {
        error: (error as Error).message,
      });
      if (attempt === retries) {
        logger.error('All MongoDB connection retries exhausted. Exiting.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};
