/**
 * Provider Factory
 *
 * Creates the appropriate LiveMediaProvider based on environment configuration.
 * LIVE_PROVIDER=mock → MockLiveMediaProvider (development/testing)
 * LIVE_PROVIDER=livekit → LiveKitMediaProvider (production)
 *
 * This is the ONLY place that switches providers. All other code depends
 * on the LiveMediaProvider interface only.
 */

import { LiveMediaProvider } from './types';
import { MockLiveMediaProvider } from './types';
import { LiveKitMediaProvider } from './LiveKitMediaProvider';
import { getLiveKitConfig, LiveKitConfig } from '../config/livekit.config';
import logger from '../../utils/logger';

let providerInstance: LiveMediaProvider | null = null;

/**
 * Get or create the media provider singleton.
 * Reads LIVE_PROVIDER from environment on first call.
 */
export function getMediaProvider(): LiveMediaProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const config = getLiveKitConfig();
  providerInstance = createProvider(config);

  logger.info('Media provider initialized', { provider: config.provider });

  return providerInstance;
}

/**
 * Create a provider from config. Used for testing and explicit injection.
 */
export function createProvider(config: LiveKitConfig): LiveMediaProvider {
  switch (config.provider) {
    case 'livekit':
      return new LiveKitMediaProvider(config);
    case 'mock':
    default:
      return new MockLiveMediaProvider();
  }
}

/**
 * Reset the singleton. Used in tests.
 */
export function resetMediaProvider(): void {
  providerInstance = null;
}
