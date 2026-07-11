# OmniChat — Architecture & Roadmap

Messaging app (VN-style UX) branded **OmniChat**. Stack: NestJS + MongoDB + Redis + MinIO | Flutter (Bloc) Android/iOS (+ Web later).

---

## 1. MVP vs Phase 2+

### Phase 1 — MVP (ship first)

| Priority | Feature |
|----------|---------|
| P0 | Auth: phone + OTP (mock), password fallback, JWT access + refresh (Redis), multi-device logout |
| P0 | User profile: displayName, avatar, bio, gender, dob |
| P0 | Contacts: search by phone, friend request accept/reject, block, friend list |
| P0 | Direct chat: text realtime (Socket.IO), conversation list, unread badge |
| P1 | Message status: sent / delivered / seen |
| P1 | Typing indicator |
| P1 | Media: image / file / voice (presigned upload → MinIO/R2) |
| P1 | Group chat: create, add/remove members, admin role, system messages |
| P1 | Reply, recall, delete-for-me, reaction, pin, forward |

### Phase 2+

- WebRTC 1-1 call + call history → group call later
- Story (24h), viewers, react/comment
- FCM push + per-conversation mute / quiet hours
- Privacy settings, E2E optional, chat backup
- Device contact sync, custom stickers, location share polish

**Build order:** Auth → 1-1 realtime → Group → Media → Call → Story → Notification.

---

## 2. Design system (Flutter)

**Brand:** OmniChat — primary blue `#1A7AE8` (not Zalo `#0068FF`), accent teal `#00B4A6`.

| Token | Light | Dark |
|-------|-------|------|
| primary | `#1A7AE8` | `#4DA3FF` |
| bubbleMine | `#1A7AE8` | `#1A7AE8` |
| bubbleOther | `#F1F3F5` | `#2A2D32` |
| background | `#F7F8FA` | `#0F1115` |
| surface | `#FFFFFF` | `#1A1D23` |
| online | `#22C55E` | `#22C55E` |

- Typography: Google Fonts **Be Vietnam Pro** (UI) + **Manrope** (display)
- Spacing: 4/8/12/16/24/32
- State management: **Bloc** (already in repo; clearer event→state for chat streams, matches clean-arch layers)

---

## 3. Backend layout

```
src/modules/
  auth/          OTP, login, refresh, sessions, JwtAuthGuard
  user/          profile CRUD
  contact/       friends / block
  conversation/  direct + group + members
  chat/          messages REST + ChatGateway (Socket.IO)
```

Infra already in `common/`: Mongo base repo, Redis, R2/S3, Pub/Sub, pagination, filters.

**Realtime:** NestJS Gateway (Socket.IO). Rooms: `user:{userId}`, `conversation:{id}`. Redis: presence + `socketId→userId` for multi-instance later.

**Message send pipeline:** validate → persist Message → update Conversation.lastMessage → emit `message:new` to room → enqueue push (Phase 2).

---

## 4. MongoDB schema (summary)

See entities under `src/modules/*/entities/`.

| Collection | Strategy | Key indexes |
|------------|----------|-------------|
| User | document | `phone` unique |
| Contact | edge doc (not embedded) — query both directions, status changes | `{userId,contactId}` unique, `{userId,status}` |
| Conversation | doc + `memberIds[]` denormalized for list queries | `{memberIds, lastMessageAt}` |
| ConversationMember | separate — per-user unread/mute/role | `{conversationId,userId}` unique |
| ChatMessage | separate (never embed) — unbounded growth | `{conversationId, createdAt}`, `{conversationId, _id}` |
| Story / CallLog | Phase 2 | `expiresAt` TTL on Story |

**Embed vs reference:** embed only bounded small arrays (`reactions[]`, `pinnedMessageIds[]`). Messages, members, contacts stay referenced.

---

## 5. REST API (MVP)

Base: `/api/v1`

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/public/auth/otp/request` | `{ phone }` → mock OTP logged |
| POST | `/public/auth/otp/verify` | `{ phone, otp, deviceId, deviceName }` → tokens + user |
| POST | `/public/auth/login` | `{ phone, password, deviceId, deviceName }` |
| POST | `/public/auth/refresh` | `{ refreshToken }` |
| POST | `/public/auth/register` | `{ phone, password, displayName, otp }` |

### Auth / User (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/logout` | revoke current device session |
| GET | `/auth/sessions` | list devices |
| DELETE | `/auth/sessions/:sessionId` | remote logout |
| GET | `/users/me` | profile |
| PATCH | `/users/me` | update profile |
| GET | `/users/search?phone=` | find by phone |

### Contacts

| Method | Path |
|--------|------|
| GET | `/contacts` |
| POST | `/contacts/request` `{ contactId }` |
| POST | `/contacts/:id/accept` |
| POST | `/contacts/:id/reject` |
| POST | `/contacts/:id/block` |
| DELETE | `/contacts/:id` |

### Conversations & messages

| Method | Path |
|--------|------|
| GET | `/conversations` |
| POST | `/conversations/direct` `{ peerUserId }` |
| POST | `/conversations/group` `{ name, memberIds[] }` |
| GET | `/conversations/:id/messages?cursor=&limit=` |
| POST | `/conversations/:id/messages` | fallback REST send |
| POST | `/conversations/:id/read` `{ lastReadMessageId }` |

Cursor pagination: `createdAt_id` descending; `cursor` = last seen `createdAt|id`.

---

## 6. WebSocket events

Namespace: `/chat`. Auth: `handshake.auth.token` (access JWT).

| Event | Direction | Payload |
|-------|-----------|---------|
| `message:send` | C→S | `{ conversationId, type, content, replyToMessageId?, clientMsgId? }` |
| `message:new` | S→C | full message + sender snapshot |
| `message:delivered` | S→C | `{ messageId, conversationId, userId }` |
| `message:seen` | C→S / S→C | `{ conversationId, lastReadMessageId }` |
| `message:recall` | C→S / S→C | `{ messageId, conversationId }` |
| `typing:start` / `typing:stop` | C→S / S→C | `{ conversationId, userId }` |
| `presence:update` | S→C | `{ userId, status: online\|offline, lastActiveAt }` |
| `conversation:updated` | S→C | conversation preview patch |

**Reconnect sync:** client sends `sync:pull { lastSyncAt }` → server returns missed messages / conversation deltas since timestamp.

---

## 7. Roadmap (weeks)

| Weeks | Focus |
|-------|-------|
| 1–2 | Docker (Mongo/Redis/MinIO), Auth OTP+JWT+sessions, User profile, Flutter shell + login |
| 3–4 | Contacts, conversation list, 1-1 text via WebSocket |
| 5–6 | Media upload, sent/delivered/seen, typing |
| 7–8 | Group, reaction, reply, recall, forward, pin |
| 9–10 | WebRTC signaling, FCM |
| 11+ | Story, dark mode polish, perf, tests |

---

## 8. Local run

```bash
# infra
docker compose up -d

# API
yarn install && yarn start:dev
# → http://localhost:8090/api/v1/public/health

# Flutter
cd ../c2d-omnichat-fe && flutter pub get && flutter run
```

Dev OTP: always `123456` (logged to server console). Replace `OtpService` with SMS provider later.
