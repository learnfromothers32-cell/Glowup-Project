import { Request, Response } from 'express';

jest.mock('../../middleware/asyncHandler', () => ({
  asyncHandler: (handler: Function) => (req: any, res: any, next: any) =>
    Promise.resolve(handler(req, res, next)).catch(next),
}));

jest.mock('../../utils/apiResponse', () => ({
  sendSuccess: jest.fn().mockImplementation((_res: any, data: any, message: string, status = 200) => {
    _res.status(status).json({ success: true, message, data });
  }),
}));

const mockServiceMethods = {
  createSession: jest.fn(),
  discoverSessions: jest.fn(),
  getSessionById: jest.fn(),
  updateSession: jest.fn(),
  deleteSession: jest.fn(),
  startSession: jest.fn(),
  endSession: jest.fn(),
  pauseSession: jest.fn(),
  resumeSession: jest.fn(),
  getSessionStatus: jest.fn(),
  getFeaturedSessions: jest.fn(),
};

jest.mock('../services/LiveSessionService', () => ({
  LiveSessionService: jest.fn().mockImplementation(() => mockServiceMethods),
}));

jest.mock('../providers/factory', () => ({
  getMediaProvider: jest.fn().mockReturnValue({}),
}));

jest.mock('../config/livekit.config', () => ({
  getLiveKitUrl: jest.fn().mockReturnValue('wss://test.livekit.cloud'),
}));

jest.mock('../providers/types', () => ({
  MockLiveMediaProvider: jest.fn(),
}));

import {
  createSession,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  startSession,
  endSession,
  pauseSession,
  resumeSession,
  getSessionStatus,
  getFeaturedSessions,
} from '../controllers/LiveSessionController';

const SESSION_ID = '507f191e810c19729de860ef';
const USER_ID = '507f191e810c19729de860ee';

function fakeReq(overrides: any = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    user: { id: USER_ID, role: 'stylist' },
    ...overrides,
  };
}

function fakeRes(): any {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createSession', () => {
  it('should create a session and return 201', async () => {
    const mockSession = { _id: SESSION_ID, title: 'Test Session', status: 'scheduled' };
    mockServiceMethods.createSession.mockResolvedValue(mockSession);

    const res = fakeRes();
    await createSession(fakeReq({ body: { title: 'Test Session', category: 'beauty' } }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.session).toEqual(mockSession);
  });

  it('should throw when no userId', async () => {
    const next = jest.fn();
    await createSession(fakeReq({ user: undefined }), fakeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});

describe('getSessions', () => {
  it('should return sessions with filters', async () => {
    const mockSessions = [{ _id: SESSION_ID, title: 'Live Session' }];
    mockServiceMethods.discoverSessions.mockResolvedValue(mockSessions);

    const res = fakeRes();
    await getSessions(fakeReq({ query: { category: 'beauty', sort: 'trending', limit: '10' } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.sessions).toEqual(mockSessions);
  });
});

describe('getSessionById', () => {
  it('should return session details', async () => {
    const mockSession = { _id: SESSION_ID, title: 'Test Session' };
    mockServiceMethods.getSessionById.mockResolvedValue(mockSession);

    const res = fakeRes();
    await getSessionById(fakeReq({ params: { id: SESSION_ID } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.session).toEqual(mockSession);
  });
});

describe('updateSession', () => {
  it('should update session and return success', async () => {
    const mockSession = { _id: SESSION_ID, title: 'Updated Title' };
    mockServiceMethods.updateSession.mockResolvedValue(mockSession);

    const res = fakeRes();
    await updateSession(fakeReq({ params: { id: SESSION_ID }, body: { title: 'Updated Title' } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.session).toEqual(mockSession);
  });

  it('should throw when no userId', async () => {
    const next = jest.fn();
    await updateSession(fakeReq({ params: { id: SESSION_ID }, user: undefined }), fakeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('deleteSession', () => {
  it('should delete session and return success', async () => {
    mockServiceMethods.deleteSession.mockResolvedValue(undefined);

    const res = fakeRes();
    await deleteSession(fakeReq({ params: { id: SESSION_ID } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
  });

  it('should throw when no userId', async () => {
    const next = jest.fn();
    await deleteSession(fakeReq({ params: { id: SESSION_ID }, user: undefined }), fakeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('startSession', () => {
  it('should start session and return token', async () => {
    const mockResult = { session: { _id: SESSION_ID, status: 'live' }, token: 'mock-token' };
    mockServiceMethods.startSession.mockResolvedValue(mockResult);

    const res = fakeRes();
    await startSession(fakeReq({ params: { id: SESSION_ID } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.token).toBe('mock-token');
    expect(body.data.liveKitUrl).toBe('wss://test.livekit.cloud');
  });

  it('should throw when no userId', async () => {
    const next = jest.fn();
    await startSession(fakeReq({ params: { id: SESSION_ID }, user: undefined }), fakeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('endSession', () => {
  it('should end session and return updated session', async () => {
    const mockSession = { _id: SESSION_ID, status: 'ended' };
    mockServiceMethods.endSession.mockResolvedValue(mockSession);

    const res = fakeRes();
    await endSession(fakeReq({ params: { id: SESSION_ID } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.session.status).toBe('ended');
  });

  it('should throw when no userId', async () => {
    const next = jest.fn();
    await endSession(fakeReq({ params: { id: SESSION_ID }, user: undefined }), fakeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('pauseSession', () => {
  it('should pause session', async () => {
    const mockSession = { _id: SESSION_ID, status: 'paused' };
    mockServiceMethods.pauseSession.mockResolvedValue(mockSession);

    const res = fakeRes();
    await pauseSession(fakeReq({ params: { id: SESSION_ID } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.session.status).toBe('paused');
  });

  it('should throw when no userId', async () => {
    const next = jest.fn();
    await pauseSession(fakeReq({ params: { id: SESSION_ID }, user: undefined }), fakeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('resumeSession', () => {
  it('should resume session', async () => {
    const mockSession = { _id: SESSION_ID, status: 'live' };
    mockServiceMethods.resumeSession.mockResolvedValue(mockSession);

    const res = fakeRes();
    await resumeSession(fakeReq({ params: { id: SESSION_ID } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.session.status).toBe('live');
  });

  it('should throw when no userId', async () => {
    const next = jest.fn();
    await resumeSession(fakeReq({ params: { id: SESSION_ID }, user: undefined }), fakeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('getSessionStatus', () => {
  it('should return session status', async () => {
    const mockStatus = { _id: SESSION_ID, status: 'live', viewerCount: 42 };
    mockServiceMethods.getSessionStatus.mockResolvedValue(mockStatus);

    const res = fakeRes();
    await getSessionStatus(fakeReq({ params: { id: SESSION_ID } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.status).toBe('live');
  });
});

describe('getFeaturedSessions', () => {
  it('should return featured sessions', async () => {
    const mockSessions = [{ _id: SESSION_ID, title: 'Featured' }];
    mockServiceMethods.getFeaturedSessions.mockResolvedValue(mockSessions);

    const res = fakeRes();
    await getFeaturedSessions(fakeReq({ query: { limit: '5' } }), res, jest.fn());

    expect(res.json).toHaveBeenCalled();
    const body = res.json.mock.calls[0][0];
    expect(body.data.sessions).toEqual(mockSessions);
  });
});
