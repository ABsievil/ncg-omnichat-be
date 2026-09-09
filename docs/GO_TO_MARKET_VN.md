# OmniChat — Chiến lược, Kế hoạch & Cách triển khai ra thị trường Việt Nam (v2.0)

> **Phiên bản:** 2.0 · **Ngày:** 2026-09-09 · **Sản phẩm:** https://omnichat.ncgstudio.tech/
> **Thay thế:** `refs/docs/CHIẾN LƯỢC GO-TO-MARKET OMNICHAT — THỊ TRƯỜNG VIỆT NAM.pdf` (v1.0).
> **Khác biệt với v1.0:** v1.0 viết cho một sản phẩm "inbox đa kênh + CRM cho chuỗi nhiều chi nhánh" — **chưa tồn tại trong code**. v2.0 bám đúng năng lực thực tế của `ncg-omnichat-be` / `ncg-omnichat-fe` hôm nay, chọn một điểm vào (wedge) bán được **ngay**, rồi mở rộng dần về tầm nhìn v1.0.
> **Nguồn đối chiếu:** `src/modules/*`, `src/worker/*`, `docs/ZALO_MIGRATION.md`, `refs/docs/AUDIT_BASE_SETUP.md`, FE `lib/**`, khảo sát giá đối thủ & Zalo OA tháng 9/2026.

---

## 0. Tóm tắt điều hành — 6 quyết định then chốt

| # | Quyết định | Lựa chọn |
|---|-----------|----------|
| 1 | **Bán cái gì hôm nay** | "Trợ lý AI trực Zalo cá nhân 24/7 cho chủ shop / người bán hàng cá nhân" — kết nối bằng quét QR 1 phút, AI trả lời theo kiến thức của shop. Đây là đúng thứ code đang làm. |
| 2 | **Khách hàng đầu tiên (ICP)** | Cá nhân/hộ kinh doanh và shop 1–5 người, tư vấn chủ yếu qua **Zalo cá nhân**, đang mất khách vì trả lời chậm/ngoài giờ. Không bán cho chuỗi/doanh nghiệp cần API chính thức ở giai đoạn này. |
| 3 | **Hai đường ray (track)** | **Track A (0–3 tháng):** thương mại hoá bot Zalo cá nhân, học thị trường, có doanh thu. **Track B (3–9 tháng):** thêm Zalo OA chính thức + inbox có người + đa kênh → đi lên SMB/chuỗi như v1.0. |
| 4 | **Rủi ro số 1 phải quản trị** | Zalo cá nhân dùng API không chính thức (`zca-js`) → nguy cơ khoá nick. Chính sách "an toàn trước": chỉ **trả lời**, không chủ động nhắn/broadcast; giới hạn tốc độ; minh bạch rủi ro với khách; roadmap sang OA. |
| 5 | **Điều kiện được thu tiền** | Xong nhóm **P0** ở mục 5 (cách ly dữ liệu theo shop, persona/kiến thức theo shop, tạm dừng khi chủ tự trả lời, hạn mức & gói, OTP thật) + nhóm **bảo mật chặn** ở mục 7.5. |
| 6 | **North Star Metric** | **Số tin nhắn khách được AI trả lời thành công / tuần** (per shop và toàn hệ). Doanh thu và retention đi theo chỉ số này. |

---

## 1. Sản phẩm thực tế hôm nay (đối chiếu code) và khoảng cách với v1.0

### 1.1 Cái đã chạy (ship được)

| Năng lực | Vị trí code | Ghi chú |
|----------|-------------|---------|
| Đăng ký/đăng nhập bằng SĐT + OTP, mật khẩu, JWT + refresh, đa thiết bị | `src/modules/auth` | OTP hiện là **mock** (`123456`), lưu Redis |
| Hồ sơ người dùng | `src/modules/user` | `role: user/manager/owner/admin`, `shopId` |
| Multi-tenant theo **Shop** (1 shop = 1 tài khoản Zalo) | `src/modules/shop`, `zalo_sessions.shopId` unique | `chatbotKey` có field nhưng chưa dùng |
| Kết nối Zalo cá nhân bằng **QR (SSE)**, lưu session mã hoá, disconnect | `src/modules/zalo` (`/admin/zalo/login-qr`, `/sessions`) | FE có màn hình đầy đủ |
| Worker lắng nghe tin (websocket `zca-js`), reconnect backoff | `src/worker/zalo-listener.service.ts` | **Single instance**, có Redis pub/sub renew/disable |
| Pipeline bot: bỏ tin của mình → nhóm chỉ trả lời khi được @/gọi tên → từ khoá stop → lấy 10 tin lịch sử → AI → gửi (quote, @mention) → lưu lịch sử | `src/modules/omnichat-bot/services/omnichat-bot.service.ts` | |
| AI agent LangChain + tool `knowledge_base`, Qwen (DashScope), RAG Zilliz | `src/modules/ai-agent`, `src/modules/knowledge` | Persona & KB **hard-code cho SmartGo** |
| FE web (Flutter): login, register, dashboard trạng thái Zalo, QR connect, settings shop/profile/theme/lang | `ncg-omnichat-fe/lib/presentation/screens/**` | Deploy VPS qua GHCR + nginx, CI GitHub Actions |

### 1.2 Cái v1.0 hứa nhưng **chưa có** (không được đưa vào tài liệu bán hàng như "đã có")

| Tính năng v1.0 | Trạng thái | Ước lượng công (dev) |
|----------------|-----------|----------------------|
| Inbox hợp nhất, agent trả lời tay, phân công | Không có | 6–10 tuần |
| Zalo OA chính thức, Facebook, Instagram, TikTok, web widget | Không có | 3–4 tuần / kênh |
| Đa chi nhánh, phân quyền theo cơ sở, báo cáo theo chi nhánh | Không có (chỉ có 1 shop/1 Zalo) | 6–8 tuần |
| CRM/tag/pipeline, broadcast, ZNS | Không có | 4–8 tuần |
| Billing, gói, hạn mức, trial | Không có | 2–3 tuần |
| Quản lý kiến thức (upload FAQ/sản phẩm) | Không có API, KB là collection ngoài | 2–3 tuần |
| Xem lịch sử chat trong FE | Không có | 1–2 tuần |

**Kết luận:** nếu đi thẳng theo v1.0 phải xây thêm 6–9 tháng trước khi bán. Thay vào đó, **bán ngay Track A** với 4–6 tuần hoàn thiện P0, dùng doanh thu và phản hồi để nuôi Track B.

### 1.3 Lỗ hổng nghiệp vụ phát hiện khi rà code (phải sửa trước khi có khách thứ 2)

| # | Vấn đề | Bằng chứng | Hậu quả |
|---|--------|-----------|---------|
| G1 | Route `/admin/*` **không kiểm tra role/tenant** — mọi user có JWT gọi được list/sửa/xoá **shop của người khác**, disconnect Zalo của shop khác, gửi tin từ Zalo shop khác | `shop.admin.controller.ts` chỉ có `@Response`; không có `RolesGuard`/`@Roles` trong `src/` | Rò rỉ & phá hoại dữ liệu chéo khách hàng |
| G2 | Lịch sử chat **chỉ khoá theo `userId` Zalo**, không theo `shopId` | `OmnichatBotService.getHistory(message.userId)`; entity `zalo_chat_history` không có `shopId` | Một khách nhắn 2 shop → lịch sử trộn lẫn, AI lộ ngữ cảnh shop khác |
| G3 | Persona & kiến thức **hard-code SmartGo** | `ai-agent.prompt.constant.ts`, `ZILLIZ_COLLECTION` toàn cục | Không bán được cho shop thứ hai |
| G4 | Bot **không tạm dừng khi chủ shop tự trả lời** | Pipeline chỉ `skip isSelf`, không đánh dấu thread | Bot và chủ cùng trả lời một khách → trải nghiệm tệ, rủi ro spam |
| G5 | Không có hạn mức, không đếm usage | Không có field/quota nào | Không định giá, không chặn lạm dụng chi phí AI |
| G6 | OTP mock, JWT secret mặc định, CORS `*` | `.env.example`, audit 8.5/12.6 | Không thể mở đăng ký công khai |

---

## 2. Thị trường, đối thủ & chỗ trống để chen vào

### 2.1 Bối cảnh 9/2026 (đã kiểm chứng)

- **Zalo OA đổi gói từ 1/6/2026:** Cơ bản (0đ, không chatbot, không API) · Tiêu chuẩn 1.000.000đ/năm (có chatbot kịch bản, không API) · Tăng trưởng 2.500.000đ/năm (API, 10 kịch bản chatbot, 500 tin ngoài 48h/tháng) · Toàn diện 6.000.000đ/năm. Tin tư vấn ngoài khung 48h: 55đ/tin. → OA đã rẻ hơn trước; **muốn tích hợp bot bên thứ ba phải từ gói Tăng trưởng (~208k/tháng)**. Chatbot OA là **kịch bản**, không phải AI RAG.
- **Subiz:** gói Nâng cao 7.834.000đ/năm mới có Zalo cá nhân (3 tài khoản) + AI; mua thêm 5 Zalo cá nhân 1.500.000đ/năm; AI tính tiền riêng theo ngân sách nạp. → Zalo cá nhân + AI ở đối thủ chính đang ở mức **~650k/tháng**, đi kèm cả hệ CRM nặng.
- **Vpage/AhaChat/Pancake:** tập trung Facebook + Zalo OA, chatbot kịch bản; Zalo cá nhân không phải trọng tâm.
- **Tool "MKT Zalo" trôi nổi:** auto add friend/spam, giá rẻ, rủi ro khoá nick cao, không có AI hội thoại.
- **Zalo phạt nick cá nhân dùng tool bên thứ ba:** help.zalo.me liệt kê "Bot / phần mềm bên thứ 3" là lý do vô hiệu hoá; case thực tế mất nick sau vài tuần dùng tool spam. Rủi ro là thật, nhưng tập trung vào hành vi **chủ động gửi hàng loạt**; bot **chỉ phản hồi** khi được nhắn có hồ sơ rủi ro thấp hơn nhiều (vẫn phải cảnh báo).

### 2.2 Bản đồ định vị

| Nhóm | Đại diện | Giá/tháng quy đổi | Zalo cá nhân | AI hội thoại thật (RAG) | Setup |
|------|----------|-------------------|--------------|--------------------------|-------|
| CRM tin nhắn | Subiz | ~330k–650k | Có (gói cao) | Có, tính tiền riêng | Nặng, cần đào tạo |
| Social-selling | Pancake, Vpage, AhaChat | 200k–800k | Yếu/không | Kịch bản | Trung bình |
| Zalo OA + chatbot OA | Zalo | 83k–500k | Không | Kịch bản | Cần OA xác thực, giấy tờ DN |
| Tool MKT Zalo | nhiều | 100k–300k | Có | Không | Dễ nhưng nguy hiểm |
| **OmniChat (Track A)** | NCG | **149k–499k** | **Có, quét QR 1 phút** | **Có (RAG theo kiến thức shop)** | **5 phút, không cần OA** |

### 2.3 Tuyên ngôn định vị Track A

> **"Trợ lý AI trực Zalo 24/7 cho người bán hàng: quét QR 1 phút, nạp kiến thức shop, khách nhắn lúc nào cũng có người trả lời — không cần lập OA, không cần biết kỹ thuật."**

3 thông điệp:
1. **"Không sót khách lúc 11 giờ đêm"** — AI trả lời ngay câu hỏi lặp (giá, địa chỉ, ship, còn hàng), bạn dậy chốt đơn.
2. **"AI nói giọng shop của bạn"** — nạp FAQ/bảng giá/chính sách, AI chỉ trả lời trong phạm vi đó, không bịa.
3. **"Bạn vẫn là người quyết định"** — bot dừng ngay khi bạn nhắn tay, chỉ trả lời khi khách hỏi, không tự nhắn ai.

Thông điệp Track B (giữ từ v1.0, dùng sau khi có OA + inbox): "Đa chi nhánh thật · dữ liệu tại VN · AI tiếng Việt · giá minh bạch".

---

## 3. Khách hàng mục tiêu

### 3.1 ICP Track A

| Thuộc tính | Mô tả |
|-----------|-------|
| Quy mô | Cá nhân kinh doanh, hộ KD, shop 1–5 người |
| Kênh chính | Zalo cá nhân (đã có 500–5.000 bạn bè/khách), có thể có FB/TikTok nhưng chốt đơn trên Zalo |
| Ngành ưu tiên (theo mức lặp câu hỏi) | 1) Mỹ phẩm/thời trang/mẹ & bé online · 2) Spa/nail/tóc nhỏ · 3) Môi giới BĐS/cho thuê · 4) Gia sư/lớp học/khoá học nhỏ · 5) Dịch vụ sửa chữa, vận chuyển, đặt lịch |
| Nỗi đau | Trả lời chậm ngoài giờ; 70% câu hỏi lặp; thuê người trực tốn 5–8 triệu/tháng; sợ mất nick nếu dùng tool spam |
| Người mua = người dùng | Chủ shop, quyết nhanh, trả tiền qua chuyển khoản, quen giá 100k–500k/tháng |
| Nơi họ tụ tập | Group FB "Bán hàng online", "Chủ shop…", TikTok kinh doanh, cộng đồng Zalo bán hàng, chợ sỉ |

**Anti-ICP (từ chối khéo, chuyển sang Track B sau):** doanh nghiệp yêu cầu API chính thức/hoá đơn hợp đồng lớn; chuỗi >3 điểm; đơn vị cần broadcast/ZNS; ngành nhạy cảm (y tế kê đơn, tài chính).

### 3.2 Beachhead cụ thể

**1 ngành + 1 cộng đồng:** shop mỹ phẩm/thời trang online tại TP.HCM & Hà Nội, tiếp cận qua 5–10 group FB/Zalo lớn nhất. Mục tiêu 30 khách trả phí cùng ngành để có 3 case study → nhân sang ngành 2 (spa/nail).

---

## 4. Rủi ro Zalo cá nhân & chính sách "an toàn trước" (bắt buộc đưa vào sản phẩm)

| Biện pháp | Triển khai trong code | Trạng thái |
|----------|----------------------|-----------|
| Chỉ trả lời, **không** chủ động nhắn/kết bạn/broadcast | Không xây tính năng gửi hàng loạt; `POST /admin/zalo/send` chỉ dùng nội bộ/test, ẩn khỏi FE | Đúng hiện trạng — giữ nguyên |
| Giới hạn tần suất | Tối đa N reply/phút/shop, tối đa 1 reply/thread/5s; hàng đợi khi vượt | Cần làm |
| Hành vi giống người | Delay ngẫu nhiên 2–6s + `sendTypingEvent` trước khi gửi | `sendTyping` đã có, delay cần thêm |
| Giờ hoạt động | Bot chỉ chạy trong khung giờ shop cấu hình (mặc định 24/7, khuyến nghị tắt 0h–6h nếu shop muốn) | Cần làm |
| Tạm dừng khi chủ tự trả lời | Khi nhận tin `isSelf` trên thread → đánh dấu Redis `pause:{shopId}:{threadId}` 30–60 phút | Cần làm (G4) |
| Không trả lời người lạ (tuỳ chọn) | Chỉ trả lời bạn bè/đã từng nhắn; tin từ người lạ → gửi 1 câu chào duy nhất | Cần làm |
| Cảnh báo minh bạch | Khi kết nối QR, hiển thị và bắt tick: "Zalo không hỗ trợ chính thức tool bên thứ ba; khuyến nghị dùng nick đã xác thực CCCD, không dùng cho gửi hàng loạt; OmniChat không chịu trách nhiệm khi Zalo hạn chế tài khoản" | Cần làm (FE + ToS) |
| Theo dõi sức khoẻ session | Alert khi `status=expired`; thông báo trong FE + qua kênh liên hệ (email/Zalo OA của NCG) để quét QR lại | Trạng thái có; alert cần làm |
| Đường thoát | Roadmap Zalo OA chính thức (Track B) — khách lớn dần sẽ chuyển sang OA khi họ đủ điều kiện | Kế hoạch |

Nguyên tắc kinh doanh: **không bao giờ** quảng cáo "spam", "auto add friend", "gửi hàng loạt". Đó là ranh giới giữa OmniChat và tool MKT trôi nổi, cũng là lá chắn pháp lý & với Zalo.

---

## 5. Kế hoạch sản phẩm — cái phải làm để bán được

### 5.1 P0 — Điều kiện thu tiền (4–6 tuần, 2 dev)

| ID | Hạng mục | Nơi sửa (BE/FE) | Tiêu chí hoàn thành |
|----|----------|-----------------|---------------------|
| P0-1 | **Cách ly tenant:** guard role + ràng `shopId` từ JWT cho mọi route `/admin/*`; user thường chỉ thấy shop của mình; `admin` hệ thống mới list toàn bộ | `src/modules/auth/guards`, `shop.admin.controller.ts`, `zalo.admin.controller.ts` | Test: user A gọi `/admin/shops/{B}` → 403 |
| P0-2 | **Lịch sử chat theo shop:** thêm `shopId` vào `zalo_chat_history`, index `{shopId, userId, timestamp}`, lọc theo shop trong `getHistory` | `omnichat-bot` entity/repo/service | Cùng userId nhắn 2 shop → 2 lịch sử tách biệt |
| P0-3 | **Persona theo shop:** entity `bot_profiles` (`shopId`, `botName`, `tone`, `systemPromptExtra`, `fallbackMessage`, `workingHours`, `replyToStrangers`, `enabled`); prompt build từ đây thay hard-code SmartGo | `ai-agent.prompt.constant.ts` → template; module mới `bot-profile` hoặc mở rộng `shop` | Đổi persona trong FE → bot đổi giọng ngay |
| P0-4 | **Kiến thức theo shop:** API upload text/FAQ/CSV sản phẩm → chunk → embed → Zilliz với `metadata.shopId` (1 collection, filter theo shopId; hoặc partition key) ; tool `knowledge_base` luôn filter `shopId` | `src/modules/knowledge` thêm controller + ingest; `ai-agent` truyền `shopId` | Shop A không bao giờ nhận hit của shop B |
| P0-5 | **Tạm dừng khi chủ trả lời + rate limit + delay + giờ hoạt động** | `omnichat-bot.service.ts`, Redis | Chủ nhắn tay → bot im 30' trên thread đó |
| P0-6 | **Usage & hạn mức:** đếm `aiReplies` theo shop/tháng (Redis counter + snapshot Mongo), chặn khi vượt gói, gửi thông báo 80%/100% | module `billing` (entity `subscriptions`, `usage_monthly`) | Vượt hạn mức → bot trả lời fallback "shop sẽ phản hồi sau" |
| P0-7 | **Gói & thanh toán tối thiểu:** bảng gói cấu hình; trang nâng cấp trong FE tạo QR VietQR (payOS hoặc SePay, webhook xác nhận tự động) → kích hoạt gói; kỳ hạn tháng/năm | BE `billing`, FE màn hình Plans | Chuyển khoản → ≤1 phút gói active, hoá đơn tự động |
| P0-8 | **OTP thật:** SMS brandname (eSMS/SpeedSMS/VietGuys) hoặc ZNS OTP qua OA NCG; giới hạn 5 OTP/SĐT/ngày | `OtpService` | Đăng ký công khai không cần dev |
| P0-9 | **Lịch sử hội thoại trong FE (read-only):** danh sách khách theo shop, xem tin & phản hồi AI, nút "tắt bot cho khách này" | BE controller `/conversations` (query `zalo_chat_history`), FE screen | Chủ shop tự kiểm chứng AI trả lời gì |
| P0-10 | **Onboarding wizard 5 bước:** tạo shop → quét QR → đặt tên bot/giọng → nạp 10 FAQ → gửi tin test | FE | Thời gian từ đăng ký đến reply đầu tiên ≤ 10 phút |
| P0-11 | **Bảo mật chặn** (mục 7.5) | app/common | Checklist xanh |

### 5.2 P1 — Tăng retention & upsell (tháng 2–3)

- Gợi ý FAQ từ chính lịch sử chat (AI gom câu hỏi lặp → chủ duyệt 1 click vào KB).
- Chuyển tiếp cho người: khi AI không chắc (score thấp/keyword "gặp người thật"), gửi tin "mình đã báo chủ shop" + push/thông báo cho chủ (FCM, email, hoặc nhắn vào Zalo của chủ từ chính nick).
- Thu thập lead có cấu trúc: AI hỏi tên/SĐT/nhu cầu → lưu `leads` → xuất Excel (đã có `xlsx`).
- Báo cáo tuần cho chủ shop: số tin, % AI trả lời, top câu hỏi, khách mới (email/Zalo).
- Nhiều Zalo/1 shop (gói Pro) — nới `zalo_sessions.shopId` unique → `{shopId, ownId}`.
- Thư viện template kiến thức theo ngành (mỹ phẩm, spa, BĐS…) để onboarding nhanh.
- App Android/iOS (Flutter đã có folder) để chủ shop nhận thông báo & bật/tắt bot.

### 5.3 P2 — Track B (tháng 3–9): đi lên SMB/chuỗi

- **Zalo OA chính thức** (webhook OA, gói Tăng trưởng của khách) → cùng pipeline AI; khách lớn chuyển từ cá nhân sang OA không mất KB.
- **Facebook Messenger / Instagram** qua Meta API (đăng ký Meta Business Partner).
- **Inbox có người:** agent trả lời tay, phân công, tag, ghi chú; Socket.IO gateway (dep đã có).
- **Đa chi nhánh & phân quyền** (`role manager/owner/admin` đã có enum), báo cáo theo cơ sở → mở lại toàn bộ định vị & bảng giá v1.0.
- Web widget, ZNS theo template, xuất dữ liệu.

---

## 6. Giá & đóng gói Track A

### 6.1 Mô hình chi phí AI (để định giá không lỗ)

- 1 lượt trả lời ≈ 1.500–4.000 token vào (system + 10 tin lịch sử + 4 hit KB) + 100–300 token ra, tối đa 3 vòng tool. Với Qwen-plus (DashScope) ước **~15–50đ/lượt**; tin không cần tool ở mức thấp. Embedding lúc nạp KB không đáng kể.
- Mục tiêu **biên gộp ≥ 70%** → hạn mức gói phải để chi phí AI ≤ 30% giá. Đo thực tế 2 tuần đầu rồi điều chỉnh; có thể dùng model rẻ (qwen-flash) cho gói Free/Starter, model tốt cho Pro.

### 6.2 Bảng gói đề xuất (VND, chưa VAT; niêm yết đã VAT nếu bán cho DN)

| Gói | Giá/tháng | Trả năm (−20%) | Zalo | Lượt AI/tháng | Kiến thức | Khác |
|-----|-----------|----------------|------|---------------|-----------|------|
| **Free** | 0đ | — | 1 | 150 | 20 mục FAQ | Watermark "Trả lời bởi OmniChat AI" ở tin đầu ngày; đủ để thấy giá trị |
| **Starter** | 149.000đ | 1.430.000đ | 1 | 1.500 | 200 mục / 2 file | Giờ hoạt động, tạm dừng khi chủ trả lời, lịch sử 30 ngày |
| **Pro** (chủ lực) | 349.000đ | 3.350.000đ | 2 | 5.000 | Không giới hạn hợp lý | Lead capture, báo cáo tuần, lịch sử 12 tháng, chuyển người |
| **Business** | 499.000đ | 4.790.000đ | 5 | 15.000 | Không giới hạn | Nhiều nhân sự, ưu tiên hỗ trợ, chuẩn bị lên Zalo OA (Track B) |
| Add-on | +49.000đ / 1.000 lượt · +79.000đ / 1 Zalo thêm | | | | | |

So sánh để bán: Starter 149k ≈ 1/4 giá gói Zalo OA Tăng trưởng + không cần OA; Pro 349k ≈ 1/2 Subiz Nâng cao nhưng chuyên một việc và cài trong 5 phút; rẻ hơn thuê người trực 1 ca ≥ 15 lần.

### 6.3 Chiến thuật giá

- **Founding member:** 50 khách đầu −40% trọn đời (đổi lấy phản hồi + case study + review công khai).
- **Trả năm −20%**, tặng thêm 1 tháng nếu giới thiệu 1 shop trả phí.
- Không giảm giá dưới 100k/tháng; giữ Free có hạn mức thật để không phá giá.
- Hoá đơn điện tử tự động (MISA meInvoice/Viettel) cho khách cần; xuất ngay khi thanh toán.

---

## 7. Kế hoạch kỹ thuật triển khai production

### 7.1 Kiến trúc triển khai mục tiêu (giai đoạn A, chi phí thấp, đủ cho ~500 shop)

```
Internet ──> Cloudflare (DNS, WAF, TLS, cache FE)
              │
              ├── omnichat.ncgstudio.tech ──> nginx (FE Flutter web, đã có)      [VPS-1, VN]
              └── api.omnichat.<domain>    ──> nginx ──> api (NestJS, 2 replica) [VPS-1]
                                                          │
            ┌─────────────────────────────────────────────┤ MongoDB (replica set 1 node, để dùng transaction)
            │                                             ├ Redis (session, OTP, pause, quota, pub/sub)
            │  worker (NestJS ApplicationContext, 1 instance, Redis lock)  [VPS-2 hoặc cùng VPS-1 tách container]
            │     └── zca-js listener per shop ──> OmnichatBotService ──> DashScope (Qwen) / Zilliz (KB)
            └── Backup job: mongodump hằng đêm → S3/R2 (30 ngày), test restore hàng tháng
```

- **Hosting tại VN** (điểm bán & tuân thủ): Viettel IDC / VNPT / FPT Cloud / CMC hoặc Vultr/DO Singapore giai đoạn pilot nếu chưa mua được VN. 2× VPS 4 vCPU/8 GB đủ cho giai đoạn A (~1,2–2,4 triệu/tháng).
- **Worker:** bắt buộc 1 instance/tài khoản Zalo. Thêm Redis lock `worker:leader` (TTL 30s, renew) để chạy 2 container nhưng chỉ 1 active → tự failover. Heartbeat `worker:heartbeat:{shopId}` để giám sát.
- **Dữ liệu ra nước ngoài:** DashScope (Alibaba, Singapore) và Zilliz Cloud là **chuyển dữ liệu cá nhân xuyên biên giới** → ghi rõ trong Chính sách bảo mật + DPA; đưa vào lộ trình xem xét LLM/Vector tại VN (FPT AI, Viettel AI, self-host Qwen/Milvus) khi có khách doanh nghiệp.

### 7.2 Việc còn thiếu trong repo BE để deploy được như FE

| Việc | Chi tiết |
|------|----------|
| `Dockerfile` (multi-stage, node:22-alpine, `yarn build`, image chung cho api & worker, khác `CMD`) | Repo hiện **không có** Dockerfile |
| `docker-compose.prod.yml` | services: `api`, `worker`, `mongo` (replSet), `redis`, `backup`; healthcheck; `restart: unless-stopped`; log driver json-file có rotate |
| `.github/workflows/deploy-vps.yml` | Giống FE: build → GHCR → SSH pull & `docker compose up -d`; chạy `yarn lint && yarn build` trước |
| Env production | Tạo từ `.env.example`; **bắt buộc**: `HELPER_JWT_SECRET_KEY` random 64 byte, `CORS_ORIGIN` whitelist, `ENCRYPTION_AES_*` 32 byte, `NODE_ENV=production`, xoá `AUTH_DEV_OTP_CODE` |
| Health cho worker | Hiện chỉ có `GET /public/health` của API. Thêm endpoint hoặc Redis key được Uptime Kuma kiểm tra |
| Migration/seed | `migrate-mongo` cho index & dữ liệu gói; seed gói Free/Starter/Pro/Business |

### 7.3 Vận hành, giám sát, sao lưu

| Hạng mục | Công cụ (miễn phí/thấp) | Ngưỡng cảnh báo |
|----------|--------------------------|-----------------|
| Uptime API/FE/worker heartbeat | Uptime Kuma (self-host) → Telegram/Zalo | down > 1 phút |
| Lỗi ứng dụng | Sentry (free tier) cho NestJS & Flutter | error rate > 1%/5' |
| Log có `requestId`, `shopId` | pino JSON → Loki/Grafana Cloud free | |
| Metric nghiệp vụ | Counter Redis → dashboard Grafana: tin vào, reply OK, reply lỗi, latency AI, token dùng, session expired | reply lỗi > 5%; latency AI p95 > 8s |
| Session Zalo hết hạn | Worker publish → thông báo chủ shop (email/FE banner/ZNS) | ngay lập tức |
| Chi phí AI | Cron hằng ngày tổng token/shop; cảnh báo shop bất thường (> 3× trung bình) | |
| Backup | `mongodump` 02:00 hằng ngày → R2/S3, giữ 30 ngày; export Zilliz KB hằng tuần | Test restore mỗi tháng, có biên bản |
| Bảo mật vận hành | 2FA GitHub/cloud, secrets trong GitHub Secrets/1Password, fail2ban, chỉ mở 80/443/SSH-key | |

### 7.4 Kiểm thử tải & độ tin cậy trước soft launch

- Kịch bản: 50 shop, mỗi shop 20 tin/phút đỉnh → 1.000 tin/phút vào worker; đo hàng đợi, latency AI, tỷ lệ lỗi gửi.
- Kịch bản kết nối: 200 session Zalo đồng thời trong 1 worker (RAM, số websocket) → xác định ngưỡng để sharding worker theo `shopId % N`.
- Chaos: giết worker → leader mới lên trong ≤ 30s, không mất tin (tin trong lúc gián đoạn: ghi vào Redis stream để xử lý lại nếu `zca-js` cho phép; nếu không, chấp nhận và ghi nhận SLA).
- Kịch bản Zalo đổi API: pin version `zca-js`, có bộ test smoke hằng ngày với nick test của NCG.

### 7.5 Checklist bảo mật/chặn go-live (từ `AUDIT_BASE_SETUP.md` + rà code v2.0)

| Ưu tiên | Việc | Tham chiếu |
|---------|------|-----------|
| Chặn | Guard role + tenant cho `/admin/*` (G1) | mới |
| Chặn | `shopId` trong lịch sử chat và KB filter (G2, P0-4) | mới |
| Chặn | JWT secret bắt buộc env, fail-fast production | audit 8.5 |
| Chặn | CORS whitelist, không `*` | audit 12.6 |
| Chặn | Validate env schema khi bootstrap (`AppEnvDto`) | audit 6.1 |
| Chặn | OTP thật + rate limit OTP | mới |
| Chặn | Throttle theo user/IP cho `/auth/*`, `/admin/zalo/send` | có `@nestjs/throttler` 100/60s toàn cục — cần theo route |
| Cao | Encryption interceptor: không trả plaintext khi lỗi, IV theo request, validate AES key 32 byte | audit 8.1–8.6 |
| Cao | `main.ts`: shutdown hooks, trust proxy, uncaughtException, Swagger chỉ ở non-prod | audit 12.1 |
| Cao | Header/metadata & header ngôn ngữ thống nhất (`x-lang`) | audit 7.1, 7.5 |
| Cao | Không log cookie/imei Zalo, nội dung tin ở mức `debug` có mask | mới |
| Trung | Gỡ `@ts-nocheck` base repository, bật strict từng bước | audit 2, 6.4 |
| Trung | CI: lint + build + test tối thiểu (auth, omnichat-bot pipeline, quota) | audit 13.2–13.3 |
| Trung | FE gọi `/auth/refresh` thay vì đăng xuất khi 401 | FE `auth_remote_data_source.dart` |

---

## 8. Pháp lý & tuân thủ (cập nhật theo luật hiện hành)

> Lưu ý: v1.0 tham chiếu **Nghị định 13/2023** — đã bị thay thế. Từ **01/01/2026** áp dụng **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** và **Nghị định 356/2025/NĐ-CP**.

| Hạng mục | Việc cần làm | Ghi chú |
|----------|--------------|---------|
| Pháp nhân & thuế | Công ty NCG ký ToS; đăng ký ngành nghề phần mềm; hoá đơn điện tử; kê khai VAT 10% (kiểm tra ưu đãi phần mềm) | Cần để bán cho hộ KD/DN |
| Điều khoản dịch vụ (ToS) | Mô tả rõ: dịch vụ dùng kết nối Zalo cá nhân không chính thức, rủi ro hạn chế tài khoản thuộc về người dùng; cấm dùng để spam; quyền tạm ngưng khi vi phạm; SLA nỗ lực tối đa | Hiển thị & bắt đồng ý khi quét QR |
| Chính sách bảo mật + Thoả thuận xử lý dữ liệu (DPA) | OmniChat là **bên xử lý** dữ liệu khách của shop (nội dung tin, tên, SĐT); shop là **bên kiểm soát**. Nêu mục đích, thời gian lưu, bên thứ ba (Alibaba DashScope, Zilliz, hosting), quyền chủ thể (xem/xoá), thông báo sự cố 72h | Luật 91/2025 |
| Chuyển dữ liệu xuyên biên giới | Gọi LLM/KB ở nước ngoài = chuyển DLCN ra nước ngoài → lập **hồ sơ đánh giá tác động chuyển DLCN** gửi A05 (60 ngày) khi vượt ngưỡng miễn trừ; DN nhỏ/khởi nghiệp được miễn Điều 21, 22 trong 5 năm **trừ khi kinh doanh dịch vụ xử lý DLCN** — OmniChat có thể rơi vào ngoại lệ này → **hỏi luật sư sớm** | Thuê tư vấn 1 lần (~10–20 triệu) |
| Tối thiểu hoá dữ liệu | Lưu lịch sử theo gói (30 ngày/12 tháng), xoá khi huỷ gói; không gửi số điện thoại/định danh không cần thiết vào prompt | Kỹ thuật |
| Hợp đồng với nhà cung cấp | Điều khoản không dùng dữ liệu để huấn luyện (DashScope có tuỳ chọn), vị trí lưu trữ | |
| Quyền rời đi | Cho export KB và lịch sử chat (CSV/Excel) 1 click | "Không giam data" là điểm bán |
| Nhãn AI | Tin đầu tiên với khách mới có thể ghi "Trợ lý AI của shop" (tuỳ chọn gói Free bắt buộc) | Minh bạch, giảm khiếu nại |

---

## 9. Onboarding & Customer Success

**Mục tiêu "aha" trong 10 phút:** khách nhắn tin test và thấy AI trả lời đúng giá/địa chỉ của shop mình.

Luồng 5 bước (P0-10): đăng ký SĐT → quét QR Zalo (cảnh báo rủi ro) → đặt tên/giọng bot + chọn template ngành → nạp 10 FAQ (có mẫu điền sẵn) → gửi tin test từ nick khác, xem lịch sử.

| Giai đoạn | Cách làm |
|-----------|----------|
| 50 khách đầu | Founder onboarding 1-1 qua Zalo/Google Meet 20 phút; nhóm Zalo "Founding members" để nhận phản hồi hằng ngày |
| Ngày 1–3 | Tự động nhắn/email: "AI đã trả lời X tin, đây là 5 câu hỏi khách hay hỏi mà KB chưa có → thêm ngay" |
| Ngày 7 | Báo cáo tuần đầu + đề nghị nâng gói nếu chạm 80% hạn mức |
| Hằng tháng | Review với khách Pro/Business: top câu hỏi, tỉ lệ fallback, gợi ý KB |
| Hỗ trợ | Zalo OA "OmniChat Support" (chính OA này cũng là **demo sống** của Track B), giờ hành chính + bot tự trả lời ngoài giờ bằng chính OmniChat |
| Tài liệu | Trang trợ giúp 10 bài + 5 video ≤ 2 phút: kết nối, viết FAQ hiệu quả, tắt/bật bot, đổi gói, an toàn tài khoản |

---

## 10. Kênh tăng trưởng (Track A)

| Ưu tiên | Kênh | Cách làm cụ thể | KPI |
|---------|------|-----------------|-----|
| 1 | **Video demo ngắn** (TikTok, Reels, Shorts) | 15–30s: "Khách nhắn 1h sáng, AI trả lời giá + địa chỉ, sáng chủ shop chốt đơn". 3 video/tuần, chạy song song 200–500k/ngày ads thử nghiệm | CPL < 30k, landing→trial ≥ 20% |
| 2 | **Cộng đồng chủ shop** (FB group, Zalo group, chợ sỉ) | Bài chia sẻ "mình để AI trực Zalo 1 tháng…", livestream demo 20 phút, tặng 3 tháng Pro cho admin group | 5 group/tuần, 30 trial/tuần |
| 3 | **Referral** | Giới thiệu 1 shop trả phí → cả hai +1 tháng; link ref trong FE | ≥ 25% khách mới từ ref sau tháng 3 |
| 4 | **KOL/KOC nhỏ ngành mỹ phẩm/thời trang online** | 5–10 KOC 20–100k follow, hợp tác hoa hồng 30% năm đầu | |
| 5 | **SEO/Content** | Từ khoá: "chatbot zalo cá nhân", "tự động trả lời zalo", "AI trả lời tin nhắn zalo", "zalo bị khoá vì tool" (bài an toàn) | 20 bài trong 90 ngày |
| 6 | **Đối tác** | Đơn vị dạy bán hàng online, sàn sỉ, đơn vị làm ảnh/content cho shop → bundle | 3 đối tác trong 90 ngày |
| Sau | Ads Google/FB theo từ khoá thương mại, khi landing CVR ổn | |

**Landing page** (chưa có — FE hiện mở thẳng login): 1 trang tại `omnichat.ncgstudio.tech` hoặc domain thương hiệu riêng (`omnichat.vn` nếu còn/`getomnichat.vn`), gồm: hero video 30s, 3 lợi ích, demo tương tác, bảng giá, câu hỏi về an toàn tài khoản, CTA "Dùng thử miễn phí", gắn GA4 + Meta Pixel + Zalo Pixel.

### Phễu & chuyển đổi mục tiêu

Truy cập → Đăng ký (≥ 15%) → Kết nối Zalo (≥ 60% trong 24h) → Nạp ≥ 5 FAQ (≥ 50%) → AI trả lời ≥ 20 tin/tuần (kích hoạt thật, ≥ 40%) → Trả phí (≥ 10% trial trong 30 ngày) → Giữ tháng 3 (≥ 80%).

---

## 11. Chỉ số & mục tiêu 6 tháng

| Nhóm | Chỉ số | T+1 | T+3 | T+6 |
|------|--------|-----|-----|-----|
| North Star | Tin được AI trả lời/tuần | 2.000 | 30.000 | 150.000 |
| Khách | Shop kết nối Zalo hoạt động | 50 | 300 | 1.000 |
| Doanh thu | Shop trả phí / MRR | 10 / 2,5tr | 60 / 15tr | 250 / 70tr |
| Kích hoạt | % kết nối Zalo trong 24h | 50% | 60% | 65% |
| Giữ chân | Churn tháng (trả phí) | — | < 8% | < 5% |
| Chất lượng AI | % tin fallback "không có thông tin" | < 30% | < 20% | < 15% |
| Độ tin cậy | Uptime API / worker; session expired chưa renew > 24h | 99% | 99,5% | 99,5% / < 5% |
| Chi phí | Chi phí AI / doanh thu | đo | < 30% | < 25% |
| An toàn | Số nick bị Zalo hạn chế / 100 shop | ghi nhận | < 3 | < 2 |

---

## 12. Lộ trình 30–60–90–180 ngày

### 0–30 ngày — "Đóng lỗ, dựng nền, tìm 10 founding members"
1. Sửa **G1–G6** và P0-1 → P0-5 (tenant, history, persona, KB theo shop, an toàn).
2. Dockerfile + compose prod + CI cho BE; chuyển API về VPS VN; backup; Uptime Kuma + Sentry.
3. OTP thật; JWT/CORS/env schema; ToS + Chính sách bảo mật + cảnh báo QR.
4. Landing page + form đăng ký; video demo đầu tiên.
5. Founder tự tay onboard **10 shop** (miễn phí, nhóm Zalo phản hồi hằng ngày). Đo: tin/ngày, fallback, phản ứng khách của họ.

### 31–60 ngày — "Thu tiền lần đầu"
6. P0-6 → P0-10: hạn mức, gói, thanh toán payOS/SePay, lịch sử chat FE, wizard onboarding.
7. Kiểm thử tải & failover worker; runbook sự cố (session expired, Zalo đổi API, DashScope lỗi → fallback message).
8. Mở đăng ký công khai với Free + Founding −40%; mục tiêu 50 shop kết nối, 10 trả phí.
9. Bắt đầu content: 3 video/tuần, 5 group/tuần; thu 3 testimonial.
10. Tư vấn pháp lý Luật 91/2025 (bên xử lý, chuyển dữ liệu xuyên biên giới).

### 61–90 ngày — "Soft launch ngành beachhead"
11. P1: gợi ý FAQ từ lịch sử, chuyển người, lead capture, báo cáo tuần, referral.
12. Chạy ads thử nghiệm 5–10 triệu; đo CPL, trial→paid; chọn 1–2 kênh tốt nhất.
13. 1–2 case study có số liệu (tin trả lời/đêm, đơn chốt thêm, giờ tiết kiệm).
14. Khởi động Track B: đăng ký Zalo OA cho NCG + Meta Business/app review; thiết kế module `channel` trừu tượng (Zalo cá nhân / OA / Messenger cùng pipeline).
15. Mục tiêu: 300 shop kết nối, 60 trả phí, MRR ~15 triệu.

### 91–180 ngày — "Mở ngành 2 + Track B"
16. Ship Zalo OA (kênh chính thức) và Messenger; inbox có người (phiên bản tối thiểu); app mobile thông báo.
17. Mở ngành spa/nail và BĐS với template KB riêng; tuyển 1 sales/CS.
18. Bắt đầu bán gói Business/Chain theo v1.0 cho khách có OA; xem xét LLM tại VN cho khách DN.
19. Mục tiêu: 1.000 shop kết nối, 250 trả phí, MRR ~70 triệu, churn < 5%.

---

## 13. Backlog ticket hoá (đưa thẳng vào issue tracker)

| ID | Hạng mục | Loại | Ưu tiên | Ước lượng | Tiêu chí hoàn thành |
|----|----------|------|---------|-----------|---------------------|
| SEC-01 | RolesGuard + TenantGuard cho `/admin/*`; `ENUM_USER_ROLE.ADMIN` mới xem toàn hệ | BE | Chặn | 2d | e2e: cross-shop → 403 |
| SEC-02 | JWT secret bắt buộc, `AppEnvDto` validate, fail-fast | BE | Chặn | 1d | Thiếu env → app không start, log rõ |
| SEC-03 | CORS whitelist theo env; header `x-lang` thống nhất | BE | Chặn | 0.5d | |
| SEC-04 | Throttle riêng `/public/auth/*` (10/phút/IP), OTP 5/SĐT/ngày | BE | Chặn | 0.5d | |
| SEC-05 | OTP qua SMS/ZNS provider, bỏ dev code ở production | BE | Chặn | 1.5d | Đăng ký thật bằng SĐT lạ |
| BOT-01 | `shopId` vào `zalo_chat_history` + index + filter | BE | Chặn | 1d | Migration dữ liệu cũ (gán shop mặc định) |
| BOT-02 | Entity `bot_profiles` + CRUD + prompt template theo shop | BE/FE | Chặn | 3d | Đổi tên bot → phản hồi đổi |
| BOT-03 | KB ingest (text/FAQ/CSV) → chunk → embed → Zilliz `shopId` filter; CRUD mục KB | BE/FE | Chặn | 5d | Truy hồi chỉ trong shop |
| BOT-04 | Pause-on-owner-reply (Redis TTL), rate limit/thread, delay ngẫu nhiên + typing, giờ hoạt động, tuỳ chọn không trả lời người lạ | BE | Chặn | 3d | Test hành vi |
| BOT-05 | Fallback khi AI lỗi/timeout (không im lặng, không lộ lỗi) | BE | Cao | 0.5d | |
| BIL-01 | Entity `plans`, `subscriptions`, `usage_monthly`; counter Redis; chặn vượt hạn mức; thông báo 80/100% | BE | Chặn | 3d | |
| BIL-02 | Tích hợp payOS/SePay: tạo QR, webhook xác nhận, kích hoạt gói, lịch sử thanh toán | BE/FE | Chặn | 3d | Thanh toán sandbox → active |
| BIL-03 | Hoá đơn điện tử tự động (giai đoạn 2, có thể tay trong 60 ngày đầu) | Ops | Trung | 2d | |
| FE-01 | Wizard onboarding 5 bước + cảnh báo rủi ro Zalo (bắt tick) | FE | Chặn | 4d | Time-to-first-reply ≤ 10' |
| FE-02 | Màn hình lịch sử hội thoại theo khách + tắt bot cho khách | FE/BE | Chặn | 4d | |
| FE-03 | Trang Gói & thanh toán, hiển thị usage | FE | Chặn | 3d | |
| FE-04 | Gọi `/auth/refresh` khi 401; PWA manifest đúng thương hiệu | FE | Cao | 1d | |
| FE-05 | Landing page + analytics | Web | Chặn | 3d | |
| OPS-01 | Dockerfile + compose prod + CI deploy BE | DevOps | Chặn | 2d | Push master → deploy |
| OPS-02 | Worker leader lock + heartbeat + alert session expired | BE | Chặn | 2d | Kill worker → failover ≤ 30s |
| OPS-03 | Backup mongodump → R2 + restore drill | DevOps | Chặn | 1d | Biên bản restore |
| OPS-04 | Sentry, Uptime Kuma, pino JSON log, dashboard usage/token | DevOps | Cao | 2d | |
| OPS-05 | Load test 1.000 tin/phút; ghi ngưỡng shard worker | QA | Cao | 2d | Báo cáo |
| LEG-01 | ToS, Chính sách bảo mật, DPA mẫu; tư vấn Luật 91/2025 | Pháp lý | Chặn | 2 tuần (ngoài) | Đăng trên web, bắt đồng ý |
| GRW-01 | 3 video demo + kịch bản bài group + form founding member | Marketing | Chặn | 1 tuần | 10 founding members |
| TRB-01 | Thiết kế module `channel` trừu tượng (Zalo cá nhân/OA/Messenger) — ADR | BE | Trung | 2d | ADR được duyệt |

---

## 14. Ngân sách vận hành ước tính (tháng, giai đoạn A–B)

| Khoản | Ước tính | Ghi chú |
|-------|----------|---------|
| VPS VN ×2 (4 vCPU/8 GB) | 1,2–2,4 triệu | api+redis+mongo; worker riêng |
| Object storage backup (R2) | ~0–100k | |
| Zilliz Cloud | 0–700k | Serverless free tier đủ giai đoạn A |
| DashScope (AI) | ~30đ × số lượt | 100k lượt/tháng ≈ 3 triệu |
| SMS OTP | 700đ/tin × số đăng ký | 1.000 đăng ký ≈ 700k |
| Zalo OA NCG (support/demo, Track B) | 2,5 triệu/năm | Gói Tăng trưởng để có API |
| payOS/SePay | 0–200k | Phí cố định/giao dịch |
| Sentry/Grafana/Uptime Kuma | 0 | Free tier / self-host |
| Domain, email, hoá đơn điện tử | ~300k | |
| Ads thử nghiệm | 5–10 triệu | Từ tháng 3 |
| Pháp lý (1 lần) | 10–20 triệu | ToS/DPA/tư vấn Luật 91 |
| **Tổng cố định (không ads/pháp lý)** | **~4–8 triệu/tháng** | Hoà vốn vận hành ở ~25–40 khách Pro |

---

## 15. Tổ chức đội ngũ tối thiểu

| Vai trò | Người | Việc 90 ngày đầu |
|---------|-------|------------------|
| Founder / Product | 1 | Chốt ICP, tự onboard 50 khách đầu, quyết định gói & roadmap |
| Backend | 1–2 | P0 + bảo mật + OPS; sau đó Track B |
| Flutter | 1 | Wizard, lịch sử chat, gói/thanh toán, landing |
| Growth/Content (kiêm CS) | 1 (có thể part-time) | Video, group, tài liệu trợ giúp, Zalo OA support |
| Thuê ngoài | Pháp lý, thiết kế landing/brand |

---

## 16. Rủi ro & giảm thiểu

| Rủi ro | Xác suất | Giảm thiểu |
|--------|----------|------------|
| Zalo siết API không chính thức / khoá hàng loạt nick khách | Trung–cao | Chỉ trả lời, rate limit, cảnh báo, hỗ trợ renew QR nhanh; đẩy Track B (OA) sớm; theo dõi `zca-js` upstream, có nick test smoke hằng ngày |
| Khách kỳ vọng AI "biết hết" → thất vọng | Cao | Onboarding ép nạp FAQ, gợi ý FAQ từ lịch sử, fallback rõ ràng, hiển thị % câu trả lời được |
| Chi phí AI vượt giá gói | Trung | Hạn mức theo gói, model rẻ cho gói thấp, cache câu hỏi lặp, cảnh báo shop bất thường |
| Rò rỉ dữ liệu chéo shop (G1/G2) | Hiện hữu | Sửa trước khi có khách thứ 2 — điểm chặn tuyệt đối |
| Tuân thủ Luật 91/2025 (chuyển dữ liệu xuyên biên giới) | Trung | Tư vấn sớm, DPA, lộ trình LLM/KB tại VN |
| Đối thủ lớn (Subiz, Zalo) ra AI Zalo cá nhân rẻ | Trung | Tốc độ, chuyên môn ngành (template KB), trải nghiệm 5 phút, cộng đồng; chuyển dần lên OA + inbox |
| Worker single-instance sập → toàn bộ khách mất bot | Trung | Leader lock + auto-restart + alert; sharding theo shop khi > 200 session |
| Cạn tiền trước PMF | Trung | Trả năm −20%, founding member, chi phí cố định < 8 triệu/tháng |

---

## 17. Việc cần founder chốt ngay (blocking decisions)

1. **Tên & domain thương hiệu** cho bán hàng (giữ `omnichat.ncgstudio.tech` hay mua domain riêng).
2. **Mức giá chốt** cho Starter/Pro (đề xuất 149k/349k) và có Free tier hay Trial 14 ngày.
3. **Cổng thanh toán** (payOS hay SePay) và tài khoản ngân hàng công ty nhận tiền.
4. **Nhà cung cấp OTP** (SMS brandname vs ZNS qua OA NCG).
5. **Hosting VN** cụ thể và thời điểm chuyển API khỏi hạ tầng hiện tại (`api-ncg.smart-go.me`).
6. **Có tách sản phẩm khỏi SmartGo hoàn toàn không** (persona/KB theo shop thay hard-code) — đề xuất: có, SmartGo trở thành 1 shop/khách hàng nội bộ.
7. **Ngân sách pháp lý** cho ToS/DPA/tư vấn Luật 91/2025.

---

## Phụ lục A — Bản đồ tính năng → API/entity hiện có (để FE/BE đối chiếu nhanh)

| Tính năng | API hiện có | Entity/Store | Thiếu |
|-----------|-------------|--------------|-------|
| Đăng ký/OTP/login/refresh/sessions | `/public/auth/*`, `/auth/*` | Redis `auth:*` | OTP provider, throttle riêng |
| Hồ sơ | `/users/me` | `users` | |
| Shop | `/admin/shops*` | `shops` | Tenant guard, plan fields |
| Kết nối Zalo | `/admin/zalo/login-qr` (SSE), `/admin/zalo/sessions*`, `/disconnect` | `zalo_sessions` | Alert expired, nhiều Zalo/shop |
| Bot pipeline | (worker) | `zalo_chat_history` | `shopId`, pause, rate limit, giờ hoạt động |
| Persona | — | — | `bot_profiles` |
| Kiến thức | — (search nội bộ) | Zilliz `smart_go_knowledge_v5` | Ingest API, filter `shopId` |
| Lịch sử chat FE | — | `zalo_chat_history` | Controller `/conversations` |
| Gói/hạn mức/thanh toán | — | — | `plans`, `subscriptions`, `usage_monthly`, webhook payOS/SePay |
| Báo cáo | — | — | Aggregation theo shop/tuần |

## Phụ lục B — Tài liệu nên tách tiếp

0. **Kế hoạch vá lỗ hổng & hoàn thiện Track A (BE):** `docs/IMPLEMENTATION_PLAN.md` — wave 0–4, map ticket GTM → file code, hợp đồng API cho FE.
1. Kịch bản video demo & bài đăng group theo ngành (mỹ phẩm/thời trang, spa, BĐS).
2. Bộ 30 FAQ mẫu theo ngành để onboarding.
3. Runbook vận hành: session expired, Zalo đổi API, DashScope/Zilliz lỗi, khôi phục backup.
4. ToS / Chính sách bảo mật / DPA (bản luật sư).
5. ADR: module `channel` trừu tượng cho Track B; chiến lược sharding worker.
