# OMNICHAT — TÀI LIỆU BUSINESS TỔNG THỂ DỰ ÁN KHỞI NGHIỆP

> **Nền tảng CSKH đa kênh tích hợp Chatbot AI vào nhóm Zalo và các nền tảng MXH chat**
>
> Phiên bản: 1.1 — Tháng 09/2026
> Trạng thái: Đã xác thực tính khả thi kỹ thuật (POC chatbot trong nhóm Zalo thành công)
> Phạm vi: Tài liệu business chuyên sâu — bối cảnh thị trường, tiềm năng, cơ hội, kế hoạch, phương hướng triển khai và toàn bộ thông tin nền tảng của dự án.
>
> **Lưu ý phạm vi chia sẻ**: tài liệu này được biên soạn để có thể chia sẻ cho đối tác, nhà đầu tư, nhân sự mới. Toàn bộ chi tiết kỹ thuật, kiến trúc hệ thống, đường tích hợp API và bí quyết triển khai được tách sang phụ lục riêng **`OMNICHAT_CONFIDENTIAL_TECH_APPENDIX.md` (tài liệu mật — không chia sẻ ra ngoài nhóm sáng lập/kỹ sư core)**.

---

## MỤC LỤC

1. [Tóm tắt điều hành (Executive Summary)](#1-tóm-tắt-điều-hành-executive-summary)
2. [Bối cảnh thị trường & Vấn đề cần giải quyết](#2-bối-cảnh-thị-trường--vấn-đề-cần-giải-quyết)
3. [Phân tích thị trường (TAM / SAM / SOM)](#3-phân-tích-thị-trường-tam--sam--som)
4. [Phân tích cạnh tranh](#4-phân-tích-cạnh-tranh)
5. [Sản phẩm & Giải pháp](#5-sản-phẩm--giải-pháp)
6. [Kết quả thử nghiệm (POC) & Bài học](#6-kết-quả-thử-nghiệm-poc--bài-học)
7. [Mô hình kinh doanh & Chính sách giá](#7-mô-hình-kinh-doanh--chính-sách-giá)
8. [Chiến lược Go-to-Market](#8-chiến-lược-go-to-market)
9. [Lộ trình triển khai theo giai đoạn](#9-lộ-trình-triển-khai-theo-giai-đoạn)
10. [Nền tảng công nghệ (tổng quan)](#10-nền-tảng-công-nghệ-tổng-quan)
11. [Pháp lý & Tuân thủ](#11-pháp-lý--tuân-thủ)
12. [Phân tích rủi ro & Phương án giảm thiểu](#12-phân-tích-rủi-ro--phương-án-giảm-thiểu)
13. [Kế hoạch tài chính & Unit Economics](#13-kế-hoạch-tài-chính--unit-economics)
14. [Tổ chức đội ngũ & Vận hành](#14-tổ-chức-đội-ngũ--vận-hành)
15. [Hệ thống KPI & Đo lường](#15-hệ-thống-kpi--đo-lường)
16. [Phụ lục: Nguồn tham khảo & Thuật ngữ](#16-phụ-lục-nguồn-tham-khảo--thuật-ngữ)

---

## 1. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

### 1.1. Ý tưởng cốt lõi

**Omnichat** là nền tảng chăm sóc khách hàng (CSKH) đa kênh, với điểm khác biệt chiến lược là **chatbot AI hoạt động trực tiếp bên trong nhóm chat Zalo** — nơi mà hầu hết doanh nghiệp Việt Nam đang vận hành CSKH thủ công — và mở rộng ra các nền tảng MXH chat khác (Facebook Messenger, Telegram, TikTok, Instagram, Livechat website).

Trong thời đại số, khối lượng yêu cầu hỗ trợ khách hàng tăng nhanh hơn khả năng tuyển dụng và đào tạo nhân sự CSKH. Doanh nghiệp Việt Nam có một đặc thù riêng: **kênh giao tiếp chính với khách hàng là Zalo**, và đặc biệt là **nhóm Zalo** (nhóm hỗ trợ khách VIP, nhóm dự án, nhóm đại lý, nhóm lớp học, nhóm cư dân...). Đây là khoảng trống mà các nền tảng chatbot quốc tế không phục vụ và các đối thủ trong nước chưa khai thác tốt.

### 1.2. Tình trạng dự án

- **Đã hoàn thành POC**: chatbot đã được tích hợp thành công vào nhóm Zalo, trò chuyện với thành viên nhóm theo thời gian thực. Tính khả thi kỹ thuật được xác nhận.
- **Đã có nền tảng backend**: hệ thống backend Omnichat đã được dựng khung theo kiến trúc hiện đại, sẵn sàng phát triển các module nghiệp vụ.
- **Điều kiện nền tảng thuận lợi**: từ 2025, Zalo chính thức mở **API Quản lý nhóm (GMF — Group Management Function)** cho Official Account gói Nâng cao/Premium, cho phép tạo nhóm, quản lý nhóm và gửi tin nhắn vào nhóm qua OpenAPI. Tin OA gửi vào nhóm GMF **miễn phí đến 31/12/2026** — cửa sổ vàng để chiếm lĩnh thị trường với chi phí tin nhắn gần bằng 0.

### 1.3. Con số thị trường then chốt

| Chỉ số | Giá trị | Nguồn |
|---|---|---|
| Người dùng Zalo hàng tháng (MAU) | ~79,6 triệu (cuối 2025), ~81,3 triệu (giữa 2026) | VNG, Decision Lab |
| Tin nhắn Zalo mỗi ngày | > 2,1 tỷ | VNG Q4/2025 |
| Tỷ lệ thâm nhập Zalo (messaging) | 81–83% người dùng Internet VN — số 1 thị trường | Decision Lab "The Connected Consumer" |
| Zalo OA trả phí hàng tháng | ~25.500 tài khoản (Q3/2025), 17.210 OA hoạt động trong hệ sinh thái | VNG |
| Thị trường chatbot Việt Nam | 37 triệu USD (2025) → 213 triệu USD (2034), CAGR 21,5% | IMARC Group |
| Thị trường Conversational AI VN | 64,3 triệu USD (2025) → 268,8 triệu USD (2034), CAGR 17,2% | IMARC Group |
| Số doanh nghiệp SME tại VN | ~900.000 doanh nghiệp + ~5 triệu hộ kinh doanh | Bộ KH&ĐT |

### 1.4. Đề xuất giá trị (Value Proposition)

> "Biến mỗi nhóm Zalo thành một trung tâm CSKH tự động: chatbot AI trả lời 24/7 ngay trong nhóm, nhân viên chỉ can thiệp khi thực sự cần, mọi hội thoại đều được quản lý tập trung trên một nền tảng duy nhất."

### 1.5. Mục tiêu chiến lược 3 giai đoạn

1. **Giai đoạn thâm nhập**: thống lĩnh ngách "chatbot nhóm Zalo" — thị trường gần như chưa có đối thủ trực tiếp; đạt nhóm khách hàng trả phí đầu tiên (mục tiêu 100–300 doanh nghiệp).
2. **Giai đoạn mở rộng**: trở thành nền tảng omnichannel CSKH đầy đủ (Zalo cá nhân/OA/nhóm + Messenger + Telegram + Livechat), tích hợp AI trả lời theo tri thức doanh nghiệp (RAG).
3. **Giai đoạn dẫn đầu**: hệ sinh thái CSKH — mini CRM, automation marketing, phân tích hội thoại, marketplace tích hợp; hướng tới 1% thị phần conversational AI Việt Nam (~2–2,5 triệu USD ARR vào năm thứ 4–5 theo đà tăng trưởng thị trường).

---

## 2. BỐI CẢNH THỊ TRƯỜNG & VẤN ĐỀ CẦN GIẢI QUYẾT

### 2.1. Bối cảnh vĩ mô

1. **Chuyển đổi số quốc gia tăng tốc**: Chính phủ Việt Nam đặt mục tiêu kinh tế số chiếm 30% GDP vào 2030. Doanh nghiệp mọi quy mô đều chịu áp lực số hóa quy trình bán hàng và CSKH.
2. **Thương mại hội thoại (conversational commerce) trở thành chuẩn mực**: người Việt có thói quen "chat trước khi mua" — hỏi giá, hỏi tồn kho, mặc cả, tra cứu đơn hàng đều qua chat thay vì website/email.
3. **AI tạo sinh (Generative AI) đạt độ chín**: chi phí gọi LLM giảm mạnh qua từng năm, chất lượng tiếng Việt của các model đã đủ tốt để tự động hóa 60–80% câu hỏi lặp lại của khách hàng. 30% người dùng Zalo hàng tháng đã từng trải nghiệm tính năng AI ngay trong app (số liệu cuối 2025) — nghĩa là khách hàng cuối **đã quen** với việc tương tác với AI.
4. **Chi phí nhân sự CSKH tăng**: lương nhân viên CSKH tại VN trung bình 8–15 triệu đồng/tháng, tỷ lệ nghỉ việc ngành này cao (30–40%/năm), chi phí đào tạo lại lớn.

### 2.2. Đặc thù thị trường Việt Nam: Zalo là "hạ tầng giao tiếp"

- Zalo không chỉ là app nhắn tin — nó là kênh giao tiếp mặc định giữa doanh nghiệp ↔ khách hàng, trường học ↔ phụ huynh, chính quyền ↔ người dân, chủ đầu tư ↔ cư dân.
- **Văn hóa "lập nhóm Zalo"**: mọi giao dịch có tính lặp lại đều sinh ra một nhóm Zalo — nhóm khách VIP của shop, nhóm hỗ trợ kỹ thuật của đại lý phần mềm, nhóm dự án của công ty xây dựng, nhóm lớp học của trung tâm tiếng Anh, nhóm cư dân chung cư, nhóm cộng tác viên bán hàng. Một doanh nghiệp SME điển hình vận hành từ vài chục đến vài trăm nhóm Zalo.
- **Vấn đề**: toàn bộ các nhóm này được trả lời **thủ công**. Không có công cụ nào quản lý tập trung, không đo lường được, không tự động hóa được, phụ thuộc hoàn toàn vào việc nhân viên có online hay không.

### 2.3. Nỗi đau của khách hàng mục tiêu (Pain Points)

| # | Nỗi đau | Hệ quả |
|---|---|---|
| 1 | Khách nhắn vào nhóm Zalo ngoài giờ hành chính không ai trả lời | Mất khách, giảm uy tín, khách chuyển sang đối thủ |
| 2 | Cùng một câu hỏi (giá, chính sách, hướng dẫn) được hỏi lặp lại hàng trăm lần ở hàng chục nhóm | Nhân viên kiệt sức với việc lặp lại, chi phí nhân sự phình to theo số nhóm |
| 3 | Hội thoại phân mảnh trên nhiều kênh (Zalo cá nhân, OA, nhóm, Messenger, comment...) | Không có cái nhìn 360° về khách hàng, bỏ sót yêu cầu |
| 4 | Không đo lường được chất lượng CSKH (thời gian phản hồi, tỷ lệ giải quyết, mức độ hài lòng) | Không thể cải tiến, không quy trách nhiệm được |
| 5 | Tri thức nghiệp vụ nằm trong đầu nhân viên kỳ cựu | Nhân viên nghỉ là "mất não", đào tạo người mới tốn 1–3 tháng |
| 6 | Công cụ chatbot hiện có chỉ hỗ trợ chat 1-1 (OA/Fanpage), không vào được nhóm | Mảng giao tiếp quan trọng nhất (nhóm) bị bỏ trống |

### 2.4. Tại sao là bây giờ? (Why Now)

1. **Zalo vừa mở API nhóm chính thức (GMF)** — trước đây về mặt kỹ thuật, đường chính thống không tồn tại; nay OA gói Nâng cao/Premium có thể tạo nhóm, quản lý nhóm và gửi tin vào nhóm qua OpenAPI chính thức. Ai vào sớm sẽ chiếm lĩnh mindshare.
2. **Tin nhắn nhóm GMF đang miễn phí đến 31/12/2026** — giai đoạn vàng để khách hàng dùng thử không rào cản chi phí tin nhắn, và để Omnichat xây tập khách hàng trước khi Zalo thu phí.
3. **LLM tiếng Việt đủ tốt và đủ rẻ** để chatbot trả lời tự nhiên, không còn là "bot kịch bản cứng" gây ức chế như thế hệ chatbot 2018–2021.
4. **POC đã thành công** — rủi ro kỹ thuật lớn nhất (bot hoạt động được trong nhóm Zalo) đã được loại bỏ.

---

## 3. PHÂN TÍCH THỊ TRƯỜNG (TAM / SAM / SOM)

### 3.1. Quy mô thị trường

**TAM (Total Addressable Market) — Thị trường CSKH hội thoại + chatbot Việt Nam:**

- Thị trường conversational AI Việt Nam: **64,3 triệu USD (2025)**, dự báo **268,8 triệu USD (2034)**, CAGR ~17,2% (IMARC).
- Thị trường chatbot thuần: **37 triệu USD (2025)** → **213,3 triệu USD (2034)**, CAGR 21,5% (IMARC).
- Cộng thêm thị trường phần mềm quản lý bán hàng/CSKH đa kênh (các nền tảng như Pancake, Haravan đang khai thác) ước tính 80–120 triệu USD/năm.
- **TAM ước tính: ~150–200 triệu USD/năm và tăng trưởng ~20%/năm.**

**SAM (Serviceable Addressable Market) — Doanh nghiệp VN dùng Zalo/MXH chat làm kênh CSKH chính:**

- ~900.000 doanh nghiệp SME + ~5 triệu hộ kinh doanh; trong đó nhóm chủ động chi tiền cho công cụ chat/CSKH (đang trả phí OA, Pancake, Haravan, phần mềm quản lý bán hàng...) ước tính 150.000–250.000 đơn vị.
- Với mức chi tiêu trung bình 3–10 triệu đồng/năm/doanh nghiệp cho công cụ chat: **SAM ≈ 30–60 triệu USD/năm.**

**SOM (Serviceable Obtainable Market) — mục tiêu chiếm lĩnh 3–5 năm:**

- Ngách "chatbot nhóm Zalo + omnichannel cho SME": mục tiêu 2.000–5.000 khách hàng trả phí sau 3 năm, ARPU 6–15 triệu đồng/năm.
- **SOM ≈ 0,8–2,5 triệu USD ARR sau 3 năm; 2–5 triệu USD ARR sau 5 năm.**

### 3.2. Phân khúc khách hàng mục tiêu

| Phân khúc | Đặc điểm | Use case nhóm Zalo | Mức độ ưu tiên |
|---|---|---|---|
| **SME bán lẻ / e-commerce** | 5–50 nhân sự, bán qua MXH là chính | Nhóm khách VIP, nhóm CTV/đại lý, nhóm flash-sale | ⭐⭐⭐⭐⭐ (beachhead) |
| **Giáo dục (trung tâm, trường tư)** | Nhiều nhóm lớp, nhóm phụ huynh | Thông báo lịch học, trả lời thắc mắc học phí/chương trình | ⭐⭐⭐⭐⭐ |
| **Phần mềm / dịch vụ kỹ thuật** | Mỗi khách hàng B2B = 1 nhóm hỗ trợ | Hỗ trợ kỹ thuật cấp 1 tự động, escalate cho kỹ sư | ⭐⭐⭐⭐ |
| **Bất động sản / quản lý tòa nhà** | Nhóm cư dân, nhóm dự án | FAQ phí dịch vụ, báo sự cố, thông báo | ⭐⭐⭐⭐ |
| **Y tế / thẩm mỹ / spa** | Nhóm chăm sóc sau dịch vụ | Nhắc lịch, hướng dẫn chăm sóc, đặt lịch lại | ⭐⭐⭐ |
| **Tài chính / bảo hiểm (đại lý)** | Nhóm tư vấn viên, nhóm khách hàng | Tra cứu sản phẩm, tính phí minh họa | ⭐⭐⭐ |
| **Doanh nghiệp lớn / enterprise** | Cần on-premise, SLA, bảo mật cao | Nhóm nội bộ + nhóm đối tác quy mô lớn | ⭐⭐ (giai đoạn sau) |

### 3.3. Chân dung khách hàng điển hình (ICP — Ideal Customer Profile)

- Doanh nghiệp 5–100 nhân sự, có đội CSKH/bán hàng 2–15 người.
- Đang vận hành **≥ 10 nhóm Zalo** với khách hàng/đại lý/học viên.
- Nhận ≥ 50 tin nhắn hỏi đáp mỗi ngày, trong đó ≥ 60% là câu hỏi lặp lại.
- Đã trả phí ít nhất 1 công cụ số (OA, phần mềm bán hàng, quảng cáo) — có sẵn thói quen chi tiêu SaaS.
- Người quyết định mua: chủ doanh nghiệp hoặc trưởng phòng CSKH/kinh doanh.

---

## 4. PHÂN TÍCH CẠNH TRANH

### 4.1. Bản đồ cạnh tranh

| Nhóm | Đại diện | Điểm mạnh | Điểm yếu (cơ hội cho Omnichat) |
|---|---|---|---|
| **Nền tảng quản lý bán hàng đa kênh nội địa** | Pancake, Haravan/Harasocial, Sapo, Nhanh.vn | Tập khách lớn, tích hợp sàn TMĐT, đội sales mạnh | Chatbot chủ yếu kịch bản cứng cho fanpage/OA 1-1; **không có chatbot trong nhóm Zalo**; AI mới ở mức cơ bản |
| **Nền tảng chatbot nội địa** | AhaChat, Fchat, BotBanHang, Chative | Giá rẻ, dễ dùng, template sẵn | Tập trung Messenger; hỗ trợ Zalo hạn chế (chỉ OA 1-1); không có omnichannel inbox sâu |
| **Conversational AI enterprise nội địa** | FPT.AI, Viettel Cyberbot, VinBigData ViVi | NLP tiếng Việt tốt, uy tín với enterprise | Giá cao, chu kỳ triển khai dài, không phù hợp SME; không đánh ngách nhóm Zalo |
| **Nền tảng quốc tế** | Intercom, Zendesk, Tidio, ManyChat, Chatwoot (OSS) | Sản phẩm trưởng thành, AI mạnh | Không hỗ trợ Zalo (đặc biệt là nhóm); giá USD đắt; không am hiểu thị trường VN |
| **Tool automation Zalo "xám"** | Các tool nuôi nick, auto-inbox cá nhân | Đáp ứng nhu cầu thật | Rủi ro khóa tài khoản cao, không có tư cách pháp lý, không thể bán cho doanh nghiệp nghiêm túc |

### 4.2. Kết luận cạnh tranh

1. **Khoảng trống rõ ràng**: chưa có sản phẩm thương mại nghiêm túc nào giải quyết bài toán *chatbot AI trong nhóm Zalo* kết hợp *quản lý hội thoại tập trung*. Các đối thủ lớn tập trung vào chat 1-1 qua OA/fanpage.
2. **Lợi thế người đi trước có thời hạn**: khi Zalo GMF phổ biến, các đối thủ (đặc biệt Pancake, Haravan) sẽ theo sau. Lợi thế 12–24 tháng cần được chuyển hóa thành: tập khách hàng trung thành, dữ liệu huấn luyện AI theo ngành, và độ sâu sản phẩm.
3. **Chiến lược khác biệt hóa**: không đối đầu trực diện với các nền tảng quản lý bán hàng; định vị là **"lớp AI CSKH"** có thể dùng độc lập hoặc tích hợp cùng công cụ họ đang dùng.

### 4.3. Định vị (Positioning Statement)

> Dành cho các doanh nghiệp SME Việt Nam đang chăm sóc khách hàng qua hàng chục nhóm Zalo và các kênh MXH chat, **Omnichat** là nền tảng CSKH đa kênh duy nhất đưa chatbot AI vào tận nhóm Zalo, giúp giảm ≥ 60% khối lượng trả lời thủ công và không bỏ sót bất kỳ khách hàng nào — khác với các công cụ chatbot hiện tại chỉ hoạt động trong hội thoại 1-1.

---

## 5. SẢN PHẨM & GIẢI PHÁP

### 5.1. Tổng quan sản phẩm

Omnichat gồm 4 lớp năng lực chính:

```
┌─────────────────────────────────────────────────────────────┐
│  LỚP 4 — PHÂN TÍCH & TỐI ƯU                                  │
│  Dashboard, báo cáo SLA, phân tích chủ đề hội thoại, CSAT    │
├─────────────────────────────────────────────────────────────┤
│  LỚP 3 — TỰ ĐỘNG HÓA & AI                                    │
│  Chatbot AI (LLM + RAG tri thức doanh nghiệp), kịch bản,     │
│  auto-tag, định tuyến, escalate người thật, broadcast        │
├─────────────────────────────────────────────────────────────┤
│  LỚP 2 — HỘP THƯ HỢP NHẤT (UNIFIED INBOX)                    │
│  Quản lý tập trung mọi hội thoại: nhóm Zalo, Zalo OA 1-1,    │
│  Messenger, Telegram, Livechat; phân công agent, ghi chú,    │
│  hồ sơ khách hàng 360°                                       │
├─────────────────────────────────────────────────────────────┤
│  LỚP 1 — KẾT NỐI KÊNH (CHANNEL CONNECTORS)                   │
│  Zalo OA + GMF API (nhóm), Facebook Messenger API,           │
│  Telegram Bot API, Livechat widget, (mở rộng: TikTok, IG)    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2. Tính năng "ngôi sao": Chatbot AI trong nhóm Zalo

**Trải nghiệm từ góc nhìn khách hàng (doanh nghiệp):**

1. Doanh nghiệp kết nối Zalo OA (gói Nâng cao/Premium) với Omnichat và chọn các nhóm muốn bật trợ lý.
2. Khách hàng nhắn trong nhóm, trợ lý AI phân tích và xử lý:
   - Câu hỏi thuộc tri thức doanh nghiệp (FAQ, chính sách, sản phẩm) → **bot trả lời ngay trong nhóm**, 24/7.
   - Câu hỏi phức tạp / khiếu nại / cảm xúc tiêu cực → **chuyển cho người thật**: thông báo nhân viên phụ trách, bot trả lời giữ nhịp ("Em đã ghi nhận, anh A sẽ hỗ trợ mình trong ít phút ạ").
3. Toàn bộ hội thoại đồng bộ về Unified Inbox để nhân viên theo dõi, tiếp quản, và hệ thống đo lường.

**AI trả lời theo tri thức riêng của từng doanh nghiệp:**

- Doanh nghiệp nạp tri thức: file giá, chính sách, tài liệu hướng dẫn, lịch sử Q&A — bot chỉ trả lời dựa trên nguồn này, có cơ chế kiểm soát để không bịa thông tin và từ chối lịch sự khi câu hỏi ngoài phạm vi.
- Học liên tục: câu bot trả lời chưa tốt được nhân viên sửa và hệ thống ghi nhớ cho các lần sau.

**Được thiết kế riêng cho ngữ cảnh "nhóm" (khác biệt với chat 1-1):** bot hiểu khi nào nên trả lời và khi nào nên im lặng, không làm phiền hội thoại giữa các thành viên, không spam, phân biệt được khách hàng với nhân viên nội bộ. Đây là lớp know-how vận hành quan trọng nhất của sản phẩm (chi tiết thuộc phụ lục kỹ thuật mật).

### 5.3. Danh mục tính năng theo phiên bản

| Tính năng | MVP | V1 | V2 |
|---|:---:|:---:|:---:|
| Kết nối Zalo OA + nhóm GMF | ✅ | ✅ | ✅ |
| Chatbot AI trả lời trong nhóm (RAG) | ✅ | ✅ | ✅ |
| Unified Inbox (Zalo nhóm + OA 1-1) | ✅ | ✅ | ✅ |
| Escalate người thật + phân công agent | ✅ | ✅ | ✅ |
| Quản lý tri thức (upload tài liệu, FAQ) | ✅ | ✅ | ✅ |
| Dashboard cơ bản (số hội thoại, tỷ lệ bot tự giải quyết) | ✅ | ✅ | ✅ |
| Kênh Facebook Messenger + Telegram + Livechat | — | ✅ | ✅ |
| Broadcast/thông báo vào nhóm theo lịch | — | ✅ | ✅ |
| Kịch bản automation (keyword, form thu lead, nhắc lịch) | — | ✅ | ✅ |
| Hồ sơ khách hàng 360° + mini CRM | — | ✅ | ✅ |
| Báo cáo SLA, CSAT, phân tích chủ đề bằng AI | — | — | ✅ |
| API mở + webhook cho bên thứ ba, marketplace tích hợp | — | — | ✅ |
| Multi-workspace, phân quyền nâng cao, audit log | — | — | ✅ |

### 5.4. Nguyên tắc thiết kế sản phẩm

1. **Onboard trong 30 phút**: kết nối OA → nạp 1 file FAQ → bot chạy được ngay trong nhóm đầu tiên.
2. **Human-in-the-loop mặc định**: bot không bao giờ là "hộp đen"; nhân viên luôn thấy được, sửa được, tắt được theo từng nhóm.
3. **AI có kiểm soát**: mọi câu trả lời truy vết được về nguồn tri thức; có chế độ "duyệt trước khi gửi" cho doanh nghiệp thận trọng.
4. **Thiết kế cho tiếng Việt và văn hóa chat Việt**: xưng hô (anh/chị/em), teencode, viết tắt, tin nhắn chia nhỏ nhiều dòng.

---

## 6. KẾT QUẢ THỬ NGHIỆM (POC) & BÀI HỌC

### 6.1. Những gì đã được xác thực

| Hạng mục | Kết quả |
|---|---|
| Tích hợp chatbot vào nhóm Zalo | ✅ Thành công — bot nhận và gửi tin trong nhóm theo thời gian thực |
| Khả năng hội thoại | ✅ Bot trò chuyện tự nhiên với thành viên nhóm |
| Tính khả thi tổng thể | ✅ Được đánh giá khả thi để thương mại hóa |

### 6.2. Các câu hỏi cần trả lời tiếp theo (từ POC → sản phẩm)

1. **Chuẩn hóa hạ tầng sản xuất**: chuyển từ môi trường thử nghiệm POC sang nền tảng vận hành chuẩn thương mại, bền vững về pháp lý và kỹ thuật (chi tiết lộ trình chuyển đổi thuộc phụ lục kỹ thuật mật).
2. **Độ ổn định ở quy mô**: tốc độ phản hồi (< 3–5 giây là ngưỡng trải nghiệm tốt), xử lý đồng thời hàng trăm nhóm.
3. **Chất lượng AI theo ngành**: đo tỷ lệ trả lời đúng trên tập câu hỏi thật của 2–3 ngành beachhead trước khi bán rộng.
4. **Hành vi trong nhóm đông người**: đảm bảo bot nói đúng lúc, đúng người, không gây phiền.

### 6.3. Tiêu chí "gate" chuyển giai đoạn

- POC → MVP: 3–5 doanh nghiệp pilot dùng thật ≥ 4 tuần, bot tự giải quyết ≥ 50% câu hỏi, không sự cố nghiêm trọng.
- MVP → thương mại: ≥ 70% pilot sẵn sàng trả phí; NPS pilot ≥ 40.

---

## 7. MÔ HÌNH KINH DOANH & CHÍNH SÁCH GIÁ

### 7.1. Mô hình: SaaS thuê bao + thành phần theo mức dùng

- **Thuê bao theo gói (subscription)**: tính theo số kênh kết nối, số nhóm Zalo được bot phục vụ, số agent seat.
- **Theo mức dùng (usage-based)**: số lượt câu trả lời AI/tháng vượt hạn mức (bảo vệ biên lợi nhuận trước chi phí LLM).
- **Dịch vụ triển khai (services)**: gói setup tri thức, tinh chỉnh bot theo ngành cho khách Enterprise.

### 7.2. Bảng giá đề xuất (giai đoạn ra mắt)

| | **Starter** | **Growth** | **Business** | **Enterprise** |
|---|---|---|---|---|
| Giá/tháng (thanh toán năm) | **399.000đ** | **990.000đ** | **2.490.000đ** | Liên hệ |
| Nhóm Zalo có bot | 5 | 20 | 60 | Không giới hạn |
| Kênh kết nối | Zalo | Zalo + 2 kênh | Tất cả kênh | Tất cả + API |
| Agent seats | 2 | 5 | 15 | Tùy chỉnh |
| Lượt trả lời AI/tháng | 1.000 | 5.000 | 20.000 | Tùy chỉnh |
| Tri thức doanh nghiệp | 10 tài liệu | 50 tài liệu | Không giới hạn | + huấn luyện riêng |
| Báo cáo | Cơ bản | Đầy đủ | Đầy đủ + xuất | + SLA riêng |
| Hỗ trợ | Cộng đồng | Ưu tiên | Chuyên viên | Dedicated + on-premise option |

- **Dùng thử 14 ngày** đầy đủ tính năng gói Growth, không cần thẻ.
- Vượt hạn mức AI: ~200–300đ/lượt trả lời.
- Ghi chú: khách hàng tự trả phí gói Zalo OA Nâng cao/Premium và gói GMF cho Zalo (theo bảng giá Zalo Cloud: OA Nâng cao ~1,07 triệu/năm; GMF từ 25.000–300.000đ/gói/tháng tùy số nhóm) — Omnichat hướng dẫn đăng ký, minh bạch chi phí tổng sở hữu.

### 7.3. Logic ARPU & mở rộng doanh thu

- ARPU mục tiêu năm 1: ~700.000–900.000đ/tháng (trọng tâm Growth).
- Động lực expansion: số nhóm tăng theo tăng trưởng của chính khách hàng → nâng gói tự nhiên; thêm kênh; thêm seat; module V2 (CRM, phân tích) bán kèm (upsell 20–30% ARPU).
- Net Revenue Retention mục tiêu ≥ 110% từ năm 2.

---

## 8. CHIẾN LƯỢC GO-TO-MARKET

### 8.1. Chiến lược beachhead: "Đánh sâu 2 ngành, lan theo hình mẫu"

**Ngành mũi nhọn 1 — Giáo dục (trung tâm ngoại ngữ, kỹ năng):** mật độ nhóm Zalo cao nhất (mỗi lớp 1 nhóm), câu hỏi lặp lại chuẩn hóa cao (lịch học, học phí, giáo trình), khách hàng tập trung ở đô thị, dễ tiếp cận qua cộng đồng chủ trung tâm.

**Ngành mũi nhọn 2 — SME bán lẻ có hệ thống đại lý/CTV:** nhóm đại lý cần trả lời chính sách/giá liên tục; giá trị đo được ngay bằng số đơn không bị bỏ lỡ.

### 8.2. Kênh tăng trưởng theo thứ tự ưu tiên

1. **Founder-led sales + pilot có tay dắt (tháng đầu)**: 20–30 cuộc demo trực tiếp, chuyển 5–10 thành pilot; xây 3 case study định lượng ("giảm 70% tin nhắn phải trả lời tay", "phản hồi 24/7, thời gian phản hồi trung bình từ 4 giờ còn 5 giây").
2. **Content + SEO tiếng Việt**: từ khóa "chatbot nhóm Zalo", "quản lý nhóm Zalo cho doanh nghiệp", "CSKH tự động Zalo" — cạnh tranh SEO gần bằng 0 vì ngách mới.
3. **Cộng đồng & KOL ngành**: nhóm Facebook/Zalo của chủ shop, chủ trung tâm giáo dục; webinar "vận hành 100 nhóm Zalo với 1 nhân viên".
4. **Đối tác & đại lý (từ V1)**: agency quảng cáo/chuyển đổi số địa phương làm reseller (chiết khấu 20–30%); tích hợp/hợp tác với nền tảng quản lý bán hàng chưa có năng lực này.
5. **Product-led growth**: gói dùng thử tự phục vụ; watermark "Powered by Omnichat" trong tin bot ở gói thấp (tùy chọn gỡ ở gói cao) tạo vòng lan truyền tự nhiên giữa các nhóm Zalo.

### 8.3. Phễu chuyển đổi mục tiêu

```
Truy cập website/landing  →  Đăng ký dùng thử  →  Kết nối OA + nhóm đầu tiên (activation)
        100%                      8–12%                       50–60%
→  Bot trả lời 50 câu đầu (aha-moment)  →  Chuyển trả phí  →  Gia hạn năm
              70%                              25–35%              ≥ 80%
```

### 8.4. Thông điệp truyền thông chủ đạo

- "**Nhóm Zalo không ngủ** — khách hỏi lúc 11 giờ đêm vẫn có câu trả lời."
- "**1 nhân viên quản lý 100 nhóm** — AI trả lời câu lặp lại, người lo việc khó."
- "**Không bỏ sót một khách nào** — mọi tin nhắn từ mọi kênh về một màn hình."

---

## 9. LỘ TRÌNH TRIỂN KHAI THEO GIAI ĐOẠN

> Lộ trình chia theo giai đoạn với tiêu chí hoàn thành (exit criteria) rõ ràng thay vì mốc lịch cứng; thứ tự ưu tiên có thể điều chỉnh theo phản hồi thị trường.

### Giai đoạn 0 — Củng cố nền móng (hiện tại)

- Hoàn thiện tích hợp Zalo chính thức (OA + GMF) đạt chuẩn vận hành thương mại.
- Hoàn thiện nền tảng backend Omnichat cho các module nghiệp vụ cốt lõi.
- Dựng engine AI phiên bản đầu: trả lời theo tri thức doanh nghiệp, có cơ chế kiểm soát chất lượng.
- (Danh sách việc kỹ thuật chi tiết: xem phụ lục kỹ thuật mật.)
- **Exit criteria**: 1 nhóm Zalo demo chạy ổn định 2 tuần liên tục qua đường tích hợp chính thức, độ trễ trả lời < 5 giây.

### Giai đoạn 1 — MVP + Pilot

- Unified Inbox tối thiểu (xem hội thoại nhóm, tiếp quản, tắt/bật bot theo nhóm).
- Màn hình quản lý tri thức; dashboard 5 chỉ số cốt lõi.
- Tuyển 3–5 doanh nghiệp pilot (ưu tiên giáo dục + bán lẻ), vận hành sát, đo tỷ lệ bot tự giải quyết.
- **Exit criteria**: ≥ 50% câu hỏi được bot tự giải quyết ở pilot; ≥ 70% pilot đồng ý trả phí; hoàn thiện quy trình onboarding ≤ 30 phút.

### Giai đoạn 2 — Thương mại hóa

- Ra mắt bảng giá, billing (thanh toán VN: chuyển khoản/VietQR, sau đó cổng thanh toán), self-service onboarding.
- Thêm kênh Messenger + Livechat widget; broadcast nhóm theo lịch; kịch bản automation cơ bản.
- Chạy máy content/SEO + case study; bắt đầu chương trình đại lý.
- **Exit criteria**: 100 khách trả phí đầu tiên; churn tháng < 5%; CAC hoàn vốn < 6 tháng.

### Giai đoạn 3 — Mở rộng sản phẩm & thị phần

- Telegram, TikTok/Instagram (khi API cho phép); hồ sơ khách 360° + mini CRM; báo cáo SLA/CSAT; phân tích chủ đề hội thoại bằng AI.
- Gói Enterprise (phân quyền, audit log, SLA, tùy chọn private deployment).
- Chuẩn bị cho thời điểm Zalo thu phí tin nhóm (sau 31/12/2026): công cụ tối ưu chi phí tin, báo cáo chi phí/tin cho khách.
- **Exit criteria**: 500–1.000 khách trả phí; NRR ≥ 110%; ≥ 2 ngành có playbook bán hàng lặp lại được.

### Giai đoạn 4 — Hệ sinh thái & dẫn đầu ngách

- API mở + marketplace tích hợp (kết nối phần mềm bán hàng, CRM, ERP phổ biến tại VN).
- AI agent nâng cao: thao tác nghiệp vụ (tra đơn, đặt lịch, tạo ticket) chứ không chỉ trả lời.
- Cân nhắc mở rộng thị trường có văn hóa nhóm chat tương đồng (Thái Lan — LINE, Indonesia — WhatsApp) khi vị thế trong nước vững.

---

## 10. NỀN TẢNG CÔNG NGHỆ (TỔNG QUAN)

> Toàn bộ chi tiết kỹ thuật — kiến trúc hệ thống, công nghệ sử dụng, đường tích hợp API, cơ chế AI và bí quyết triển khai — được quản lý trong tài liệu riêng **`OMNICHAT_CONFIDENTIAL_TECH_APPENDIX.md` (mật, truy cập theo nguyên tắc need-to-know)**. Mục này chỉ trình bày ở mức cam kết năng lực để phục vụ đánh giá business.

### 10.1. Năng lực nền tảng đã sẵn sàng

- Backend đã được dựng khung theo kiến trúc hiện đại, module hóa, đa ngôn ngữ (vi/en), sẵn sàng mở rộng cho các module nghiệp vụ.
- Thiết kế đa khách hàng (multi-tenant) ngay từ đầu — nhiều doanh nghiệp vận hành an toàn trên cùng hạ tầng, có đường nâng cấp riêng cho khách Enterprise.
- Kiến trúc kết nối kênh dạng mô-đun: thêm kênh mới (Messenger, Telegram...) không ảnh hưởng kênh đang chạy — giá trị nền tảng không phụ thuộc một kênh duy nhất.
- AI được thiết kế theo hướng độc lập nhà cung cấp, tối ưu đồng thời chất lượng và chi phí.

### 10.2. Cam kết chất lượng dịch vụ (mức business)

- Bot phản hồi trong vài giây, hoạt động 24/7.
- Độ sẵn sàng nền tảng mục tiêu: 99,5% (MVP) → 99,9% (giai đoạn thương mại).
- Khả năng mở rộng phục vụ đồng thời hàng trăm đến hàng nghìn nhóm chat.
- Chi phí vận hành AI được kiểm soát để đảm bảo biên lợi nhuận gộp mục tiêu ≥ 75% (mục 13.2).

---

## 11. PHÁP LÝ & TUÂN THỦ

### 11.1. Tuân thủ nền tảng Zalo

- **Nguyên tắc bất di bất dịch**: sản phẩm thương mại chỉ dùng **đường tích hợp chính thức** — Zalo OA (gói Nâng cao/Premium, OA đã xác thực) + tính năng GMF, gọi qua OpenAPI được cấp quyền. Tuyệt đối không đưa vào sản phẩm thương mại các kỹ thuật automation tài khoản Zalo cá nhân (unofficial API) vì vi phạm điều khoản Zalo, rủi ro khóa tài khoản của khách và rủi ro pháp lý cho công ty.
- Tuân thủ chính sách nội dung tin nhắn của Zalo (định dạng tin Tư vấn trong nhóm), chống spam theo quy định GMF.
- Theo dõi sát lộ trình phí: tin OA gửi nhóm GMF miễn phí đến 31/12/2026 — thiết kế sẵn cơ chế đo đếm và báo cáo chi phí tin cho khách trước khi Zalo thu phí.

### 11.2. Bảo vệ dữ liệu cá nhân

- **Nghị định 13/2023/NĐ-CP** và **Luật Bảo vệ dữ liệu cá nhân (hiệu lực 01/01/2026)**: hội thoại chứa dữ liệu cá nhân (tên, SĐT, nhu cầu mua hàng...) — Omnichat xử lý dữ liệu với vai trò Bên xử lý dữ liệu theo ủy quyền của doanh nghiệp khách hàng (Bên kiểm soát).
- Yêu cầu triển khai: hợp đồng xử lý dữ liệu (DPA) với khách hàng; cơ chế xóa/ẩn danh dữ liệu theo yêu cầu; mã hóa dữ liệu nhạy cảm khi lưu; phân quyền truy cập tối thiểu; lưu trữ dữ liệu tại Việt Nam khi khách hàng/quy định yêu cầu.
- Chính sách AI minh bạch: doanh nghiệp nên công bố trong nhóm rằng có trợ lý ảo hỗ trợ (khuyến nghị đưa vào mẫu tin chào của bot).

### 11.3. Pháp nhân & sở hữu trí tuệ

- Thành lập pháp nhân (Công ty TNHH/CP) trước khi ký hợp đồng khách trả phí; đăng ký ngành nghề phần mềm/dịch vụ CNTT.
- Đăng ký nhãn hiệu "Omnichat" (lưu ý tra cứu trùng lặp — cân nhắc tên thương mại riêng biệt nếu có xung đột nhãn hiệu hiện hữu).
- Hợp đồng lao động/cộng tác có điều khoản chuyển giao IP; source code, tập tri thức và dữ liệu huấn luyện là tài sản công ty.

---

## 12. PHÂN TÍCH RỦI RO & PHƯƠNG ÁN GIẢM THIỂU

### 12.1. Ma trận rủi ro

| # | Rủi ro | Xác suất | Tác động | Giảm thiểu |
|---|---|:---:|:---:|---|
| R1 | **Phụ thuộc nền tảng Zalo** — thay đổi chính sách API/GMF, thu phí cao, giới hạn quyền | Trung bình | **Rất cao** | Chỉ dùng API chính thức; quan hệ đối tác với Zalo Cloud; kiến trúc connector đa kênh để giá trị không phụ thuộc 1 kênh; theo dõi chính sách hàng quý |
| R2 | Chuyển đổi từ môi trường POC sang môi trường sản xuất không giữ được đầy đủ tính năng | Trung bình | Cao | Ưu tiên số 1 của Giai đoạn 0: xác thực toàn bộ tính năng cần thiết trên đường tích hợp chính thức; có phương án dự phòng cho tính năng chưa được nền tảng hỗ trợ (chi tiết tại phụ lục kỹ thuật mật) |
| R3 | Đối thủ lớn (Pancake, Haravan, FPT.AI) copy tính năng | Cao | Trung bình | Chạy nhanh trong 12–24 tháng cửa sổ; xây moat = dữ liệu tri thức theo ngành + chi phí chuyển đổi (tri thức đã nạp, quy trình đã quen) + quan hệ khách hàng |
| R4 | Chất lượng AI không đạt — bot trả lời sai gây thiệt hại cho khách | Trung bình | Cao | Kiểm soát chất lượng AI nhiều tầng; chế độ duyệt trước; giới hạn phạm vi trả lời; bảo hiểm bằng escalate nhanh; đo lường tỷ lệ đúng liên tục |
| R5 | Chi phí LLM bào mòn biên lợi nhuận | Trung bình | Trung bình | Hạn mức theo gói + tính phí vượt; bộ kỹ thuật tối ưu chi phí AI (chi tiết tại phụ lục kỹ thuật mật); đàm phán giá volume |
| R6 | Bán chậm — SME Việt ngại trả phí SaaS | Trung bình | Cao | Giá vào cửa thấp (399k), dùng thử không thẻ, chứng minh ROI bằng con số trong 14 ngày; kênh đại lý địa phương |
| R7 | Rủi ro dữ liệu cá nhân / sự cố bảo mật | Thấp | Rất cao | Thực thi mục 11.2 từ MVP; pentest trước thương mại hóa; quy trình ứng cứu sự cố |
| R8 | Phụ thuộc founder (bus factor) | Cao | Cao | Tài liệu hóa (như tài liệu này + tài liệu kỹ thuật); tuyển sớm 1 kỹ sư core; code review + CI/CD chuẩn |
| R9 | Zalo tự làm tính năng bot nhóm native | Thấp–Trung bình | Cao | Giá trị Omnichat nằm ở lớp omnichannel + tri thức doanh nghiệp + quy trình agent, không chỉ "gửi tin vào nhóm"; nếu Zalo mở bot native thì Omnichat tích hợp lên trên |

### 12.2. Kịch bản ứng phó chiến lược

- **Kịch bản xấu nhất (Zalo siết nhóm)**: chuyển trọng tâm giá trị sang Unified Inbox đa kênh + AI tri thức (vẫn bán được độc lập); đẩy nhanh kênh Telegram/Messenger vốn có API nhóm/bot ổn định.
- **Kịch bản Zalo thu phí tin nhóm cao (sau 2026)**: bổ sung engine tối ưu (gộp tin, trả lời chọn lọc, điều hướng sang kênh rẻ); định vị lại như công cụ *tiết kiệm* chi phí tin nhắn.

---

## 13. KẾ HOẠCH TÀI CHÍNH & UNIT ECONOMICS

> Các con số dưới đây là mô hình giả định để lập kế hoạch, cần hiệu chỉnh bằng số liệu thực tế sau pilot.

### 13.1. Chi phí vận hành theo giai đoạn (VND/tháng)

| Khoản mục | Giai đoạn 0–1 (MVP) | Giai đoạn 2 (thương mại) | Giai đoạn 3 (mở rộng) |
|---|---:|---:|---:|
| Nhân sự (xem mục 14) | 30–60 triệu | 120–180 triệu | 300–500 triệu |
| Hạ tầng cloud + LLM | 5–10 triệu | 20–40 triệu | 80–150 triệu |
| Marketing & bán hàng | 5–10 triệu | 40–80 triệu | 150–300 triệu |
| Pháp lý, kế toán, văn phòng | 5 triệu | 15 triệu | 40 triệu |
| **Tổng burn/tháng** | **45–85 triệu** | **195–315 triệu** | **570–990 triệu** |

### 13.2. Unit economics mục tiêu (tại Giai đoạn 2)

| Chỉ số | Mục tiêu | Ghi chú |
|---|---|---|
| ARPU | 800.000đ/tháng (~9,6 triệu/năm) | Trọng tâm gói Growth |
| Gross margin | ≥ 75% | Sau chi phí hạ tầng + LLM |
| CAC (blended) | ≤ 4–5 triệu đồng | Founder-sales + content giai đoạn đầu |
| CAC payback | ≤ 6 tháng | |
| Churn tháng | ≤ 4% (năm 1) → ≤ 2,5% | SME churn tự nhiên cao, bù bằng annual plan |
| LTV (24 tháng lifetime) | ~19 triệu đồng | LTV/CAC ≈ 4x |

### 13.3. Kịch bản doanh thu (ARR)

| Kịch bản | Cuối năm 1 | Cuối năm 2 | Cuối năm 3 |
|---|---:|---:|---:|
| Thận trọng (80 → 300 → 800 khách) | 0,77 tỷ đ | 2,9 tỷ đ | 7,7 tỷ đ |
| Cơ sở (120 → 500 → 1.500 khách) | 1,15 tỷ đ | 4,8 tỷ đ | 14,4 tỷ đ |
| Tích cực (200 → 900 → 3.000 khách) | 1,9 tỷ đ | 8,6 tỷ đ | 28,8 tỷ đ |

(Giả định ARPU 9,6 triệu/năm, chưa tính expansion revenue và dịch vụ triển khai.)

### 13.4. Nhu cầu vốn & nguồn vốn

- **Bootstrap đến hết Giai đoạn 1** (~6–9 tháng burn ≈ 400–700 triệu đồng): vốn tự có/doanh thu dịch vụ, giữ 100% cổ phần khi định giá còn thấp.
- **Gọi vốn hạt giống tại Giai đoạn 2** (khi có 50–100 khách trả phí làm bằng chứng): mục tiêu 3–8 tỷ đồng (~150–350 nghìn USD) cho 10–15% cổ phần, dùng cho tuyển đội ngũ + marketing.
- Nguồn phù hợp: angel Việt Nam, các quỹ seed SEA (thường quan tâm SaaS ngách địa phương có moat nền tảng), chương trình hỗ trợ khởi nghiệp (NIC, các vườn ươm).

---

## 14. TỔ CHỨC ĐỘI NGŨ & VẬN HÀNH

### 14.1. Cơ cấu theo giai đoạn

**Giai đoạn 0–1 (đội hình tối thiểu, 2–4 người):**

- Founder — sản phẩm, kiến trúc, bán hàng pilot (kiêm nhiệm).
- 1 Fullstack/Backend engineer — connector kênh, inbox, hạ tầng.
- 1 AI engineer (có thể part-time/cộng tác) — engine AI, đánh giá chất lượng.
- (Tùy chọn) 1 CS/Operations part-time — onboarding pilot, thu thập phản hồi.

**Giai đoạn 2 (6–10 người):** +2 engineer, +1 product designer, +2 sales/CS, +1 content marketing.

**Giai đoạn 3 (15–25 người):** hình thành 3 khối — Product & Engineering / Growth (sales, marketing, đại lý) / Customer Success & Operations.

### 14.2. Nguyên tắc vận hành

- **Tài liệu là mặc định**: quyết định lớn ghi lại trong `refs/docs/`; quy tắc code theo `AI_CLEAN_CODE_RULES.md`; tận dụng AI coding agent để nhân năng suất đội nhỏ.
- **Nhịp vận hành**: weekly business review (số liệu phễu + churn + chất lượng bot); monthly roadmap review dựa trên dữ liệu sử dụng thật.
- **Customer Success là sản phẩm**: giai đoạn đầu, mọi khách churn phải có phỏng vấn exit; tỷ lệ bot tự giải quyết của từng khách là chỉ số sức khỏe tài khoản (health score).

---

## 15. HỆ THỐNG KPI & ĐO LƯỜNG

### 15.1. North Star Metric

> **Số câu hỏi khách hàng được bot tự giải quyết thành công mỗi tuần** — đại diện trực tiếp cho giá trị cốt lõi sản phẩm mang lại (thời gian nhân sự tiết kiệm được cho khách hàng).

### 15.2. Cây KPI theo tầng

**Sản phẩm & AI**

- Tỷ lệ bot tự giải quyết (deflection rate): mục tiêu ≥ 60% sau tinh chỉnh.
- Tỷ lệ trả lời đúng (đánh giá mẫu hàng tuần): ≥ 90%.
- Độ trễ trả lời p95: < 8 giây.
- Tỷ lệ escalate được nhân viên xử lý trong SLA: ≥ 95%.

**Tăng trưởng & Doanh thu**

- Số khách trả phí, MRR/ARR, tăng trưởng MRR tháng (mục tiêu 10–15%/tháng năm 1).
- Activation rate (kết nối OA + bot trả lời 50 câu đầu trong 7 ngày): ≥ 50%.
- Trial → paid: ≥ 25%; Churn tháng ≤ 4%; NRR ≥ 110% (từ năm 2).
- CAC, CAC payback, LTV/CAC ≥ 3x.

**Khách hàng**

- NPS ≥ 40; CSAT hội thoại (khảo sát trong nhóm) ≥ 4,2/5.
- Số nhóm Zalo hoạt động/khách hàng (chỉ số expansion tự nhiên).

**Vận hành & Kỹ thuật**

- Uptime ≥ 99,5%; tỷ lệ tin nhắn xử lý thành công ≥ 99,9%; chi phí AI/lượt trả lời trong ngưỡng mục tiêu (chi tiết tại phụ lục kỹ thuật mật).

### 15.3. Nhịp đánh giá

- **Hàng tuần**: phễu tăng trưởng + chất lượng bot (mẫu 50 hội thoại/tuần được người đánh giá).
- **Hàng tháng**: cohort retention, unit economics, health score từng khách.
- **Hàng quý**: đánh giá lại chiến lược kênh/ngành, rủi ro nền tảng (chính sách Zalo), lộ trình giá.

---

## 16. PHỤ LỤC: NGUỒN THAM KHẢO & THUẬT NGỮ

### 16.1. Nguồn số liệu chính

| Số liệu | Nguồn |
|---|---|
| Zalo 79,6 triệu MAU, 2,1 tỷ tin/ngày, 17.210 OA, 1.205 Mini App (Q4/2025) | Thông cáo báo chí VNG Q4/2025 (vng.com.vn) |
| Zalo 25.542 OA trả phí (Q3/2025); Trợ lý Công dân số AI | Thông cáo báo chí VNG Q3/2025 |
| Zalo dẫn đầu messaging VN: 81% penetration Q4/2025 (Facebook 65%, TikTok 21%); Top 9 messaging toàn cầu (Cloudflare Radar) | Decision Lab "The Connected Consumer", báo cáo tháng 2/2026 |
| Thị trường chatbot VN: 37 triệu USD (2025) → 213,3 triệu USD (2034), CAGR 21,5% | IMARC Group — Vietnam Chatbot Market |
| Thị trường Conversational AI VN: 64,3 triệu USD (2025) → 268,8 triệu USD (2034) | IMARC Group — Vietnam Conversational AI Market |
| Tính năng nhóm chat GMF: điều kiện OA Nâng cao/Premium, hỗ trợ quản lý và nhắn tin nhóm qua API chính thức | Zalo Platform Document Hub (docs.zaloplatforms.com) |
| Bảng giá OA từ 01/01/2026: OA Nâng cao ~1,068 triệu đ/năm; GMF 25k–300k đ/gói/tháng; **tin OA gửi nhóm GMF miễn phí đến 31/12/2026** | Bảng giá dịch vụ Zalo OA 01/2026 (content.zalo.cloud) |

### 16.2. Thuật ngữ

| Thuật ngữ | Giải nghĩa |
|---|---|
| **OA (Official Account)** | Tài khoản chính thức của doanh nghiệp trên Zalo |
| **GMF (Group Management Function)** | Tính năng quản lý nhóm của Zalo OA — nền tảng kỹ thuật cho chatbot trong nhóm |
| **RAG** | Retrieval-Augmented Generation — kỹ thuật cho LLM trả lời dựa trên tri thức doanh nghiệp được truy hồi |
| **Deflection rate** | Tỷ lệ câu hỏi bot tự giải quyết không cần con người |
| **Unified Inbox** | Hộp thư hợp nhất — quản lý hội thoại từ mọi kênh trên một giao diện |
| **ARR / MRR** | Doanh thu định kỳ năm / tháng |
| **NRR** | Net Revenue Retention — doanh thu giữ lại ròng từ tập khách hiện hữu (gồm upsell, trừ churn) |
| **CAC / LTV** | Chi phí thu hút 1 khách hàng / Giá trị vòng đời 1 khách hàng |
| **ICP** | Ideal Customer Profile — chân dung khách hàng lý tưởng |
| **Beachhead** | Thị trường ngách "bàn đạp" để chiếm lĩnh trước khi mở rộng |

### 16.3. Tài liệu liên quan trong repo

- **`refs/docs/business/OMNICHAT_CONFIDENTIAL_TECH_APPENDIX.md`** — phụ lục kỹ thuật & bí mật triển khai (**MẬT** — chỉ nhóm sáng lập/kỹ sư core, cấp quyền theo need-to-know sau NDA; không đính kèm khi chia sẻ tài liệu này).
- `refs/docs/AI_CLEAN_CODE_RULES.md` — quy tắc phát triển codebase.
- `refs/docs/AUDIT_BASE_SETUP.md` — hiện trạng nền tảng kỹ thuật.
- (Sẽ bổ sung) `refs/docs/business/` — nghiên cứu ngành theo beachhead, playbook bán hàng, tài liệu gọi vốn (pitch deck) trích xuất từ tài liệu này.

---

*Tài liệu này là "nguồn sự thật" (single source of truth) về business của dự án Omnichat. Mọi thay đổi chiến lược quan trọng cần được cập nhật vào đây kèm ngày và lý do thay đổi.*

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0 | 09/2026 | Khởi tạo tài liệu tổng thể sau khi POC chatbot nhóm Zalo thành công |
| 1.1 | 09/2026 | Tách toàn bộ chi tiết kỹ thuật & bí mật triển khai sang phụ lục mật `OMNICHAT_CONFIDENTIAL_TECH_APPENDIX.md` để tài liệu này có thể chia sẻ rộng |
