# OmniChat Backend (`c2d-omnichat-be`)

NestJS API + Socket.IO for OmniChat. Architecture: [docs/OMNICHAT_ARCHITECTURE.md](./docs/OMNICHAT_ARCHITECTURE.md)

## Quick start

```bash
# 1) Infra
docker compose up -d

# 2) Env
cp .env.example .env

# 3) Run API
yarn install
yarn start:dev
```

- Health: `GET http://localhost:8090/api/v1/public/health`
- Auth OTP (dev code `123456`): `POST /api/v1/public/auth/otp/request`
- WebSocket: `ws://localhost:8090/chat` with `auth: { token: <accessToken> }`

## Modules (Phase 1)

| Module | Responsibility |
|--------|----------------|
| `auth` | OTP, password login, JWT + Redis sessions, multi-device revoke |
| `user` | Profile + phone search |
| `contact` | Friend request / accept / block |
| `conversation` | Direct + group threads |
| `chat` | Message history REST + realtime gateway |

## Scripts

```bash
yarn start:dev
yarn build
yarn test
yarn lint
```
