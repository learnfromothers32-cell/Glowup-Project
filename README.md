# GlowUp OS

A MERN-stack barber/stylist marketplace platform with live streaming, AI hairstyle generation, real-time booking, and POS capabilities.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Redis
- **Real-time**: Socket.io (WebRTC for live streaming)
- **Payments**: Paystack
- **AI**: HuggingFace inference (hairstyle generation)
- **Auth**: JWT (access + refresh tokens), Firebase Auth (social login)
- **Storage**: Firebase Storage / Cloudinary
- **Infrastructure**: Docker, Nginx

## Prerequisites

- Node.js >= 18
- MongoDB >= 6.0
- Redis >= 7.0 (optional — falls back to in-memory cache)
- Docker & Docker Compose (for production deployment)

## Setup

### 1. Clone & Install

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Environment Variables

Copy and fill in the required env files:

**Server** (`server/.env`):
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/glowup
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLIENT_URL=http://localhost:5173
```

**Client** (`client/.env`):
```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=/api
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxx
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run (Development)

```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

Server runs on `http://localhost:5000`, client on `http://localhost:5173`.

### 4. Seed Database

```bash
cd server && npm run seed
```

## Deployment

### Docker Compose

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Environment Variables (Production)

Set the following in your deployment environment:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `PAYSTACK_SECRET_KEY` | Paystack live secret key |
| `CLIENT_URL` | Client origin for CORS |
| `CLIENT_PORT` | Client container port (default 3000) |
| `NODE_ENV` | Set to `production` |

## API Rate Limits

| Limiter | Window | Max Requests | Applied To |
|---|---|---|---|
| Auth | 15 min | 50 | login, register, social-login, forgot-password, reset-password |
| General | 15 min | 100 | All write/mutating endpoints |

## Input Validation

All write endpoints validate request bodies using Zod schemas defined in `server/src/middleware/validate.ts`. Validation errors return HTTP 400 with comma-separated error messages.

## Security

- JWT access tokens stored in memory only (not localStorage)
- Refresh tokens stored in httpOnly cookies
- CSRF protection enabled (double-submit cookie pattern)
- CORS restricted to `CLIENT_URL` origin
- Helmet security headers (including CSP in production Nginx config)
- Rate limiting on all write endpoints
- Paystack webhook HMAC-SHA512 signature verification
- Password hashing via bcrypt (pre-save hook on User model)

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── api/          # API client functions
│   │   ├── components/   # Shared components
│   │   ├── context/      # Auth, theme contexts
│   │   ├── features/     # Feature-specific modules
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   └── utils/        # Utilities
│   └── nginx.conf        # Nginx config for prod
├── server/               # Express backend
│   ├── src/
│   │   ├── config/       # App config (env vars)
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/    # Auth, validation, rate limiting
│   │   ├── models/       # Mongoose schemas
│   │   ├── providers/    # AI providers (HuggingFace)
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Business logic
│   │   ├── socket/       # Socket.io handlers
│   │   └── utils/        # Helpers
│   └── seed/             # Database seed scripts
└── docker-compose.prod.yml
```

## Testing

```bash
cd server && npm test
```

## License

Private — All rights reserved.
