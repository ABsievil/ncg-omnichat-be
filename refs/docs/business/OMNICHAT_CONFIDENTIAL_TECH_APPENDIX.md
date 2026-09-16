# OMNICHAT — PHỤ LỤC KỸ THUẬT & BÍ MẬT TRIỂN KHAI (TÀI LIỆU MẬT)

> ⛔ **TÀI LIỆU MẬT — KHÔNG CHIA SẺ RA NGOÀI NHÓM SÁNG LẬP / KỸ SƯ CORE.**
>
> Tài liệu này là phụ lục kỹ thuật của `OMNICHAT_BUSINESS_MASTER_PLAN.md`, chứa toàn bộ chi tiết **cách triển khai và implement** dự án: đường tích hợp nền tảng, kiến trúc hệ thống, cơ chế AI, bí quyết vận hành bot trong nhóm, chiến lược chi phí. Tài liệu business chính có thể chia sẻ cho đối tác/nhà đầu tư/nhân sự mới; **tài liệu này thì không** — chỉ cấp quyền theo nguyên tắc need-to-know và sau khi ký NDA.
>
> Phiên bản: 1.0 — Tháng 09/2026

---

## MỤC LỤC

- [A. Đường tích hợp Zalo: chi tiết kỹ thuật](#a-đường-tích-hợp-zalo-chi-tiết-kỹ-thuật)
- [B. Luồng hoạt động chi tiết của chatbot trong nhóm](#b-luồng-hoạt-động-chi-tiết-của-chatbot-trong-nhóm)
- [C. Cơ chế AI: pipeline RAG, guardrails và học liên tục](#c-cơ-chế-ai-pipeline-rag-guardrails-và-học-liên-tục)
- [D. Bí quyết cốt lõi: hành vi bot trong ngữ cảnh "nhóm"](#d-bí-quyết-cốt-lõi-hành-vi-bot-trong-ngữ-cảnh-nhóm)
- [E. Hiện trạng codebase](#e-hiện-trạng-codebase)
- [F. Kiến trúc hệ thống mục tiêu](#f-kiến-trúc-hệ-thống-mục-tiêu)
- [G. Quyết định kiến trúc then chốt](#g-quyết-định-kiến-trúc-then-chốt)
- [H. Chỉ tiêu kỹ thuật (SLO) & chiến lược chi phí AI](#h-chỉ-tiêu-kỹ-thuật-slo--chiến-lược-chi-phí-ai)
- [I. Ghi chú POC & lộ trình chuyển đổi sang production](#i-ghi-chú-poc--lộ-trình-chuyển-đổi-sang-production)
- [J. Việc kỹ thuật Giai đoạn 0 (chi tiết)](#j-việc-kỹ-thuật-giai-đoạn-0-chi-tiết)

---

## A. ĐƯỜNG TÍCH HỢP ZALO: CHI TIẾT KỸ THUẬT

### A.1. Điều kiện tiên quyết phía Zalo

- Zalo OA **đã xác thực**, đang sử dụng **gói Nâng cao hoặc Premium**.
- Kích hoạt tính năng **GMF (Group Management Function)** — mua gói GMF theo số nhóm (GMF 10 / 50 / 100 / 1000, giá 25.000–300.000đ/gói/tháng theo bảng giá Zalo Cloud 01/2026).
- Ứng dụng (Zalo App) được cấp quyền **quản lý thông tin nhóm**; OA cấp access token cho ứng dụng (kèm cơ chế refresh token định kỳ).

### A.2. Các endpoint OpenAPI then chốt

| Tác vụ | Endpoint | Ghi chú |
|---|---|---|
| Lấy hạn mức tạo nhóm GMF (asset) | `GET /v3.0/oa/group/...` (API lấy quota, trả về `asset_id`) | Gọi trước khi tạo nhóm |
| Tạo nhóm mới với OA | `POST https://openapi.zalo.me/v3.0/oa/group/creategroupwithoa` | Body: `group_name`, `asset_id`, `member_user_ids` (≤ 99, có ≥ 1 admin OA); response trả `group_id`, `group_link` |
| Gửi tin nhắn vào nhóm | `POST https://openapi.zalo.me/v3.0/oa/group/message` | Body: `recipient.group_id` + `message.text` hoặc `message.attachment` (image/gif/sticker theo template media) |
| Nhận sự kiện tin nhắn nhóm | Webhook OA (đăng ký trên Zalo App) | Sự kiện tin nhắn từ user trong nhóm đẩy về endpoint webhook của Omnichat |

- Định dạng tin gửi nhóm tuân theo **tin Tư vấn** (consultation format); ảnh jpg/png ≤ 1MB, caption ≤ 2.000 ký tự.
- Trạng thái nhóm `enabled/disabled` quyết định OA có gửi tin được hay không — cần đồng bộ trạng thái định kỳ.
- **Chi phí tin**: tin OA gửi vào nhóm GMF miễn phí đến 31/12/2026 (theo dõi bảng giá hàng quý; thiết kế sẵn bộ đếm tin/nhóm/tháng để chuyển sang mô hình tính phí khi Zalo áp giá).

### A.3. Quản lý token & multi-tenant

- Mỗi `client` (doanh nghiệp) kết nối 1+ OA: lưu `app_id`, `oa_id`, access token + refresh token **mã hóa AES** trong DB; job tự refresh trước khi hết hạn.
- Webhook nhận chung 1 endpoint, định tuyến theo `oa_id` → `client` → cấu hình nhóm tương ứng.

---

## B. LUỒNG HOẠT ĐỘNG CHI TIẾT CỦA CHATBOT TRONG NHÓM

1. Doanh nghiệp kết nối Zalo OA (OAuth) với Omnichat; Omnichat đồng bộ danh sách nhóm GMF hoặc tạo nhóm mới qua API (mục A.2).
2. Khách nhắn trong nhóm → webhook đẩy sự kiện → API Gateway xác thực chữ ký → **enqueue vào Redis Queue** (trả 200 ngay cho Zalo để tránh timeout/retry).
3. Worker lấy message khỏi queue → Conversation Engine dựng ngữ cảnh (lịch sử hội thoại nhóm, hồ sơ người gửi, cấu hình bot của nhóm) → quyết định:
   - **Trả lời**: câu hỏi thuộc phạm vi tri thức → AI Service sinh câu trả lời → gửi vào nhóm qua `POST /v3.0/oa/group/message`.
   - **Escalate**: câu phức tạp / khiếu nại / cảm xúc tiêu cực (phát hiện qua classifier) → gắn tag, notify agent phụ trách, bot gửi tin giữ nhịp ("Em đã ghi nhận, anh A sẽ hỗ trợ mình trong ít phút ạ").
   - **Im lặng**: hội thoại không hướng tới doanh nghiệp (xem mục D).
4. Mọi tin (của khách, của bot, của agent) được ghi vào MongoDB theo `conversation`, đồng bộ realtime lên Unified Inbox; sự kiện đo lường đẩy vào pipeline analytics.

---

## C. CƠ CHẾ AI: PIPELINE RAG, GUARDRAILS VÀ HỌC LIÊN TỤC

### C.1. Pipeline RAG

1. **Nạp tri thức**: doanh nghiệp upload bảng giá, chính sách, tài liệu hướng dẫn, lịch sử Q&A → chunking → embedding → lưu vector store (namespace theo `client`).
2. **Truy hồi**: câu hỏi của khách → embedding → similarity search (kết hợp keyword/BM25 hybrid cho tiếng Việt) → top-k ngữ cảnh.
3. **Sinh trả lời**: prompt có kiểm soát gồm: persona bot (xưng hô, tông giọng theo cấu hình doanh nghiệp) + ngữ cảnh truy hồi + lịch sử hội thoại rút gọn → LLM sinh câu trả lời.
4. **Hậu kiểm**: lớp kiểm tra đầu ra trước khi gửi (xem C.2); gắn citation nội bộ (câu trả lời truy vết được về tài liệu nguồn — hiển thị cho agent, không hiển thị cho khách).

### C.2. Guardrails (lớp bảo vệ đầu ra)

- **Không bịa số liệu**: giá/chính sách chỉ được lấy nguyên văn từ tri thức truy hồi; nếu không tìm thấy → từ chối lịch sự + escalate, tuyệt đối không để LLM tự suy đoán.
- **Không hứa hẹn ngoài chính sách**: danh sách chủ đề cấm (cam kết hoàn tiền, pháp lý, y tế...) → luôn escalate.
- **Phạm vi trả lời giới hạn** theo cấu hình từng nhóm (whitelist chủ đề).
- Chế độ **"duyệt trước khi gửi"** (human approval) cho doanh nghiệp thận trọng hoặc trong giai đoạn onboarding bot.

### C.3. Học liên tục (feedback loop)

- Agent sửa câu trả lời sai của bot trong Inbox → cặp (câu hỏi, câu trả lời đúng) được đưa vào tập tri thức có kiểm duyệt → cải thiện truy hồi cho lần sau.
- Đánh giá mẫu hàng tuần (50 hội thoại/tuần) bởi người → đo tỷ lệ trả lời đúng ≥ 90%, deflection rate ≥ 60%.
- Tập dữ liệu Q&A theo ngành tích lũy theo thời gian = **moat dữ liệu** (bot ngành giáo dục/bán lẻ ngày càng giỏi hơn đối thủ mới vào).

---

## D. BÍ QUYẾT CỐT LÕI: HÀNH VI BOT TRONG NGỮ CẢNH "NHÓM"

> Đây là khác biệt khó copy nhất so với chatbot 1-1 và là know-how quan trọng nhất của sản phẩm.

1. **Bot biết khi nào nên im lặng**: classifier phân loại mỗi tin trong nhóm — (a) câu hỏi hướng tới doanh nghiệp, (b) hội thoại giữa các thành viên với nhau, (c) tin nội bộ của nhân viên. Chỉ (a) được xử lý trả lời; (b)(c) chỉ ghi nhận vào ngữ cảnh.
2. **Cơ chế kích hoạt đa chế độ**: mention bot / từ khóa cấu hình / chế độ chủ động (bot tự trả lời khi confidence cao) — mỗi nhóm chọn chế độ riêng, kèm ngưỡng confidence có thể tinh chỉnh.
3. **Anti-spam & anti-loop**: rate-limit số tin bot/nhóm/giờ; cooldown sau mỗi lần bot nói; phát hiện và chặn vòng lặp bot-trả-lời-bot (khi nhóm có nhiều bot); gộp nhiều câu hỏi liên tiếp của cùng một người thành một lượt trả lời.
4. **Phân biệt vai trò**: mapping thành viên nhóm → khách hàng / nhân viên nội bộ / quản trị viên (đồng bộ từ danh bạ OA + cấu hình client); nhân viên nhắn thì bot nhường, không chen ngang.
5. **Quiet hours & nhịp nói chuyện**: khung giờ bot chủ động/bị động theo cấu hình; xử lý pattern "tin nhắn chia nhỏ nhiều dòng" đặc trưng chat Việt (đợi gom tin trong cửa sổ vài giây trước khi xử lý).
6. **Văn hóa chat Việt**: chuẩn hóa teencode/viết tắt trước khi truy hồi; sinh câu trả lời đúng xưng hô (anh/chị/em) theo hồ sơ người hỏi và persona cấu hình.

---

## E. HIỆN TRẠNG CODEBASE

- **Stack**: NestJS (TypeScript), MongoDB (Mongoose), Redis; cấu trúc module hóa `src/app`, `src/common` (database, helper, request, response...), `src/router`, `src/configs`, đa ngôn ngữ `src/languages` (vi/en).
- **Đã có sẵn**: config tập trung qua `ConfigService`, middleware pipeline chuẩn, repository base cho database, chuẩn response/exception thống nhất, hạ tầng Redis, khung tích hợp Firebase/R2/PubSub, khung mã hóa AES.
- Quy tắc phát triển tuân theo `refs/docs/AI_CLEAN_CODE_RULES.md` (naming theo domain Omnichat: `omnichat`, `session`, `client`, `conversation`).
- Hiện trạng chi tiết: xem `refs/docs/AUDIT_BASE_SETUP.md`.

---

## F. KIẾN TRÚC HỆ THỐNG MỤC TIÊU

```
                    ┌──────────────────────────────┐
   Zalo GMF webhook │                              │   Web App (Inbox,
   Messenger webhook│      API GATEWAY (NestJS)    │◄── Dashboard, Cấu hình)
   Telegram webhook ├──────────────────────────────┤
                    │  Channel Connector Services  │
                    │  (zalo / messenger / ...)    │
                    └──────────┬───────────────────┘
                               │ enqueue (Redis Queue)
                    ┌──────────▼───────────────────┐
                    │   CONVERSATION ENGINE        │
                    │  - Session & context manager │
                    │  - Routing rules / escalate  │
                    └──────────┬───────────────────┘
                               │
                ┌──────────────┼──────────────────┐
                ▼              ▼                  ▼
        ┌────────────┐  ┌────────────┐  ┌───────────────┐
        │ AI SERVICE │  │  INBOX &   │  │  ANALYTICS    │
        │ RAG + LLM  │  │  AGENT API │  │  & REPORTING  │
        │ guardrails │  └────────────┘  └───────────────┘
        └─────┬──────┘
              ▼
     Vector store (tri thức DN)     MongoDB (hội thoại, khách, cấu hình)
     LLM providers (đa nhà cung    Redis (cache, queue, rate-limit)
     cấp, failover)                Object storage (R2 — file, media)
```

---

## G. QUYẾT ĐỊNH KIẾN TRÚC THEN CHỐT

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Xử lý webhook | Queue-based (Redis), xử lý bất đồng bộ | Webhook Zalo yêu cầu phản hồi nhanh; chịu tải burst khi nhiều nhóm hoạt động đồng thời |
| LLM | Trừu tượng hóa đa nhà cung cấp (adapter pattern) | Tránh khóa chặt 1 vendor; tối ưu chi phí/chất lượng theo tác vụ (câu ngắn dùng model rẻ) |
| Multi-tenancy | Logical isolation theo `client` ngay từ đầu | SaaS nhiều doanh nghiệp trên cùng hạ tầng; sẵn đường nâng cấp dedicated cho Enterprise |
| Dữ liệu hội thoại | Lưu đầy đủ + TTL/archive theo gói | Vừa phục vụ phân tích, vừa kiểm soát chi phí lưu trữ và tuân thủ dữ liệu cá nhân |
| Bảo mật | Mã hóa AES đã có sẵn khung; secrets qua env; audit log từ V2 | Chuẩn bị cho yêu cầu bảo vệ dữ liệu cá nhân (Luật BVDLCN 2026) |

---

## H. CHỈ TIÊU KỸ THUẬT (SLO) & CHIẾN LƯỢC CHI PHÍ AI

### H.1. SLO mục tiêu

- Độ trễ bot trả lời (webhook → tin gửi vào nhóm): **p50 < 3s, p95 < 8s**.
- Uptime nền tảng: **99,5%** (MVP) → **99,9%** (thương mại).
- Throughput: 50 tin/giây (MVP) → 500 tin/giây (Giai đoạn 3) với horizontal scaling worker.
- Tỷ lệ webhook xử lý thành công ≥ 99,9%.

### H.2. Chiến lược chi phí AI (bảo vệ biên lợi nhuận)

- Mục tiêu: **chi phí LLM trung bình < 100đ/lượt trả lời** — làm nền cho giá bán vượt hạn mức 200–300đ/lượt (biên ≥ 60%).
- Kỹ thuật: (1) **semantic cache** câu hỏi trùng/tương tự theo từng client — tỷ lệ câu lặp lại cao là đặc thù CSKH; (2) **model routing theo độ khó** — phân loại nhanh bằng model rẻ, chỉ dùng model mạnh cho câu phức tạp; (3) rút gọn ngữ cảnh hội thoại đưa vào prompt; (4) đàm phán giá volume với nhà cung cấp LLM khi đạt quy mô.

---

## I. GHI CHÚ POC & LỘ TRÌNH CHUYỂN ĐỔI SANG PRODUCTION

- POC đã xác thực: bot nhận/gửi tin trong nhóm Zalo theo thời gian thực, hội thoại tự nhiên.
- **Điểm nhạy cảm**: nếu đường tích hợp của POC đi qua tài khoản cá nhân (unofficial API), thì đây chỉ là công cụ xác thực ý tưởng — **tuyệt đối không đưa vào sản phẩm thương mại** (vi phạm điều khoản Zalo, rủi ro khóa tài khoản khách, rủi ro pháp lý). Sản phẩm thương mại chỉ dùng OA + GMF OpenAPI (mục A).
- Việc chuyển đổi cần xác thực từng năng lực trên GMF OpenAPI: nhận sự kiện tin nhóm qua webhook, gửi text/ảnh/sticker, quản lý thành viên, giới hạn 99 thành viên khi tạo nhóm qua API, hành vi khi nhóm `disabled`.
- **Fallback** cho tính năng nhóm mà GMF chưa hỗ trợ: bot phản hồi qua OA 1-1 kèm điều hướng, hoặc yêu cầu admin thao tác thủ công có hướng dẫn.
- Các câu hỏi mở cần đo trước khi bán rộng: webhook throughput thực tế của Zalo, độ trễ end-to-end dưới tải, hạn mức API (rate limit) chưa công bố rõ.

---

## J. VIỆC KỸ THUẬT GIAI ĐOẠN 0 (CHI TIẾT)

- Chuẩn hóa tích hợp Zalo OA + GMF OpenAPI: webhook nhóm, gửi tin nhóm, quản lý `group_id`, vòng đời access/refresh token.
- Hoàn thiện backend Omnichat: module `conversation`, `client`, `session`, connector `zalo`; hạ tầng queue xử lý webhook trên Redis.
- Dựng engine AI v0: pipeline RAG (nạp tài liệu → embedding → truy hồi → sinh trả lời có guardrails) theo mục C.
- Exit criteria kỹ thuật: 1 nhóm Zalo demo chạy ổn định 2 tuần liên tục qua đường API chính thức, độ trễ trả lời < 5 giây.

---

## QUY TẮC BẢO MẬT TÀI LIỆU

1. Chỉ founder + kỹ sư core được truy cập; nhân sự mới chỉ được cấp sau khi ký NDA và theo nguyên tắc need-to-know.
2. Không đính kèm tài liệu này (hoặc trích nội dung) vào pitch deck, email đối tác, tài liệu bán hàng. Khi nhà đầu tư yêu cầu technical due diligence, trích xuất bản riêng đã được duyệt.
3. Mọi thay đổi kiến trúc/bí quyết quan trọng cập nhật vào đây, không ghi vào tài liệu business chính.

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0 | 09/2026 | Tách nội dung kỹ thuật & bí mật triển khai từ tài liệu business tổng thể v1.0 |
