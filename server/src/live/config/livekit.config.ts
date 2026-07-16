/**
 * LiveKit Environment Configuration
 *
 * Validates required environment variables for self-hosted LiveKit.
 * No hardcoded secrets — all values come from environment.
 */

export interface LiveKitConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  turnServerUrl: string;
  turnUsername: string;
  turnPassword: string;
  provider: 'mock' | 'livekit';
}

/**
 * Read and validate LiveKit environment variables.
 * Throws a descriptive error if required vars are missing.
 */
export function getLiveKitConfig(): LiveKitConfig {
  const provider = (process.env.LIVE_PROVIDER || 'mock') as 'mock' | 'livekit';

  if (provider === 'mock') {
    return {
      url: '',
      apiKey: '',
      apiSecret: '',
      turnServerUrl: '',
      turnUsername: '',
      turnPassword: '',
      provider: 'mock',
    };
  }

  const url = process.env.LIVEKIT_URL || '';
  const apiKey = process.env.LIVEKIT_API_KEY || '';
  const apiSecret = process.env.LIVEKIT_API_SECRET || '';
  const turnServerUrl = process.env.TURN_SERVER_URL || '';
  const turnUsername = process.env.TURN_USERNAME || '';
  const turnPassword = process.env.TURN_PASSWORD || '';

  const missing: string[] = [];
  if (!url) missing.push('LIVEKIT_URL');
  if (!apiKey) missing.push('LIVEKIT_API_KEY');
  if (!apiSecret) missing.push('LIVEKIT_API_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `LiveKit provider is set to "livekit" but missing required environment variables: ${missing.join(', ')}. ` +
      `Set these in your .env file or Render dashboard. ` +
      `See LIVE_DEPLOYMENT.md for configuration details.`
    );
  }

  return {
    url,
    apiKey,
    apiSecret,
    turnServerUrl,
    turnUsername,
    turnPassword,
    provider,
  };
}

/**
 * Get the LiveKit WebSocket URL for client connections.
 * Returns the configured URL when using livekit provider, empty string for mock.
 * This avoids an unnecessary network health check just to read a static config value.
 */
export function getLiveKitUrl(): string {
  const config = getLiveKitConfig();
  return config.url;
}
