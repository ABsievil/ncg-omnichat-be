# OmniChat — Kế hoạch vá lỗ hổng & hoàn thiện Track A

> **Phiên bản:** 1.0 · **Ngày:** 2026-09-09 · **Repo:** `ncg-omnichat-be`
> **Nguồn:** [`GO_TO_MARKET_VN.md`](./GO_TO_MARKET_VN.md) mục 1.3, 4, 5.1, 7, 13.
> **Phạm vi:** backend NestJS + hợp đồng API cho FE. Việc FE/landing/pháp lý ghi ở cột “Ngoài BE”.
> **Mục tiêu:** đủ điều kiện thu tiền (P0) — cách ly tenant, persona/KB theo shop, an toàn bot, hạn mức, OTP thật, deploy.

---

## 0. Cách đọc tài liệu này

| Cột | Ý nghĩa |
|-----|---------|
| **Wave** | Thứ tự triển khai. Wave sau phụ thuộc wave trước. Không nhảy wave. |
| **ID** | Trùng backlog GTM mục 13 (`SEC-*`, `BOT-*`, `BIL-*`, `OPS-*`). |
| **Làm ngay** | Không chờ founder chốt (mục 17 GTM). |
| **Chặn ngoài** | Cần quyết định giá / cổng thanh toán / nhà OTP / domain — BE vẫn scaffold được bằng stub. |

**Nguyên tắc code** (bắt buộc, xem `.cursor/rules`):

- Enum → `enums/`, const/map i18n → `constants/`, shape → `interfaces/`, throw/validate → `errors/*.error.ts`.
- **Một module = một service.** Logic phức tạp đặt controller hoặc method private trong service hiện có. Worker inbound = “controller” của pipeline bot.
- Service **không** inject service module khác. Service cần thiết truyền qua **param** từ controller/worker. Ngoại lệ hiện hữu (`AuthService`→`ShopService`, `OmnichatBotService`→`ZaloService`/`AiAgentService`) **không nhân rộng**; wave mới đi theo quy tắc.
- i18n: thêm key **cả** `src/languages/vi/` và `en/`.
- Lỗi nhiều field: `data.missing` + `data.errors`, không chỉ 1 message chung.

**Không làm trong Track A:** inbox hợp nhất, Zalo OA, Facebook, đa chi nhánh, broadcast/ZNS, CRM pipeline. Đó là Track B (P2).

---

## 1. Hiện trạng đã xác nhận trong code (2026-09-09)

| Lỗ hổng GTM | Bằng chứng | Ảnh hưởng |
|-------------|------------|-----------|
| **G1** Route `/admin/*` không tenant/role | `ShopAdminController` / `ZaloAdminController` chỉ `@Response`. Toàn repo **không có** `RolesGuard`. JWT đã có `shopId` + `role` nhưng không dùng để lọc. | User A list/sửa/xoá shop B, disconnect Zalo B, `POST /admin/zalo/send` từ nick B |
| **G2** History không theo shop | `ZaloChatHistoryEntity` thiếu `shopId`. `getHistory(userId)` / `saveHistoryPair` không ghi shop | Cùng Zalo userId nhắn 2 shop → trộn ngữ cảnh |
| **G3** Persona/KB hard-code SmartGo | `AI_AGENT_SYSTEM_PROMPT`, tool mô tả “SmartGo”, `ZILLIZ_COLLECTION=smart_go_knowledge_v5`, `KnowledgeService.search()` không filter shop | Không bán shop thứ 2 |
| **G4** Không pause khi chủ trả lời | `handleIncomingMessage` `if (message.isSelf) return` — không ghi Redis pause | Bot + chủ cùng trả lời |
| **G5** Không hạn mức | Không entity/counter | Không định giá |
| **G6** OTP mock, JWT mặc định, CORS `*` | `OtpService` luôn `logger.log` mock; `JwtAuthGuard` fallback `'omnichat-default-secret'`; `CORS_ORIGIN=*`; `AppEnvDto` gần như rỗng | Không mở đăng ký công khai |

**Đã có, tái dùng:** JWT payload `shopId`/`role`; đăng ký tự tạo shop (`ensureUserShopAndRole`); QR SSE; worker listener + Redis pub/sub renew/disable; pipeline bot (stop keyword, history 10, AI, quote/@mention); fallback AI lỗi (1 câu tiếng Việt); throttle global 100/60s.

**Thiếu hạ tầng deploy BE:** không `Dockerfile`, không CI, `docker-compose.yml` chỉ mongo/redis/minio local, không `migrate-mongo`.

---

## 2. Quyết định kiến trúc (chốt để code, không bàn lại mỗi PR)

### 2.1 Tenant model Track A

```
User 1-1 Shop (đã có: users.shopId, JWT.shopId)
Shop 1-1 Zalo session (zalo_sessions.shopId unique)  — giữ đến P1 Pro (nhiều Zalo)
Shop 1-1 bot_profile
Shop 1-n knowledge_items (Mongo = nguồn sự thật; Zilliz = vector)
Shop 1-1 subscription + 1-n usage_monthly
```

- User đăng ký → `role = owner` (hiện đang `user` — sửa trong Wave 0). `ENUM_USER_ROLE.ADMIN` = admin hệ thống, `shopId = null`, được list mọi shop.
- Mọi route `/admin/*` (trừ health) bắt JWT + tenant.
- `shopId` **không tin query/body** với non-admin: luôn lấy từ JWT. Admin mới được truyền `shopId`.

### 2.2 Guard

| Guard | Việc |
|-------|------|
| `JwtAuthGuard` (đã global) | Bỏ fallback secret. Production thiếu `HELPER_JWT_SECRET_KEY` → **fail-fast** lúc bootstrap |
| `RolesGuard` + `@Roles(...)` | Gắn theo endpoint. Mặc định `/admin/*`: `owner` \| `manager` \| `admin` |
| `TenantGuard` | Resolve `request.tenantShopId`. Non-admin: = `user.shopId` (403 nếu null). Nếu param/query/body `shopId` khác JWT → 403. Admin: dùng query/body/param, bắt buộc có khi thao tác 1 shop |

`POST /admin/zalo/send`: **chỉ `ADMIN`** + throttle riêng (GTM: ẩn khỏi FE, nội bộ/test).

### 2.3 Bot inbound pipeline (thứ tự mới)

Worker vẫn gọi `OmnichatBotService.handleIncomingMessage(raw, shopId)`. Service này là orchestrator inbound (tương đương controller). Các bước **trong cùng method**, service khác truyền qua param từ worker **hoặc** đọc Redis/entity trực tiếp qua repository của chính module — **không** inject `BillingService` / `BotProfileService` vào `OmnichatBotService`.

Cách làm đúng convention:

- Worker (`zalo-listener.service.ts`) inject `OmnichatBotService` + `BotProfileService` + `BillingService` (worker = orchestrator).
- `handleIncomingMessage` nhận thêm `profile` + `quota` (plain object / interface), không gọi service lạ.

```
tin vào
  → parse/normalize
  → isSelf? → SET Redis pause:{shopId}:{threadId} TTL 45 phút → return
  → thread đang pause? → return
  → profile.enabled === false? → return
  → ngoài workingHours? → return (không gửi gì)
  → nhóm mà không @/gọi tên? → return (giữ như hiện tại)
  → replyToStrangers === false và chưa từng chat? → gửi 1 câu chào (nếu chưa gửi) → return
  → rate limit thread (1 reply / 5s) hoặc shop (N/phút) vượt? → enqueue hoặc drop + log
  → quota tháng hết? → gửi fallbackMessage (không gọi AI) → return
  → stop keyword? → gửi blocked → return
  → delay random 2–6s + sendTypingEvent
  → getHistory(shopId, userId)
  → AI (persona + KB filter shopId)
  → gửi reply (+ watermark gói Free nếu tin đầu ngày)
  → INCR usage Redis + ghi history (có shopId)
```

### 2.4 Persona — module `bot-profile` (không nhồi vào `shops`)

Collection `bot_profiles`, unique `shopId`. Tạo mặc định khi `ensureUserShopAndRole`.

| Field | Mặc định | Ghi chú |
|-------|----------|---------|
| `botName` | tên shop | Dùng trong prompt + match @nhóm |
| `tone` | `friendly` | enum: `friendly` \| `formal` \| `playful` |
| `systemPromptExtra` | `''` | Đoạn thêm, max ~2000 ký tự |
| `fallbackMessage` | i18n mặc định | Khi AI lỗi / hết quota / ngoài giờ (nếu shop chọn trả lời) |
| `workingHours` | `{ enabled: false, timezone: 'Asia/Ho_Chi_Minh', start: '00:00', end: '24:00' }` | |
| `replyToStrangers` | `true` | |
| `pauseMinutes` | `45` | TTL pause-on-owner-reply |
| `enabled` | `true` | Tắt bot toàn shop |
| `mutedThreadIds` | `[]` | Tắt bot theo khách (FE-02) |
| `zaloRiskAcceptedAt` | `null` | Bắt tick cảnh báo trước QR |

Prompt = **template** (không còn chữ SmartGo) + `botName` + `tone` + `systemPromptExtra`. Tool `knowledge_base` mô tả theo shop, luôn truyền `shopId`.

SmartGo = 1 shop nội bộ, nạp KB riêng — không hard-code.

### 2.5 Kiến thức — Mongo nguồn sự thật + Zilliz vector, filter `shopId`

- Collection Mongo `knowledge_items`: `shopId`, `type` (`faq` \| `product` \| `text`), `title`, `body`, `source` (`manual` \| `csv` \| `faq`), `chunkIndex`, `vectorId`, `status`.
- Zilliz: **một** collection mới `omnichat_knowledge_v1` (không dùng `smart_go_knowledge_v5` cho shop mới). Scalar `shopId` + filter `shopId == "{id}"`. Partition key `shopId` nếu Zilliz plan cho phép; không thì filter expr.
- Ingest: text / FAQ JSON / CSV sản phẩm (cột tối thiểu `name,price,note`) → chunk → embed → upsert. Xoá mục → xoá vector.
- Hạn mức số mục theo gói (Free 20 / Starter 200 / Pro+ unlimited hợp lý) kiểm ở controller trước ingest.

### 2.6 Billing — module `billing`

| Collection | Vai trò |
|------------|---------|
| `plans` | Seed: Free / Starter / Pro / Business. Field: `code`, `priceMonthly`, `priceYearly`, `aiRepliesPerMonth`, `maxZalo`, `maxKnowledgeItems`, `historyDays`, `features[]` |
| `subscriptions` | `shopId` unique, `planCode`, `status` (`trialing` \| `active` \| `past_due` \| `canceled`), `periodStart/End`, `provider`, `externalPaymentId` |
| `usage_monthly` | `{ shopId, yearMonth }`, `aiReplies`, `tokensIn/Out` (nếu đo được), snapshot từ Redis |
| `payments` | Lịch sử QR/webhook (Wave 3) |

Redis: `usage:{shopId}:{YYYY-MM}` INCR mỗi reply AI thành công. TTL ~40 ngày. Cron 00:05 timezone VN flush vào Mongo.

Shop mới → gói **Free**. Vượt hạn mức → không gọi LLM, gửi `fallbackMessage` (hoặc câu cố định “shop sẽ phản hồi sau”). Cảnh báo 80%/100% — Wave 3 (FCM/email); Wave 2 chỉ flag `quotaWarning` trên GET usage.

Cổng thanh toán: **scaffold webhook + interface**, adapter `payos` hoặc `sepay` sau khi founder chốt. Chưa chốt thì chỉ admin `PATCH` gói (nội bộ founding members).

### 2.7 OTP

Giữ `OtpService` một file. Strategy:

- `NODE_ENV !== production` **và** `AUTH_DEV_OTP_CODE` set → mock + log.
- Production: **cấm** mock. Thiếu provider config → fail-fast. Provider SMS (eSMS/SpeedSMS) sau `IOtpProvider`; tạm thời interface + impl `LogOtpProvider` chỉ non-prod.

Rate: 5 OTP / SĐT / ngày (Redis `auth:otp:daily:{phone}`), throttle IP 10/phút cho `/public/auth/otp/*`.

---

## 3. Lộ trình theo wave

Ước lượng **1 backend** full-time. 2 người: wave 0 song song với 1 người làm SEC, 1 người làm BOT-01 + BOT-05.

```
Wave 0  ████████  Chặn go-live an ninh + tách history     ~3.5 ngày
Wave 1  ████████████  Persona + an toàn bot (G3/G4)       ~4 ngày
Wave 2  ████████████████  KB theo shop + conversations     ~6 ngày
Wave 3  ████████████  Hạn mức + gói (thu tiền tối thiểu)   ~4 ngày
Wave 4  ████████  OTP prod + env + Docker/CI + worker HA   ~4 ngày
                                                    Tổng P0 BE ≈ 4–5 tuần
```

FE (repo khác) bám wave 1–3: settings persona, FAQ, lịch sử, plans. Wizard 5 bước (P0-10) cần API wave 0–2 xong.

---

## 4. Wave 0 — Chặn tuyệt đối trước khách thứ 2

**Mục tiêu:** user A không đụng shop B; history không trộn; secret/CORS không mở production bằng mặc định.

### 4.1 SEC-01 Tenant + role (`/admin/*`)

**Sửa / tạo**

| File | Việc |
|------|------|
| `src/modules/auth/decorators/roles.decorator.ts` | `@Roles(...ENUM_USER_ROLE)` |
| `src/modules/auth/guards/roles.guard.ts` | Đọc reflector; thiếu role → 403 `auth.error.forbidden` |
| `src/modules/auth/guards/tenant.guard.ts` | Gán `request.tenantShopId`; so khớp param/query/body |
| `src/modules/auth/decorators/tenant-shop.decorator.ts` | `@TenantShopId()` |
| `src/common/request/interfaces/request.interface.ts` | Thêm `tenantShopId?` |
| `src/modules/auth/errors/auth.error.ts` | `throwForbidden`, `throwShopRequired` |
| `src/languages/{vi,en}/auth.json` | `error.forbidden`, `error.shopRequired`, `error.crossShop` |
| `src/modules/shop/controllers/shop.admin.controller.ts` | Guard + list theo tenant; create gắn user.shopId nếu chưa có |
| `src/modules/zalo/controllers/zalo.admin.controller.ts` | Bỏ tin `shopId` query với non-admin; `send` chỉ ADMIN |
| `src/modules/shop/services/shop.service.ts` | `listByShopId`, không `list()` all cho owner |
| `src/router/routes/routes.admin.module.ts` | `APP_GUARD` Roles+Tenant **trong module admin** (không đụng `/public`, `/users`) |
| `src/modules/auth/services/auth.service.ts` | `ensureUserShopAndRole`: `role = OWNER` |
| `src/modules/user/enums/user.status-code.enum.ts` (nếu chưa) | Mã 403 thống nhất |

**API sau khi sửa**

| Method | Path | Owner | Admin hệ thống |
|--------|------|-------|----------------|
| GET | `/admin/shops` | Chỉ shop JWT | Tất cả |
| GET/PATCH/DELETE | `/admin/shops/:shopId` | 403 nếu khác JWT | OK |
| GET | `/admin/zalo/sessions` | Chỉ session shop mình | `?shopId=` tuỳ chọn |
| SSE | `/admin/zalo/login-qr` | `shopId` JWT, **bỏ** query shopId non-admin | Được chỉ định shop |
| POST | `/admin/zalo/send` | **403** | OK + throttle |

**Xong khi:** test (supertest hoặc spec guard): user A `GET /admin/shops/{B}` → 403; `GET /admin/zalo/sessions?shopId=B` → 403; admin vẫn list all.

### 4.2 SEC-02 JWT secret + `AppEnvDto` fail-fast

| File | Việc |
|------|------|
| `src/app/dtos/app-env.dto.ts` | Bắt buộc production: `HELPER_JWT_SECRET_KEY` (min 32), `CORS_ORIGIN` ≠ `*`, `ENCRYPTION_AES_KEY` 32 byte nếu AES on, `DASHSCOPE_API_KEY`, `ZILLIZ_*`, `REDIS_URL`, `DATABASE_URL`. Cấm `AUTH_DEV_OTP_CODE` khi `NODE_ENV=production` |
| Bootstrap (`main.ts` hoặc `ConfigModule.validate`) | `plainToInstance(AppEnvDto)` + `validateSync` → throw rõ tên biến |
| `src/modules/auth/guards/jwt.auth.guard.ts` | Xoá `'omnichat-default-secret'` |
| `.env.example` | Comment: production phải generate 64-byte; CORS whitelist |

**Xong khi:** start production thiếu JWT → process exit ≠ 0, log tên env.

### 4.3 SEC-03 CORS + `x-lang`

| File | Việc |
|------|------|
| `src/configs/middleware.config.ts` | Production: `CORS_ORIGIN=*` hoặc `true` → **throw** (không silent allow all) |
| Header ngôn ngữ | Rà `Accept-Language` vs `x-lang`; thống nhất 1 header (GTM: `x-lang`), giữ tương thích đọc cả hai trong 1 sprint |

### 4.4 SEC-04 Throttle route-level

| Route | Limit |
|-------|-------|
| `POST /public/auth/otp/request` | 10/phút/IP **và** 5/SĐT/ngày |
| `POST /public/auth/otp/verify`, `register`, `login` | 10/phút/IP |
| `POST /admin/zalo/send` | 20/phút/user |

Dùng `@Throttle` của `@nestjs/throttler` (đã global). Key OTP ngày trong `OtpService` + Redis.

### 4.5 BOT-01 `shopId` trên lịch sử chat

| File | Việc |
|------|------|
| `entities/zalo-chat-history.entity.ts` | `shopId` required + index `{ shopId, userId, timestamp: -1 }`, `{ shopId, threadId, timestamp: -1 }` |
| `omnichat-bot.service.ts` | `getHistory(shopId, userId)`, `saveHistoryPair` ghi `shopId` |
| Script one-shot `src/scripts/backfill-chat-history-shop.ts` **hoặc** migration | Gán shop mặc định cho bản ghi cũ (SmartGo). Không đoán: nếu nhiều shop, bản ghi không gán được → để `shopId` sentinel và **loại khỏi** `getHistory` |

**Xong khi:** cùng `userId` hai shop → hai chuỗi history. Spec repository/service với mock.

### 4.6 BOT-05 Fallback AI (phần lớn đã có)

Siết:

- Timeout LLM (vd 20s) → cùng câu fallback, **không** log stack ra client.
- `extractText` rỗng → fallback, không im lặng (hiện `handleIncomingMessage` warn rồi return — **sửa: gửi fallbackMessage**).
- Không nhét `error.message` vào tin Zalo.

---

## 5. Wave 1 — Persona theo shop + chính sách “an toàn trước”

**Mục tiêu:** đổi giọng trong FE là bot đổi; chủ nhắn tay → bot im; không spam.

### 5.1 BOT-02 Module `bot-profile`

Cấu trúc (đúng convention):

```
src/modules/bot-profile/
  bot-profile.module.ts
  enums/bot-profile.enum.ts              # tone, hours mode
  constants/bot-profile.constant.ts      # default prompt pieces, Redis key pause
  interfaces/bot-profile.interface.ts
  entities/bot-profile.entity.ts
  repositories/bot-profile.repository.ts
  dtos/request/bot-profile.update.request.dto.ts
  dtos/response/bot-profile.get.response.dto.ts
  dtos/response/bot-profile.get.response.data.dto.ts
  errors/bot-profile.error.ts
  services/bot-profile.service.ts        # đúng 1 service
  controllers/bot-profile.admin.controller.ts
```

- `PUT /admin/bot-profile` (không `:id`) — luôn shop JWT.
- `POST /admin/bot-profile/accept-zalo-risk` — set `zaloRiskAcceptedAt`. QR login **từ chối** nếu chưa accept (error `zalo.error.riskNotAccepted`).
- Worker load profile mỗi tin (cache Redis 30s `bot-profile:{shopId}`). Invalidate khi PUT.

**Prompt:** đổi `ai-agent.prompt.constant.ts` thành `buildSystemPrompt(profile)` + `buildKnowledgeToolDescription(shopName)`. Xoá chữ SmartGo. Spec prompt giữ / viết lại.

**Worker:** truyền `IBotProfile` vào `handleIncomingMessage`. `IAiAgentInput` thêm `shopId`, `systemPrompt`, `kbFilterShopId`.

### 5.2 BOT-04 Pause, rate limit, delay, giờ, người lạ

Toàn bộ Redis key đặt `constants/` của `omnichat-bot` (không file helper):

| Key | TTL / rule |
|-----|------------|
| `bot:pause:{shopId}:{threadId}` | `pauseMinutes` (default 45) khi `isSelf` |
| `bot:rl:thread:{shopId}:{threadId}` | 1 reply / 5s |
| `bot:rl:shop:{shopId}:{yyyyMMddHHmm}` | N reply/phút (const `OMNICHAT_BOT_MAX_REPLIES_PER_MINUTE = 8`) |
| `bot:greeted:{shopId}:{userId}` | 30 ngày — câu chào người lạ 1 lần |
| `bot:mute:{shopId}:{threadId}` | theo `mutedThreadIds` hoặc SET khi FE tắt bot cho khách |

Hành vi:

- Delay `random 2000–6000ms` trước `sendMessage`; `sendTypingEvent` best-effort (đã có phía Zalo service — gọi trước delay hoặc đầu delay).
- Giờ hoạt động: so `Asia/Ho_Chi_Minh` với `start/end`. Ngoài giờ: **không trả lời** (mặc định). Không gửi “đã ngoài giờ” trừ khi field `replyOutsideHoursMessage` được set (tránh lộ bot lúc 2h sáng).
- Người lạ: chưa có history shop+user → nếu `replyToStrangers=false` → một câu chào cố định từ const/i18n, không gọi AI.

**Xong khi:** test hành vi với clock/Redis mock: isSelf → tin khách kế tiếp trong TTL không gọi AI; hết TTL gọi lại.

### 5.3 Nhãn AI (gói Free)

Const watermark. Wave 1: flag trên profile `showAiLabel`. Wave 3: bắt buộc với plan Free — tin **đầu tiên trong ngày** theo thread (`bot:label:{shopId}:{threadId}:{yyyyMMdd}`).

---

## 6. Wave 2 — KB theo shop + lịch sử hội thoại (điều kiện bán + aha moment)

### 6.1 BOT-03 Knowledge ingest + filter

Mở rộng **module `knowledge` hiện có** (không tạo service thứ 2):

| Thêm | Việc |
|------|------|
| `entities/knowledge-item.entity.ts` | Mongo CRUD |
| `repositories/knowledge-item.repository.ts` | |
| `enums/knowledge.enum.ts` | `faq` / `product` / `text` |
| `constants/knowledge.ingest.constant.ts` | chunk size, max file, i18n missing fields |
| `dtos/request/knowledge.upsert.request.dto.ts` | |
| `dtos/request/knowledge.import-csv.request.dto.ts` hoặc multipart | |
| `controllers/knowledge.admin.controller.ts` | list/get/create/update/delete/import |
| `errors/knowledge.error.ts` | quota, parse CSV, empty body |
| `KnowledgeService` | `search(query, shopId, topK)`, `ingest*`, `deleteItem`, `ensureCollection` |

`search` **bắt buộc** `filter: shopId == "..."`. Không shopId → không search (throw nội bộ, tool trả `[]`).

**API**

| Method | Path | Body / query |
|--------|------|----------------|
| GET | `/admin/knowledge/items` | pagination + `type` |
| POST | `/admin/knowledge/items` | `{ type, title, body }` |
| PUT | `/admin/knowledge/items/:id` | partial |
| DELETE | `/admin/knowledge/items/:id` | |
| POST | `/admin/knowledge/import-faq` | `{ items: [{ q, a }] }` max 50/request |
| POST | `/admin/knowledge/import-csv` | file CSV |

**Xong khi:** 2 shop, query giống nhau, hit không chéo. Spec ingest chunk + filter expr.

Env: `ZILLIZ_COLLECTION=omnichat_knowledge_v1`. Collection cũ SmartGo: script import → shop nội bộ (không block wave).

### 6.2 FE-02 API hội thoại (read-only)

Đặt controller trong **`omnichat-bot`** (query `zalo_chat_history`), không module mới.

| Method | Path | Việc |
|--------|------|------|
| GET | `/admin/conversations` | Group theo `threadId`/`userId`: last message, lastAt, senderName, `botMuted` |
| GET | `/admin/conversations/:threadId/messages` | Cursor theo `timestamp` + `_id`, filter `shopId` JWT |
| POST | `/admin/conversations/:threadId/mute` | `{ muted: boolean }` → Redis + `mutedThreadIds` |
| POST | `/admin/conversations/:threadId/unmute` | |

Pagination: bám `@PaginationQuery` như CRUD chuẩn. Không gửi tin từ API này (Track A không inbox người).

Export CSV lịch sử (quyền rời đi, GTM mục 8): `GET /admin/conversations/export` — Wave 2 nếu còn sức, không thì Wave 3; **không** block thu tiền founding.

---

## 7. Wave 3 — Usage, gói, thanh toán tối thiểu (P0-6, P0-7)

### 7.1 BIL-01 Module `billing`

```
src/modules/billing/
  enums/billing.enum.ts                 # plan code, sub status, interval
  enums/billing.status-code.enum.ts
  constants/billing.plan.constant.ts    # seed 4 gói + add-on giá
  constants/billing.redis.constant.ts   # usage keys
  interfaces/billing.interface.ts       # IQuotaSnapshot
  entities/plan.entity.ts
  entities/subscription.entity.ts
  entities/usage-monthly.entity.ts
  entities/payment.entity.ts            # skeleton
  repositories/*.ts
  errors/billing.error.ts               # quota exceeded structured
  services/billing.service.ts           # 1 service: CRUD + incr + snapshot
  controllers/billing.admin.controller.ts
```

**Lưu ý convention:** `plans` + `subscriptions` + `usage` cùng module billing, **một** `BillingService`.

Worker trước khi gọi AI: `billingService.assertCanReply(shopId)` truyền từ worker (param). Nếu vượt: `OmnichatBotService` gửi fallback, **không** INCR (hoặc INCR `blocked` riêng để dashboard).

`GET /admin/billing/usage` → `{ plan, used, limit, percent, periodEnd }`.
`GET /admin/billing/plans` → list niêm yết.

Seed: `src/scripts/seed-plans.ts` hoặc `onModuleInit` idempotent (chỉ insert nếu collection rỗng).

### 7.2 BIL-02 Thanh toán

**Nhánh A — chưa chốt cổng (founding 10 shop):** `PATCH /admin/billing/subscription` **chỉ ADMIN** set plan. FE founder dùng tool nội bộ.

**Nhánh B — đã chốt payOS hoặc SePay:**

- `POST /admin/billing/checkout` → tạo payment, trả QR/url.
- `POST /public/billing/webhook/{provider}` `@Public()` + verify chữ ký.
- Kích hoạt/gia hạn `subscriptions`, ghi `payments`.

Interface `IPaymentProvider { createQr; verifyWebhook }` trong `interfaces/`. Impl một file `services` **không** — impl private method hoặc class trong `errors` không đúng. Đặt provider **trong cùng** `billing.service.ts` private methods **hoặc** constants + static trên `BillingError` thì gượng. **Chốt:** private methods trong `BillingService` (một service), tách `PayosAdapter` chỉ khi file > ~400 dòng — khi đó vẫn không tạo service Nest thứ 2: adapter là class thuần trong `billing/providers/payos.provider.ts` **không** `@Injectable` nếu convention cấm nhiều service; inject Redis/HTTP từ BillingService.

Cron gia hạn: hết `periodEnd` + chưa thanh toán → downgrade Free, bot vẫn chạy hạn mức Free.

---

## 8. Wave 4 — OTP thật, production env, deploy, worker HA

### 8.1 SEC-05 OTP provider

- `OtpService.requestOtp`: daily cap; production gọi HTTP SMS; không log mã OTP (chỉ `phone` mask).
- Env: `OTP_PROVIDER=esms|speedsms|zns`, `OTP_API_KEY`, `OTP_BRANDNAME`.
- Fail-fast production nếu thiếu.

### 8.2 OPS-01 Docker + CI

| File | Việc |
|------|------|
| `Dockerfile` | multi-stage node:22-alpine, `yarn build`, user non-root. `CMD` mặc định API; worker: `node dist/worker/main.worker.js` |
| `docker-compose.prod.yml` | `api` (2 replica sau), `worker` (1), `mongo` replSet 1 node, `redis`, healthcheck, log rotate |
| `.github/workflows/deploy-vps.yml` | `lint` + `build` + (jest unit) → GHCR → SSH compose |
| Health worker | Redis `worker:heartbeat` TTL 15s; Uptime Kuma ping key hoặc `GET` nội bộ không public |

### 8.3 OPS-02 Worker leader lock

`ZaloListenerService.startAll`: `SET worker:leader` NX EX 30, renew 10s. Mất lock → `stopAll` listeners. Instance khác lấy lock → `startAll`. Heartbeat `worker:heartbeat:{shopId}`. Session `expired` → Redis pub + (sau) notify; Wave 4 tối thiểu log + flag session để FE poll.

### 8.4 OPS-03 / OPS-04

Backup `mongodump` cron compose; Sentry DSN env; pino đã có thì thêm `shopId`/`requestId` vào log request (không log cookie/imei/nội dung tin mức info).

### 8.5 Checklist 7.5 còn lại (P0-11)

| Mục | Wave |
|-----|------|
| Guard tenant (G1) | 0 |
| shopId history + KB filter | 0 + 2 |
| JWT fail-fast | 0 |
| CORS whitelist | 0 |
| AppEnvDto | 0 |
| OTP thật + rate | 0 cap + 4 provider |
| Throttle auth/send | 0 |
| Encryption interceptor (audit 8.x) | 4 nếu AES on — không block founding nếu AES đang `false` |
| `main.ts` shutdown / trust proxy / Swagger off prod | 4 |
| Không log imei/cookie | 4 (rà `Logger` Zalo) |
| `@ts-nocheck` repository | **không** P0 — Trung, backlog riêng |
| FE refresh 401 | FE-04, repo FE |

---

## 9. Hợp đồng API cho FE (Track A)

Base: `/api/v1`. Auth: `Authorization: Bearer`. Admin prefix `/admin`.

| Tính năng FE | API | Wave BE |
|--------------|-----|---------|
| Login/register/OTP | `/public/auth/*` (giữ) | 0 throttle, 4 SMS |
| Shop của tôi | `GET /admin/shops` | 0 |
| Cảnh báo rủi ro + QR | `POST /admin/bot-profile/accept-zalo-risk` rồi SSE `login-qr` | 1 |
| Persona | `GET/PUT /admin/bot-profile` | 1 |
| FAQ/KB | `/admin/knowledge/*` | 2 |
| Lịch sử + mute | `/admin/conversations*` | 2 |
| Usage / bảng giá | `/admin/billing/usage`, `/plans` | 3 |
| Checkout QR | `/admin/billing/checkout` | 3B |
| Onboarding wizard | Ghép tuần tự: shop (đã có lúc register) → risk → QR → persona → 10 FAQ → nick test xem conversations | 0–2 |

`POST /admin/zalo/send` **không** đưa vào FE.

---

## 10. i18n modules cần thêm

| File | Wave |
|------|------|
| `auth.json` (bổ sung forbidden, otpDailyLimit, otpThrottle) | 0 |
| `shop.json` (crossShop nếu chưa) | 0 |
| `zalo.json` (`riskNotAccepted`) | 1 |
| `bot-profile.json` | 1 |
| `omnichat-bot.json` / `conversation.json` | 2 |
| `knowledge.json` | 2 |
| `billing.json` | 3 |

---

## 11. Kiểm thử tối thiểu (CI)

| Spec | Wave | Nội dung |
|------|------|----------|
| `tenant.guard.spec.ts` | 0 | cross-shop 403, admin pass |
| `zalo-chat-history` shop filter | 0 | |
| `ai-agent.prompt.constant.spec.ts` | 1 | không chứa “SmartGo”; có botName |
| `omnichat-bot` pause/rate | 1 | Redis mock |
| `knowledge.service` filter shopId | 2 | không gọi search thiếu shopId |
| `billing` quota block | 3 | used >= limit → assertCanReply throw/false |
| `otp.service` daily cap | 0 | |

e2e HTTP: 2 user JWT, gọi shop người kia. Chạy `yarn test` trên CI Wave 4.

Kịch bản tay trước soft launch (GTM 7.4): 1 nick test NCG, QR, FAQ, tin nhóm/@, chủ trả lời tay, hết quota Free (set limit 3).

---

## 12. Việc ngoài repo này (không block thứ tự BE nhưng block “bán công khai”)

| ID GTM | Việc | Ai |
|--------|------|----|
| FE-01 | Wizard 5 bước + tick rủi ro | Flutter |
| FE-02 | Màn lịch sử | Flutter (API wave 2) |
| FE-03 | Trang gói + usage | Flutter |
| FE-04 | Refresh token khi 401 | Flutter |
| FE-05 | Landing + GA4 | Web |
| LEG-01 | ToS, Privacy, DPA, Luật 91 | Luật sư + đăng web |
| GRW-01 | Video + founding form | Founder |
| OPS-03 restore drill | DevOps | |
| Mục 17 GTM | Domain, giá, payOS/SePay, OTP vendor, hosting VN, tách SmartGo | Founder |

**Mặc định kỹ thuật khi founder chưa chốt**

| Câu hỏi | Default để code |
|---------|-----------------|
| Giá | Seed đúng bảng GTM 149k / 349k / 499k; đổi const |
| Free vs trial 14 ngày | **Free + hạn mức 150** (đúng GTM) |
| Thanh toán | Admin gán gói đến khi có provider |
| OTP | Mock non-prod; production fail-fast đến khi có key |
| SmartGo | Shop nội bộ, KB import sau — prompt generic từ Wave 1 |

---

## 13. Thứ tự PR đề xuất (nhỏ, review được)

1. `fix(auth): tenant + roles guard on /admin` (SEC-01)
2. `fix(auth): fail-fast jwt/cors/env` (SEC-02, SEC-03, SEC-04)
3. `fix(bot): shopId on chat history` (BOT-01) + fallback gửi tin (BOT-05)
4. `feat(bot-profile): per-shop persona + risk accept` (BOT-02)
5. `feat(bot): pause, rate limit, hours, strangers` (BOT-04)
6. `feat(knowledge): ingest + shopId filter` (BOT-03)
7. `feat(bot): admin conversations + mute` (FE-02 API)
8. `feat(billing): plans, usage, quota` (BIL-01)
9. `feat(billing): checkout webhook` (BIL-02, khi có cổng)
10. `feat(auth): sms otp provider` (SEC-05)
11. `chore(ops): docker compose prod + worker lock + ci` (OPS-01, OPS-02)

Mỗi PR: i18n vi+en, không đụng Track B, không refactor `database.repository.ts`.

---

## 14. Definition of Done — “đủ thu tiền founding”

Khách thứ 2 onboard được khi **tất cả** đúng:

1. JWT user A không đọc/ghi shop B (G1).
2. History và KB không chéo shop (G2, P0-4).
3. Prompt/KB không còn hard-code SmartGo; đổi persona trên API là bot đổi giọng (G3).
4. Chủ nhắn tay → bot im trên thread đó ≥ 30 phút (G4).
5. Rate limit + delay 2–6s + (tuỳ chọn) giờ hoạt động + tick rủi ro trước QR (mục 4 GTM).
6. Gói Free có trần reply; vượt → fallback, không gọi LLM (G5).
7. Production không start với JWT mặc định / CORS `*` / OTP mock (G6 + 7.5).
8. FE (tối thiểu): QR, sửa persona, nạp FAQ, xem 1 hội thoại — dù wizard chưa đẹp.

Chưa bắt buộc cho 10 founding: payOS, SMS brandname, landing, hoá đơn điện tử, leader lock (nên có trước public 50 shop).

---

## 15. Rủi ro kỹ thuật khi làm

| Rủi ro | Xử lý |
|--------|-------|
| Convention “service không inject service” vs worker cần quota/profile | Orchestrate ở `ZaloListenerService` (worker), truyền snapshot vào bot service |
| Zilliz schema cũ không có scalar shopId | Collection mới; không migrate-in-place `smart_go_knowledge_v5` |
| Index history thiếu `shopId` trên data cũ | Backfill 1 shop nội bộ; bản ghi mồ côi không đưa vào AI |
| `zca-js` không có friend-list đáng tin | “Người lạ” = chưa có history trong `zalo_chat_history` của shop |
| `sendTypingEvent` fail | Best-effort, vẫn delay + send |
| Thanh toán chậm chốt | Founding gán gói tay; không block wave 0–2 |

---

## 16. Việc làm ngay lập tức (không chờ họp)

Bắt đầu **Wave 0 PR1 — SEC-01**. Đó là điểm chặn tuyệt đối GTM: *“Rò rỉ dữ liệu chéo shop — sửa trước khi có khách thứ 2”*.

Tiếp theo trong cùng tuần: SEC-02/03/04 + BOT-01 + BOT-05.

Wave 1–2 là thứ biến sản phẩm từ “bot SmartGo” thành “trợ lý AI theo shop” — điều kiện bán Track A.
