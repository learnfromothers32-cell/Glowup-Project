import mongoose from 'mongoose';
import { appConfig } from '../config/app';
import logger from '../utils/logger';

interface MigrationRecord {
  name: string;
  appliedAt: Date;
}

const migrationRecordSchema = new mongoose.Schema<MigrationRecord>({
  name: { type: String, required: true, unique: true },
  appliedAt: { type: Date, default: Date.now },
});

const MigrationRecord = mongoose.model<MigrationRecord>('_Migration', migrationRecordSchema);

type MigrationFn = (db: mongoose.Mongoose) => Promise<void>;

const migrations: { name: string; up: MigrationFn }[] = [];

export function registerMigration(name: string, up: MigrationFn): void {
  migrations.push({ name, up });
}

function getDb(m: mongoose.Mongoose) {
  const db = m.connection.db;
  if (!db) throw new Error('Database not connected');
  return db;
}

export async function runMigrations(): Promise<void> {
  const applied = new Set(
    (await MigrationRecord.find({}).select('name').lean()).map((r: any) => r.name)
  );

  const pending = migrations.filter((m) => !applied.has(m.name));
  if (pending.length === 0) {
    logger.info('No pending migrations');
    return;
  }

  for (const migration of pending) {
    logger.info(`Running migration: ${migration.name}`);
    try {
      await migration.up(mongoose);
      await MigrationRecord.create({ name: migration.name });
      logger.info(`Migration applied: ${migration.name}`);
    } catch (err) {
      logger.error(`Migration failed: ${migration.name}`, { error: (err as Error).message });
      throw err;
    }
  }
}

export async function connectAndMigrate(): Promise<void> {
  await mongoose.connect(appConfig.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  logger.info('MongoDB connected for migrations');
  await runMigrations();
}

// ── Register migrations ──

registerMigration('add-availability-maxClientsPerSlot', async (m) => {
  const db = getDb(m);
  await db.collection('availabilities').updateMany(
    { maxClientsPerSlot: { $exists: false } },
    { $set: { maxClientsPerSlot: 1 } }
  );
});

registerMigration('add-availability-bufferMinutes', async (m) => {
  const db = getDb(m);
  await db.collection('availabilities').updateMany(
    { bufferMinutes: { $exists: false } },
    { $set: { bufferMinutes: 0 } }
  );
});

registerMigration('add-transaction-paymentRef-unique', async (m) => {
  const db = getDb(m);
  try {
    await db.collection('transactions').createIndex(
      { paymentRef: 1 },
      { unique: true, background: true }
    );
  } catch {
    // index may already exist
  }
});