# Kế hoạch: Chatbot trả lời sticker, ảnh, file và media khác

> **Mục tiêu:** Khi khách gửi sticker / ảnh / file / voice trên Zalo, bot vẫn hiểu câu hỏi và trả lời được — không còn bỏ tin vì `content` không phải chuỗi.
>
> **Nhánh gốc:** `feat/Sprint_2`
> **Phụ thuộc:** pipeline hiện tại `ZaloListener → OmnichatBotService → AiAgentService → ZaloService.sendMessage`
> **Thư viện gửi/nhận:** `zca-js@2.1.2`
> **LLM:** DashScope `qwen3.7-plus` (OpenAI-compatible, **đã hỗ trợ vision / audio**)

Tài liệu này là kế hoạch triển khai, chưa phải code. Giữ nguyên convention clean architecture trong `refs/docs/AI_CLEAN_CODE_RULES.md`.

---

## 1. Vì sao bot đang im

Luồng hiện tại chỉ nhận **tin văn bản**.

`mapIncomingZaloMessage` trả `null` khi `data.content` không phải string:

```36:38:src/modules/zalo/mappers/zalo-message.mapper.ts
  const content = data.content;
  if (typeof content !== 'string' || !content.trim()) {
    return null;
  }
```

Test khóa hành vi này (`skips non-text content`). `OmnichatBotService` log `Skip non-text or invalid Zalo message` rồi return.

Hệ quả:

| Lớp | Giới hạn |
|-----|----------|
| Mapper | Sticker / ảnh / file / voice bị loại trước khi vào pipeline |
| `IZaloMessage` | Chỉ có `messageContent: string` |
| History | Chỉ lưu `content` string |
| `AiAgentService.run` | Chỉ nhận `message: string`, prompt text-only |
| `ZaloService.sendMessage` | Chỉ gửi `{ msg }`, chưa `attachments` / `sendSticker` / `sendVoice` |
| Nhóm | Chỉ coi bot bị gọi khi mention hoặc tên bot **trong text** — media không có caption thì không bao giờ được trả lời |

zca-js đã mô hình hóa `content` là `string | TAttachmentContent | TOtherContent`. Bot đang cắt mất hai nhánh sau.

---

## 2. Phạm vi

### 2.1 Làm (P7 inbound — ưu tiên)

Khách gửi media → bot **hiểu** và **trả lời text** (quote tin gốc như hiện tại).

| Loại Zalo (`msgType`) | Hành vi mong muốn |
|-----------------------|-------------------|
| `webchat` | Giữ nguyên (text) |
| `chat.photo` | Vision: đọc ảnh + caption → RAG nếu hỏi cửa hàng |
| `chat.sticker` | 1-1: trả lời thân thiện; nhóm: chỉ trả lời khi được gọi (mention/quote/caption) |
| `share.file` / `chat.file` | Ảnh → vision; PDF/DOCX/TXT/XLSX → trích text; loại nguy hiểm → từ chối lịch sự |
| Quote kèm media | Câu hỏi text + ảnh/file được quote vẫn đưa media vào agent |

### 2.2 Làm tiếp (P8 outbound)

Bot **gửi** ảnh / file / sticker khi câu trả lời cần (ảnh sản phẩm, bảng giá, sticker cảm ơn).

### 2.3 Để sau (P9)

- Voice (`chat.voice`) → STT (`input_audio` của Qwen) rồi vào pipeline text
- Video (`chat.video.msg`) → thumbnail + caption; full video tốn token
- Location / link preview / GIF: map thành text mô tả, không cần model riêng

### 2.4 Không làm

- Không tạo file `*util*` gom logic media
- Không đổi naming sang CRM/shop ngoài domain Omnichat/Zalo hiện có
- Không scale ngang worker (vẫn 1 listener / 1 tài khoản)
- Không lưu nguyên file nhị phân vào Mongo

---

## 3. Quyết định kiến trúc đã chốt cho kế hoạch

| # | Quyết định | Lựa chọn | Lý do |
|---|------------|----------|--------|
| 1 | Nơi parse inbound | Mở rộng `zalo-message.mapper.ts`, không skip object `content` | Đúng chỗ đang drop tin |
| 2 | Nơi download/persist media | `ZaloMediaService` trong `modules/zalo` | Cookie session Zalo thuộc `ZaloService`; mapper giữ thuần |
| 3 | Nơi hiểu nội dung | Orchestrator vẫn là `OmnichatBotService`; hiểu ảnh/file qua `AiAgentService` | Không tách pipeline thứ hai |
| 4 | Vision model | **Cùng** `AI_CHAT_MODEL` (`qwen3.7-plus`) | Đã multimodal; tránh 2 agent lệch persona |
| 5 | URL đưa cho LLM | Tải về (cookie Zalo) → upload R2 public URL; fallback data-URL base64 nếu R2 tắt | CDN Zalo (`f*-zpc.zdn.vn`) hết hạn / cần auth |
| 6 | Storage | Tái dùng `R2Service` sẵn có, prefix `zalo-inbound/{shopId}/{yyyy-mm}/{msgId}` | Không thêm provider |
| 7 | Trả lời mặc định | **Text + quote** tin khách | Đủ cho CSKH; outbound media là P8 |
| 8 | Nhóm + media | Cùng rule “bot được gọi”: mention, tên trong caption, hoặc quote tin của bot | Tránh spam nhóm khi ai đó gửi meme |
| 9 | History | Lưu bản mô tả text + metadata media; không nhét binary | Redis cache 10 turn vẫn nhỏ |

---

## 4. Hình dạng tin Zalo (thực tế `zca-js`)

### 4.1 Ảnh — `msgType: chat.photo`

`content` object:

- `href`, `thumb`
- `title` / `description` (caption, thường rỗng)
- `params` JSON: `width`, `height`, `hd`, `hdSize`, `rawUrl`

### 4.2 Sticker — `msgType: chat.sticker`

`content` object:

- `id`, `catId` (hoặc `cateId`), `type`
- `href` sticker webp (ví dụ `zalo-api.zadn.vn/api/emoticon/sticker/webpc?eid=...`)

Gửi ra (P8): `api.getStickers(keyword)` → `getStickersDetail` → `api.sendSticker({ id, cateId, type }, threadId, type)`.

### 4.3 File — `msgType: share.file` / `chat.file`

`TAttachmentContent`: `title` (tên file), `href`, `thumb`, `params` (size).

### 4.4 Gửi media (P8) — API đã có, backend chưa bọc

| Việc | API `zca-js` |
|------|----------------|
| Ảnh / file | `sendMessage({ msg, attachments: [path\|buffer] })` hoặc `uploadAttachment` |
| Sticker | `getStickers` + `getStickersDetail` + `sendSticker` |
| Voice | `sendVoice({ voiceUrl })` |
| Video | `sendVideo({ videoUrl, thumbnailUrl, duration, width, height })` |

`src/types/zca-js.d.ts` hiện chỉ khai `sendMessage` / `sendTypingEvent` — P7/P8 phải mở rộng type local cho các method trên.

---

## 5. Luồng mục tiêu

```
Zalo listener
  → mapIncomingZaloMessage()          # text + photo + sticker + file + …
  → skip isSelf / thiếu threadId
  → resolve sender + group addressed
        ├─ nhóm chưa gọi bot → save history (kể cả media mô tả) → return
        └─ 1-1 hoặc đã gọi bot
              → ZaloMediaService.ingest()     # download + R2 (nếu có media)
              → build user turn (text + media refs)
              → AiAgentService.run()          # multimodal khi có ảnh
              → ZaloService.sendMessage(text, quote)
              → saveHistoryPair (text hóa media)
```

### 5.1 Rule “bot được gọi” khi không có text

1. 1-1: luôn xử lý.
2. Nhóm + caption/text: giữ `isGroupBotAddressed` / `stripBotAddressFromContent`.
3. Nhóm + media, caption rỗng: chỉ xử lý nếu `quote` trỏ tới tin của bot (`uidFrom === ownId`).
4. Nhóm + sticker đơn: persist, không reply (giống tin nhóm không mention).

### 5.2 Chiến lược hiểu từng loại

**Ảnh**

1. Ingest `href` hoặc `params.hd` / `rawUrl`.
2. Gọi agent với `content` parts: `image_url` + text (caption, tên người, lịch sử, quote).
3. Prompt: mô tả ngắn → nếu liên quan sản phẩm/dịch vụ cửa hàng thì gọi `knowledge_base` **một lần**.

**Sticker**

1. P7: không bắt buộc vision. User turn = `[Khách gửi sticker]` + `stickerId` nếu có.
2. 1-1: LLM trả lời ngắn, **cấm** gọi knowledge tool trừ khi kèm caption hỏi hàng.
3. Optional: nếu `href` tải được, có thể gửi thumbnail vào vision để đoán cảm xúc — không chặn P7 nếu skip.

**File**

| MIME / extension | Xử lý |
|------------------|--------|
| `image/*` | Như ảnh |
| `.txt`, `.md`, `.csv` | Đọc UTF-8, cắt theo `BOT_MEDIA_MAX_TEXT_CHARS` |
| `.xlsx` / `.xls` | `FileService.readExcel` sẵn có |
| `.pdf` | Thêm parser có chủ đích (pdf-parse hoặc tương đương) — chỉ khi P7 file bật |
| `.doc` / `.docx` | Optional mammoth; nếu chưa có → “mình chưa đọc được file Word, bạn gửi ảnh hoặc PDF giúp” |
| `.zip`, `.exe`, `.apk`, … | Từ chối, không tải |

**Quote media + câu hỏi text**

Khách: gửi ảnh → tin sau: “cái này còn hàng không?” (quote ảnh).

Hiện quote chỉ dùng lúc **gửi** reply, **không** đưa vào agent. P7 phải:

- Parse `quote.content` / `quote.msgType`
- Nếu quote là photo/file → ingest như tin hiện tại
- Gắn vào user turn: “Tin được trích dẫn: [ảnh] + câu hỏi hiện tại”

---

## 6. Thiết kế module (bám folder hiện có)

Không module mới kiểu `utils`. Mở rộng domain `zalo`, `omnichat-bot`, `ai-agent`.

### 6.1 `modules/zalo`

```
enums/zalo.enum.ts                    # + ENUM_ZALO_MESSAGE_KIND
constants/zalo.constant.ts            # msgType map, max size, allowed ext
interfaces/zalo.interface.ts          # IZaloIncomingMedia, mở IZaloMessage
mappers/zalo-message.mapper.ts        # parse text | attachment | sticker
mappers/zalo-message.kind.mapper.ts   # msgType → ENUM (file riêng, 1 trách nhiệm)
services/zalo-media.service.ts        # download bằng cookie session, upload R2
services/zalo.service.ts              # P8: sendAttachment / sendSticker
types/zca-js.d.ts                     # sendSticker, uploadAttachment, sendVoice, …
```

`ENUM_ZALO_MESSAGE_KIND`:

```ts
TEXT = 'text',
PHOTO = 'photo',
STICKER = 'sticker',
FILE = 'file',
VOICE = 'voice',
VIDEO = 'video',
UNKNOWN = 'unknown',
```

`IZaloMessage` mở rộng (giữ `messageContent` để không gãy caller):

```ts
kind: ENUM_ZALO_MESSAGE_KIND;
messageContent: string;          // text thật hoặc mô tả: "[ảnh] caption"
media?: IZaloIncomingMedia;
quotedKind?: ENUM_ZALO_MESSAGE_KIND;
quotedMedia?: IZaloIncomingMedia;
```

`messageContent` luôn là string **sau** map (placeholder nếu không có caption) để group-address, stop-keyword, history cũ vẫn chạy.

### 6.2 `modules/omnichat-bot`

```
constants/omnichat-bot.constant.ts    # placeholder text, max chars
interfaces/omnichat-bot.interface.ts  # history item + kind/mediaUrl?
entities/zalo-chat-history.entity.ts  # + kind, mediaUrl, mediaTitle (optional)
services/omnichat-bot.service.ts      # ingest → agent input multimodal
```

Placeholder thống nhất (constants, không hard-code rải rác):

- `[Khách gửi ảnh]`
- `[Khách gửi sticker]`
- `[Khách gửi file: {title}]`
- `[Khách gửi voice]`

### 6.3 `modules/ai-agent`

```
interfaces/ai-agent.interface.ts      # IAiAgentMediaPart { type, url, mime? }
constants/ai-agent.prompt.constant.ts # rule media
services/ai-agent.service.ts          # messages multimodal khi có parts
```

`IAiAgentInput`:

```ts
message: string;
mediaParts?: Array<{ type: 'image_url' | 'input_audio'; url: string }>;
quotedContext?: string;
```

Khi `mediaParts` có ảnh: `messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url } }, { type: 'text', text: prompt }] }]`.

Khi không có media: giữ payload text như hiện tại (không đổi hành vi P5).

Cập nhật system prompt:

- Có ảnh/file → đọc nội dung trước, rồi mới quyết định gọi `knowledge_base`.
- Sticker không kèm câu hỏi hàng → không gọi tool, trả lời ngắn.
- Không bịa giá/tồn kho từ ảnh nếu tool không trả về.

### 6.4 `ZaloMediaService` (trách nhiệm)

1. Quyết định có cần tải không (`kind` + size estimate từ `params`).
2. Download HTTP với cookie/user-agent của session (`ZaloService` expose helper, không leak cookie ra bot).
3. Validate magic-bytes / MIME allow-list, max bytes.
4. Upload R2; trả `IZaloIngestedMedia { kind, publicUrl, fileName, mime, byteSize }`.
5. Timeout và lỗi: bot vẫn trả lời được bằng placeholder (“mình nhận ảnh nhưng chưa xem được, bạn mô tả giúp”).

Không nhét download vào mapper. Không nhét R2 vào `AiAgentService`.

---

## 7. Data model

Collection `zalo_chat_history` — thêm field optional, **không** đổi tên collection:

| Field | Kiểu | Ghi chú |
|-------|------|---------|
| `kind` | string enum | default `text` — tương thích document cũ |
| `mediaTitle` | string? | tên file / sticker id |
| `mediaUrl` | string? | URL R2 (TTL/lifecycle có thể xóa file, history text vẫn còn) |

`content` vẫn bắt buộc: luôn là bản text hóa để Redis cache và prompt history không vỡ.

Index: giữ `{ userId, timestamp }`, `{ threadId, timestamp }`. Không cần index `kind` lúc đầu.

---

## 8. Config & env

Thêm vào `src/configs/ai.config.ts` (hoặc `zalo.config.ts` nếu key thuộc Zalo) **và** `.env.example`:

```
# Inbound media (P7)
BOT_MEDIA_ENABLED=true
BOT_MEDIA_MAX_BYTES=10485760
BOT_MEDIA_MAX_TEXT_CHARS=8000
BOT_MEDIA_DOWNLOAD_TIMEOUT_MS=15000
BOT_MEDIA_ALLOWED_KINDS=photo,sticker,file
BOT_MEDIA_VISION_ENABLED=true
```

Default an toàn: bật photo+sticker; file có thể tắt bằng allow-list nếu chưa chốt parser PDF.

R2: dùng key hiện có (`R2_*`). Nếu R2 trống → log warn, vision dùng data-URL chỉ với ảnh < ~2MB; ảnh lớn thì fallback text.

---

## 9. Lộ trình triển khai

Làm tuần tự, mỗi phase merge được, có test.

### P7.0 — Quan sát (ngắn, bắt buộc trước khi code hiểu)

Log `msgType` + `typeof content` ở listener/mapper (không persist PII URL đầy đủ). Xác nhận production đang gửi `chat.photo` / `chat.sticker` / `share.file`. Điều chỉnh map `msgType` nếu Zalo đổi tên.

Nghiệm thu: worker log kind thật khi khách gửi ảnh/sticker.

### P7.1 — Mapper + enum + không còn drop tin

- Parse object content → `kind` + `media` + `messageContent` placeholder.
- Quote extract giữ `msgType` gốc (đã có), bổ sung `quotedKind` / `quotedMedia`.
- Sửa spec: bỏ “skips non-text”; thêm case photo / sticker / file / empty object.

Nghiệm thu: unit test mapper; tin ảnh 1-1 **đi vào** `OmnichatBotService` (chưa cần vision).

### P7.2 — Pipeline text hóa (không vision)

- 1-1 ảnh/sticker/file → agent nhận `"[Khách gửi ảnh]"` + caption.
- Nhóm: rule addressed mục 5.1.
- History lưu placeholder.
- Stop keyword chỉ trên text/caption (sticker không match `stop`).

Nghiệm thu: gửi sticker 1-1 → bot trả lời được; gửi sticker nhóm không mention → không reply, có history.

### P7.3 — Ingest + vision ảnh

- `ZaloMediaService` + R2.
- `AiAgentService` multimodal.
- Prompt media.
- Giới hạn 1 ảnh / lượt (Zalo album: lấy `href` đầu hoặc `hd`).

Nghiệm thu: gửi ảnh sản phẩm / biển hiệu + “cái này là gì?” → câu trả lời bám ảnh; hỏi giá → gọi knowledge 1 lần hoặc fallback đúng rule hiện có.

### P7.4 — File an toàn

- Allow-list extension.
- Ảnh-trong-file → P7.3.
- Text/xlsx → cắt chữ đưa vào prompt.
- PDF nếu thêm dependency — chỉ khi cần; không thêm package “cho có”.

Nghiệm thu: gửi `.txt` hỏi nội dung → bot tóm tắt; gửi `.exe` → từ chối; không crash worker.

### P7.5 — Quote media

- Câu hỏi text quote ảnh/file → ingest quote, gắn `quotedContext` + `mediaParts`.

Nghiệm thu: ảnh rồi tin “cái này còn không?” (reply) → bot không hỏi lại “bạn gửi ảnh nào”.

### P8 — Bot gửi media

- `ZaloService.sendAttachment({ shopId, threadId, type, message, filePath | buffer })`.
- Agent structured output **sau** khi text ổn: ví dụ tool `send_shop_image` chỉ khi knowledge trả `imageUrl` tin cậy trên R2/CDN mình.
- Sticker: map cảm xúc → `getStickers` **có cache Redis**; fail → chỉ gửi text.
- Mở REST admin send (DTO hiện bắt `message` string) chỉ khi cần test thủ công.

Nghiệm thu: hỏi “gửi bảng giá” (khi KB có file) → khách nhận file/ảnh; lỗi upload → vẫn có câu text.

### P9 — Voice / video (tuỳ nhu cầu)

Voice: ingest → `input_audio` hoặc transcribe rồi P5. Video: chỉ thumbnail + “mình chưa xem được video, bạn gửi ảnh/nói giúp”.

---

## 10. Điểm sửa code cụ thể (P7)

| File | Việc |
|------|------|
| `zalo-message.mapper.ts` | Bỏ early-return non-string; luôn set `kind` |
| `zalo-message.mapper.spec.ts` | Case photo/sticker/file/quote-photo |
| `zalo.interface.ts` | Media fields |
| `zalo.enum.ts` | `ENUM_ZALO_MESSAGE_KIND` |
| `zalo.constant.ts` | Map `msgType`, limit |
| `zca-js.d.ts` | Method media |
| `zalo-media.service.ts` | **Mới** — download + R2 |
| `zalo.module.ts` | Provide `ZaloMediaService` |
| `omnichat-bot.service.ts` | Ingest, group rule, truyền mediaParts |
| `omnichat-bot.service.spec.ts` | 1-1 photo reply; group sticker skip |
| `zalo-chat-history.*` | Field optional + save kind |
| `ai-agent.interface.ts` / `ai-agent.service.ts` | Multimodal invoke |
| `ai-agent.prompt.constant.ts` | Rule ảnh/sticker/file |
| `.env.example` + `ai.config.ts` / `zalo.config.ts` | Key mục 8 |

`ZaloListenerService` gần như không đổi: vẫn `handleIncomingMessage`. Chỉ log `kind` sau normalize.

---

## 11. Kiểm thử

### Unit

- Mapper: mọi `msgType` đã biết; content string rỗng + photo thumb; sticker thiếu `id`.
- Group address: photo + mention trong caption; photo không caption không quote → false.
- Media service: file quá lớn; MIME không cho; R2 down → fallback.
- Agent: không có media → vẫn text path (regression P5).

### Tích hợp thủ công (worker + Zalo thật)

1. 1-1 text — không regress.
2. 1-1 sticker.
3. 1-1 ảnh có caption hỏi hàng.
4. 1-1 ảnh không caption.
5. Nhóm ảnh không mention — im.
6. Nhóm `@bot` + ảnh.
7. Quote ảnh rồi hỏi.
8. File txt / file cấm.

Không e2e Zalo trên CI (cần session). Unit + spec là cổng bắt buộc.

Sau P7.1+ chạy `yarn test` (mapper + bot) và type-check.

---

## 12. Rủi ro

| Rủi ro | Cách xử lý |
|--------|------------|
| URL Zalo hết hạn / 403 | Download ngay lúc nhận, dùng cookie session; lưu R2 |
| Ảnh lớn / album | Max bytes; 1 ảnh/lượt; timeout download |
| Vision tốn token / chậm | `BOT_MEDIA_VISION_ENABLED`; sticker P7 không vision |
| PDF parser nặng | Phase riêng; default từ chối “gửi ảnh hoặc paste text” |
| Cookie Zalo lộ qua URL log | Log chỉ `kind`, `msgId`, size — không log full `href` |
| Sticker spam 1-1 | Rate-limit sẵn của worker/pipeline nếu có; câu trả lời ngắn |
| `qwen3.7-plus` vision lệch region | Spike P7.0: 1 request `image_url` DashScope; nếu fail, tách `AI_VISION_MODEL=qwen-vl-plus` |
| R2 chưa cấu hình production | Fallback data-URL nhỏ; ảnh lớn → text fallback |

---

## 13. Tiêu chí xong P7 (inbound)

- [ ] Tin sticker/ảnh/file **không** bị `mapIncomingZaloMessage` trả `null` chỉ vì `content` là object
- [ ] 1-1: khách gửi ảnh hỏi về cửa hàng → bot trả lời có căn cứ (vision + RAG khi cần)
- [ ] 1-1: sticker không kèm hỏi hàng → bot trả lời ngắn, không gọi knowledge
- [ ] Nhóm: media không gọi bot → không reply, vẫn lưu history mô tả
- [ ] Quote ảnh + câu hỏi → bot dùng được ngữ cảnh ảnh
- [ ] File không an toàn bị từ chối; worker không crash
- [ ] History/Redis vẫn 10 turn, document cũ không `kind` vẫn đọc được
- [ ] Env mới có trong `.env.example` + config
- [ ] Test mapper + bot service pass; không phá luồng text hiện tại

P8/P9 không chặn đóng P7.

---

## 14. Gợi ý chia PR khi code

1. **PR A — parse:** mapper + enum + bot text-hóa + tests (P7.1–P7.2)
2. **PR B — vision:** `ZaloMediaService` + multimodal agent + env (P7.3, P7.5)
3. **PR C — file:** allow-list + extract (P7.4)
4. **PR D — outbound:** send attachment/sticker (P8)

Không gộp A+D. A đã làm bot “trả lời được” sticker/ảnh ở mức hội thoại; B làm bot “hiểu ảnh”.
