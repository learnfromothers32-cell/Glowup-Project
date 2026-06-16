import admin from 'firebase-admin';
import logger from '../utils/logger';

const initializeFirebase = () => {
  if (admin.apps.length > 0) return;

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (rawServiceAccount) {
    try {
      const serviceAccount = JSON.parse(rawServiceAccount);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('Firebase Admin initialized (service account)');
    } catch (error) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON', {
        error: (error as Error).message,
      });
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT format');
    }
  } else {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'startup-16d5b';
    admin.initializeApp({ projectId });
    logger.warn([
      'Firebase Admin initialized WITHOUT service account.',
      'Social login will use fallback HTTP verification (slower, ~1.4s latency).',
      'Set FIREBASE_SERVICE_ACCOUNT in .env for production performance.',
      `See: https://console.firebase.google.com/project/${projectId}/settings/serviceaccounts/adminsdk`,
    ].join(' '));
  }
};

export { admin, initializeFirebase };
