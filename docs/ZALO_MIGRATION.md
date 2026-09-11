# Chiến Lược Chuyển Đổi: n8n → NestJS (OmniChat Zalo Cá Nhân Chatbot)

> **Mục tiêu:** Di chuyển toàn bộ tính năng của workflow n8n **OmniChat - Zalo Ca Nhan Chatbot** (`SWWpGJfM3qwJNmUl`) vào backend NestJS hiện tại (`c2d-omnichat-be`), **loại bỏ hoàn toàn n8n**.
>
> **Trạng thái:** Đang triển khai code (P0–P5 scaffolded trong repo).
> **Nguồn tham chiếu:** `../c2d-omnichat-workflow` (community node `n8n-nodes-zalo-ca-nhan`), `refs/N8N-OMNICHAT-SYSTEM.md`, `refs/N8N-ZALO-SEND-FIX.md`, `refs/n8n-selfhosted-deployment.md`.

---

## 0. Quyết định kiến trúc đã chốt

| # | Quyết định | Lựa chọn |
|---|-----------|----------|
| 1 | Nơi chạy listener Zalo (websocket bền vững, single-instance) | **Tách vào `src/worker`** — process riêng, không chung với API để tránh trùng kết nối khi scale ngang |
| 2 | Thư viện Zalo cá nhân | **`zca-js`** (bản maintained mới nhất) thay cho `zalo-api-final` |
| 3 | Tầng AI/RAG | **LangChain.js** — setup chuyên nghiệp, dễ mở rộng (`createToolCallingAgent` + `AgentExecutor`) |
| 4 | Chuẩn code | Tuân thủ `alobo-backend-conventions` + `alobo-api-conventions` |

---

## 1. Phân rã workflow n8n hiện tại

Workflow active thực chất là 1 pipeline tuần tự. Ánh xạ từng node → trách nhiệm:

### 1.1 Luồng chính (tin vào → trả lời)

```
Zalo Message Trigger (listener websocket, reconnect backoff x5)
  → Bo Qua Tin Cua Minh              # bỏ tin isSelf = true
  → Trich Xuat Du Lieu               # userId, userName, messageContent, threadId
  → Phan Loai Tin Nhan (Switch)
        ├─ "Tu Choi" (chứa stop|dung|spam) → Zalo Send Blocked
        └─ "AI Xu Ly" (fallback)
              → MongoDB Get History (zalo_chat_history, limit 10 theo userId)
              → Format History (thành chuỗi hội thoại)
              → AI Agent (maxIterations=3, temp=0.3, maxTokens=500)
                    ├─ LLM: qwen3.7-plus (endpoint OpenAI-compatible Alibaba DashScope)
                    └─ tool: Zilliz KB (collection smart_go_knowledge_v5)
                          └─ embedding: text-embedding-v3 (dim 1024)
              → Zalo Send Reply
              → MongoDB Save History (cặp user + assistant)
```

### 1.2 Nhánh phụ: Login QR (renew session)

```
Manual Trigger → Zalo Login Via QR Code → Hien Thi Ket Qua
```
QR event `type`: `0` = có ảnh QR, `1` = hết hạn, `2` = đã quét, `3` = từ chối, `4` = có login info (`cookie + imei + userAgent`).

### 1.3 Thư viện & cơ chế cốt lõi (từ community node)

| Chức năng | API `zca-js` | Ghi chú migrate |
|-----------|-------------|-----------------|
| Đăng nhập bằng session | `new Zalo(opts).login({ cookie, imei, userAgent })` | `cookie` là JSON array (parse trước) |
| Đăng nhập QR | `zalo.loginQR(undefined, (qrEvent) => …)` | Stream ảnh QR ra client |
| Nghe tin | `api.listener.on('message', h)` + `api.listener.start()` | **Chỉ 1 listener/tài khoản tại 1 thời điểm** |
| Sự kiện kết nối | `onConnected / onClosed / onError` | Cần cho reconnect |
| Gửi typing | `api.sendTypingEvent(threadId, type)` | UX, best-effort |
| Gửi tin | `api.sendMessage({ msg }, threadId, ThreadType.User\|Group)` | `type` 0=User, 1=Group |
| Chống trùng | `message.isSelf` | Bỏ tin của chính bot |
| Field tin | `message.threadId`, `message.data.content`, `message.data.uidFrom`, `message.type` | Nguồn userId/nội dung |

**Session** = `{ cookie, imei, userAgent, proxy? }` — trong n8n lưu ở credential `zaloApi`; ở NestJS sẽ lưu Mongo (mã hóa).

---

## 2. Hiện trạng backend NestJS đích

Đã có sẵn hạ tầng tái dùng được:

- **MongoDB** base repo/decorator (`common/database`), **Redis** (`common/redis`), **Pub/Sub**, **encryption module** (`common/encryption`), **i18n** (`languages/{vi,en}`), **Socket.IO gateway** (`modules/chat`).
- Modules nghiệp vụ: `auth`, `user`, `contact`, `conversation`, `chat` — đây là app messaging OmniChat riêng, **chưa có gì về Zalo/AI/vector**.
- Có sẵn thư mục `src/worker` (dành cho process nền — nơi đặt listener).

➡️ Kết luận: chuyển đổi = **thêm module tích hợp mới**, không đụng logic chat hiện có.

---

## 3. Kiến trúc mục tiêu

```
┌──────────────────────────────────────────────────────────────┐
│  API process (NestJS chính)                                   │
│   - REST admin: quản lý session, phát QR login (SSE)          │
│   - (tùy chọn) đẩy realtime status ra FE qua gateway sẵn có   │
└───────────────┬──────────────────────────────────────────────┘
                │ chung DB / Redis
┌───────────────▼──────────────────────────────────────────────┐
│  Worker process (src/worker) — SINGLE INSTANCE                │
│   ZaloListenerService (OnApplicationBootstrap)                │
│     zca-js api.listener → onMessage()                         │
│        → BotPipelineService                                   │
│             ├─ lọc isSelf / spam-stop                         │
│             ├─ ZaloChatHistory (get 10 / save)               │
│             ├─ AiAgentService (LangChain AgentExecutor)      │
│             │     ├─ ChatOpenAI (DashScope qwen3.7-plus)     │
│             │     └─ tool knowledge_base → KnowledgeService  │
│             │            └─ Milvus vector store + embeddings │
│             └─ ZaloService.sendMessage()                      │
└──────────────────────────────────────────────────────────────┘
```

**Nguyên tắc thay thế then chốt:** n8n dùng chiêu "listener POST ngược vào webhook URL của chính workflow". Ở NestJS **bỏ hẳn webhook self-POST** — callback `onMessage` gọi thẳng pipeline in-process (nhanh hơn, ít điểm hỏng).

---

## 4. Module mới (theo convention)

### 4.1 `modules/zalo` — kết nối, session, gửi/nhận
Thay cho 3 node `zaloMessageTrigger`, `zaloSendMessage`, `zaloLoginByQr`.

```
modules/zalo/
  entities/        zalo-session.entity.ts          # cookie(enc), imei, userAgent, proxy, status
  enums/           zalo.enum.ts                     # ENUM_ZALO_SESSION_STATUS, ENUM_ZALO_THREAD_TYPE
                   zalo.status-code.enum.ts
  constants/       zalo.constant.ts                 # RECONNECT delay/max, STOP_KEYWORDS = ['stop','dung','spam']
  interfaces/      zalo.interface.ts                # IZaloMessage, IZaloSessionData
  dtos/
    request/       zalo.send.request.dto.ts, zalo.login-qr.request.dto.ts
    response/      zalo.session.response.dto.ts
  errors/          zalo.session.error.ts            # validate session, format lỗi login
  repositories/    zalo-session.repository.ts
  services/        zalo.service.ts                  # 1 service duy nhất: login, sendMessage, sendTyping, CRUD session
  controllers/     zalo.admin.controller.ts         # GET session, POST login-qr (SSE), status
  zalo.module.ts
```

- **`zalo.service.ts`**: bọc `zca-js`. Chịu trách nhiệm: `loginWithSession()`, `loginQr(onQrEvent)`, `sendMessage()`, `sendTyping()`, lưu/đọc session (cookie mã hóa qua encryption module). **Không** chứa vòng đời listener (tách sang worker để giữ service dùng được từ cả API lẫn worker).

### 4.2 `modules/knowledge` — RAG vector store
Thay cho node `Zilliz Knowledge Base` + `Alibaba Embeddings`.

```
modules/knowledge/
  constants/       knowledge.constant.ts            # collection, topK=4, dim=1024
  interfaces/      knowledge.interface.ts           # IKnowledgeHit
  services/        knowledge.service.ts             # Milvus vector store (LangChain) + embeddings, similaritySearch()
  knowledge.module.ts
```

- Dùng `Milvus` vector store của `@langchain/community/vectorstores/milvus` + `OpenAIEmbeddings` trỏ DashScope. Expose `search(query, topK)` để agent gọi như 1 tool.

### 4.3 `modules/ai-agent` — LLM + agent loop (LangChain)
Thay cho node `AI Agent` + `Alibaba Qwen`.

```
modules/ai-agent/
  constants/       ai-agent.constant.ts             # MAX_ITERATIONS=3, TEMPERATURE=0.3, MAX_TOKENS=500
  constants/       ai-agent.prompt.constant.ts      # persona system prompt (tiếng Việt CÓ DẤU)
  interfaces/      ai-agent.interface.ts            # IAgentInput { userId, message, history }
  services/        ai-agent.service.ts              # build ChatOpenAI + tool + AgentExecutor, run()
  ai-agent.module.ts
```

- `ChatOpenAI({ model: qwen3.7-plus, temperature: 0.3, maxTokens: 500, configuration: { baseURL: DASHSCOPE } })`.
- Tool `knowledge_base` (LangChain `DynamicStructuredTool`) → gọi `KnowledgeService.search`. Prompt buộc "gọi tool đúng 1 lần, đọc `pageContent → metadata`, fallback lịch sự".
- `createToolCallingAgent({ llm, tools, prompt })` + `new AgentExecutor({ agent, tools, maxIterations: 3 })`.

### 4.4 `modules/omnichat-bot` — pipeline điều phối
Thay cho các node Switch / Extract / Format / nối dây.

```
modules/omnichat-bot/
  entities/        zalo-chat-history.entity.ts      # userId, threadId, role, content, timestamp
  constants/       omnichat-bot.constant.ts         # HISTORY_LIMIT=10, BLOCKED_MESSAGE key
  repositories/    zalo-chat-history.repository.ts
  services/        omnichat-bot.service.ts          # handleIncomingMessage(): lọc → history → agent → send → save
  omnichat-bot.module.ts
```

- `omnichat-bot.service.ts` là bộ điều phối chính (đóng vai "controller" của workflow): nhận `IZaloMessage`, bỏ self, check STOP_KEYWORDS → gửi blocked; ngược lại lấy 10 history → `AiAgentService.run` → `ZaloService.sendMessage` → lưu history. Import `ZaloService`, `AiAgentService` — **đây là orchestrator, được phép inject nhiều service** (đúng tinh thần "controller điều phối").

### 4.5 `worker` — vòng đời listener
```
worker/
  zalo-listener.service.ts     # OnApplicationBootstrap: login session → api.listener.on('message') → OmnichatBotService.handleIncomingMessage; reconnect backoff
  worker.module.ts             # import ZaloModule, OmnichatBotModule
  main.worker.ts               # bootstrap NestApplicationContext riêng
```

- Giữ nguyên logic reconnect của n8n: `RECONNECT_DELAY_MS=15s`, backoff `*2^attempt`, `MAX=5`; sau khi hết retry → set session status `EXPIRED`, cần QR renew.

---

## 5. Data model mới (MongoDB)

| Collection | Field | Index |
|------------|-------|-------|
| `zalo_sessions` | `accountLabel, cookie(enc), imei, userAgent, proxy?, ownId?, status, lastLoginAt` | `status` |
| `zalo_chat_history` | `userId, threadId, role('user'\|'assistant'), content, timestamp` | `{ userId: 1, timestamp: -1 }` |

> Giữ đúng tên collection `zalo_chat_history` như n8n để có thể tái dùng dữ liệu lịch sử hiện có nếu muốn.

---

## 6. Dependencies & Env

### 6.1 Packages thêm mới
```
zca-js                              # Zalo cá nhân (login/listener/send)
langchain @langchain/core           # agent framework
@langchain/openai                   # ChatOpenAI + OpenAIEmbeddings (trỏ DashScope)
@langchain/community                # Milvus vector store
@zilliz/milvus2-sdk-node            # peer dep cho Milvus store
qrcode                              # (tùy chọn) render QR ra PNG/dataURL nếu cần
```

### 6.2 Env mới (thêm vào `.env` + `app-env.dto.ts` + config module)
```
# Zalo
ZALO_PROXY=

# DashScope (OpenAI-compatible)
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_API_KEY=
AI_CHAT_MODEL=qwen3.7-plus
AI_EMBED_MODEL=text-embedding-v3
AI_MAX_ITERATIONS=3
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=500

# Zilliz / Milvus
ZILLIZ_URI=
ZILLIZ_TOKEN=
ZILLIZ_COLLECTION=smart_go_knowledge_v5
ZILLIZ_DIM=1024
ZILLIZ_TOP_K=4
```

---

## 7. Lộ trình triển khai (phased)

| Phase | Nội dung | Nghiệm thu |
|-------|----------|-----------|
| **P0** | Module `zalo`: entity session (mã hóa), `zalo.service` login-by-session + `sendMessage`/`sendTyping`; skeleton worker | Nạp session thủ công → gửi được 1 tin test |
| **P1** | Listener trong worker + reconnect backoff; nhận & log tin đến in-process | Nhắn vào Zalo → worker log ra message |
| **P2** | QR login qua `zalo.admin.controller` (SSE stream ảnh QR) → lưu session tự động | Quét QR → session `ACTIVE` → listener tự lên |
| **P3** | `omnichat-bot`: lọc self/spam-stop, `zalo_chat_history` get/save, reply canned/echo | Nhắn "stop" → nhận blocked; nhắn thường → echo + history lưu đúng |
| **P4** | Module `knowledge`: Milvus search + embeddings | Gọi `search("...")` trả về hits từ `smart_go_knowledge_v5` |
| **P5** | Module `ai-agent`: LangChain AgentExecutor + persona prompt; ráp full flow thay workflow | Nhắn hỏi SmartGo → trả lời RAG; hỏi ngoài phạm vi → fallback lịch sự |
| **P6** | Vận hành: deploy worker single-instance, health/alert session hết hạn, gỡ tài liệu/hạ tầng n8n | Chạy ổn định thay n8n; tắt workflow n8n |
| **P7+** | Media inbound/outbound (sticker, ảnh, file, voice) — bot hiểu câu hỏi không chỉ text | Xem `docs/BOT_MEDIA_REPLY_PLAN.md` |

---

## 8. Rủi ro & lưu ý

- **Single-instance bắt buộc:** `zca-js` chỉ cho 1 listener/tài khoản. Không scale ngang worker (2 replica = 2 kết nối tranh nhau, listener bị đá). Nếu cần HA → dùng leader-election/lock qua Redis.
- **Session dễ hết hạn / rủi ro tài khoản:** `zca-js` là API **không chính thức**, có thể vỡ khi Zalo đổi API và có nguy cơ khóa nick. Cần luồng cảnh báo + QR renew (đã có ở P2). Giữ khả năng vá cookie-domain (`chat.zalo.me` vs `id.zalo.me`) nếu tái diễn.
- **Đổi embedding = phải re-index** collection Zilliz (dimension đổi → RAG lệch). Giữ nguyên `text-embedding-v3`/dim 1024 khi migrate.
- **Chất lượng RAG phụ thuộc data:** collection hiện chỉ có `BUS_STOP`; câu hỏi ngoài phạm vi (vd "tuyến 08") sẽ fallback — đây là vấn đề data-layer, không phải bug code.
- **Prompt tiếng Việt CÓ DẤU:** giữ nguyên để `qwen3.7-plus` parse chính xác và khớp metadata Zilliz có dấu.
- **`@langchain/community` Milvus:** dùng bản có fix bỏ qua auto-calculated field khi validate (PR #9326, ~11/2025) để tránh lỗi insert/validate schema.
- **Bảo mật secret:** cookie/imei/userAgent, API keys mã hóa qua encryption module; không commit vào git (khác hẳn n8n lưu credential encrypted trong sqlite).

---

## 9. Việc KHÔNG còn cần sau migrate

- n8n self-host (Docker, nginx, sqlite), community node `n8n-nodes-zalo-ca-nhan`, patch `tough-cookie` thủ công, các script patch DB (`workflow_entity`/`workflow_history`), MCP OAuth, dual-version draft/active — **bỏ toàn bộ**. Bug "Zalo Send rớt params khi Save UI" và "Version not found khi Publish" cũng biến mất vì không còn UI serializer của n8n.
