import { getLiveKitConfig } from '../config/livekit.config';

describe('LiveKit Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getLiveKitConfig', () => {
    it('should return mock config when LIVE_PROVIDER is not set', () => {
      delete process.env.LIVE_PROVIDER;
      const config = getLiveKitConfig();
      expect(config.provider).toBe('mock');
      expect(config.url).toBe('');
      expect(config.apiKey).toBe('');
      expect(config.apiSecret).toBe('');
    });

    it('should return mock config when LIVE_PROVIDER=mock', () => {
      process.env.LIVE_PROVIDER = 'mock';
      const config = getLiveKitConfig();
      expect(config.provider).toBe('mock');
    });

    it('should return livekit config with all env vars set', () => {
      process.env.LIVE_PROVIDER = 'livekit';
      process.env.LIVEKIT_URL = 'http://localhost:7880';
      process.env.LIVEKIT_API_KEY = 'testApiKey';
      process.env.LIVEKIT_API_SECRET = 'testApiSecret';
      process.env.TURN_SERVER_URL = 'turn:turn.example.com:3478';
      process.env.TURN_USERNAME = 'turnuser';
      process.env.TURN_PASSWORD = 'turnpass';

      const config = getLiveKitConfig();
      expect(config.provider).toBe('livekit');
      expect(config.url).toBe('http://localhost:7880');
      expect(config.apiKey).toBe('testApiKey');
      expect(config.apiSecret).toBe('testApiSecret');
      expect(config.turnServerUrl).toBe('turn:turn.example.com:3478');
      expect(config.turnUsername).toBe('turnuser');
      expect(config.turnPassword).toBe('turnpass');
    });

    it('should throw when LIVE_PROVIDER=livekit but LIVEKIT_URL is missing', () => {
      process.env.LIVE_PROVIDER = 'livekit';
      delete process.env.LIVEKIT_URL;
      process.env.LIVEKIT_API_KEY = 'key';
      process.env.LIVEKIT_API_SECRET = 'secret';

      expect(() => getLiveKitConfig()).toThrow('LIVEKIT_URL');
    });

    it('should throw when LIVE_PROVIDER=livekit but LIVEKIT_API_KEY is missing', () => {
      process.env.LIVE_PROVIDER = 'livekit';
      process.env.LIVEKIT_URL = 'http://localhost:7880';
      delete process.env.LIVEKIT_API_KEY;
      process.env.LIVEKIT_API_SECRET = 'secret';

      expect(() => getLiveKitConfig()).toThrow('LIVEKIT_API_KEY');
    });

    it('should throw when LIVE_PROVIDER=livekit but LIVEKIT_API_SECRET is missing', () => {
      process.env.LIVE_PROVIDER = 'livekit';
      process.env.LIVEKIT_URL = 'http://localhost:7880';
      process.env.LIVEKIT_API_KEY = 'key';
      delete process.env.LIVEKIT_API_SECRET;

      expect(() => getLiveKitConfig()).toThrow('LIVEKIT_API_SECRET');
    });

    it('should throw listing all missing vars when multiple are missing', () => {
      process.env.LIVE_PROVIDER = 'livekit';
      delete process.env.LIVEKIT_URL;
      delete process.env.LIVEKIT_API_KEY;
      delete process.env.LIVEKIT_API_SECRET;

      expect(() => getLiveKitConfig()).toThrow('LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET');
    });
  });
});
