import http from 'http';
import cron from 'node-cron';
import app from './app';
import { appConfig } from './config/app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initializeFirebase } from './config/firebase';
import { prewarmFirebaseKeys } from './utils/firebase-verify';
import { initSocket } from './socket';
import { syncRedisEngagementToMongo } from './services/trending.service';
import logger from './utils/logger';

const server = http.createServer(app);

server.timeout = 30000;

const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
];
const MISSING_VARS = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (MISSING_VARS.length > 0) {
  logger.error(`Missing required environment variables: ${MISSING_VARS.join(', ')}`);
  process.exit(1);
}

const start = async () => {
  await connectDB();
  await connectRedis();
  initializeFirebase();

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    prewarmFirebaseKeys();
  }

  if (!appConfig.hfToken) {
    logger.warn('HF_TOKEN is not set — AI hairstyle generation will use template overlay (returns original image). Set HF_TOKEN in .env for AI-powered generation.');
  }

  initSocket(server);

  cron.schedule('*/5 * * * *', () => {
    syncRedisEngagementToMongo().catch((err) =>
      logger.error('Failed to sync Redis engagement to MongoDB', { error: (err as Error).message }),
    );
  });

  server.listen(appConfig.port, '0.0.0.0', () => {
    logger.info(`Server running on port ${appConfig.port}`);
    logger.info(`Environment: ${appConfig.env}`);
  });
};

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  const forceKillTimer = setTimeout(() => {
    logger.error('Forced shutdown after 10s timeout — some requests may have been terminated');
    process.exit(1);
  }, 10000);

  forceKillTimer.unref();

  server.close(() => {
    logger.info('HTTP server closed');
  });

  const mongoose = await import('mongoose');
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');

  clearTimeout(forceKillTimer);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
