# DỰ ÁN AI CHO ALOBO — TÀI LIỆU KẾ HOẠCH & PHƯƠNG HƯỚNG TRIỂN KHAI

> **Tên dự án:** Tích hợp AI Chatbot vào hệ sinh thái ALOBO (ALOBO AI Assistant)
>
> **Phiên bản tài liệu:** 1.0
>
> **Trạng thái:** Đề xuất — chờ phê duyệt
>
> **Phạm vi kênh:** Zalo (OA / nhóm chat) và ALOBO Chat

---

## MỤC LỤC

1. [Tóm tắt điều hành (Executive Summary)](#1-tóm-tắt-điều-hành-executive-summary)
2. [Bối cảnh & Cơ hội](#2-bối-cảnh--cơ-hội)
3. [Kết quả thử nghiệm (Proof of Concept)](#3-kết-quả-thử-nghiệm-proof-of-concept)
4. [Mục tiêu & Phạm vi dự án](#4-mục-tiêu--phạm-vi-dự-án)
5. [Đối tượng người dùng & Use case CSKH](#5-đối-tượng-người-dùng--use-case-cskh)
6. [Kiến trúc giải pháp tổng thể](#6-kiến-trúc-giải-pháp-tổng-thể)
7. [Lựa chọn công nghệ](#7-lựa-chọn-công-nghệ)
8. [Thiết kế luồng nghiệp vụ chi tiết](#8-thiết-kế-luồng-nghiệp-vụ-chi-tiết)
9. [Lộ trình triển khai theo phase](#9-lộ-trình-triển-khai-theo-phase)
10. [KPI & Phương pháp đo lường](#10-kpi--phương-pháp-đo-lường)
11. [Quản trị rủi ro](#11-quản-trị-rủi-ro)
12. [Bảo mật, quyền riêng tư & tuân thủ pháp lý](#12-bảo-mật-quyền-riêng-tư--tuân-thủ-pháp-lý)
13. [Tổ chức đội ngũ & nguồn lực](#13-tổ-chức-đội-ngũ--nguồn-lực)
14. [Ước tính chi phí vận hành](#14-ước-tính-chi-phí-vận-hành)
15. [Phụ lục](#15-phụ-lục)

---

## 1. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

Trong bối cảnh chuyển đổi số và sự bùng nổ của AI tạo sinh (Generative AI), việc tích hợp **chatbot AI** vào hệ sinh thái ALOBO là bước đi chiến lược nhằm:

- **Nâng cao chất lượng chăm sóc khách hàng (CSKH)** trên hai kênh chủ lực: **Zalo** và **ALOBO Chat** (nền tảng nhắn tin riêng của ALOBO, tương tự Zalo).
- **Giảm tải cho đội ngũ CSKH** trước lượng khách hàng lớn và ngày càng tăng: chatbot xử lý các câu hỏi lặp lại, thường gặp (ước tính chiếm 60–80% tổng lượng hội thoại CSKH theo mặt bằng chung của ngành).
- **Phục vụ khách hàng 24/7**, không giới hạn giờ hành chính, không phụ thuộc số lượng nhân sự trực.
- **Chuẩn hóa và tích lũy tri thức doanh nghiệp** thành một knowledge base tập trung, dùng chung cho cả bot và nhân viên.

**Điểm mấu chốt:** Chúng tôi đã **thử nghiệm thành công (PoC)** việc tích hợp chatbot AI vào **nhóm chat Zalo** để trò chuyện tự động với người dùng thật. Kết quả xác nhận tính **khả thi về kỹ thuật** — bot nhận tin nhắn, hiểu ngữ cảnh, phản hồi tự nhiên bằng tiếng Việt theo thời gian thực. Trên cơ sở đó, tài liệu này đề xuất **triển khai chính thức ở Phase 1** trên nền tảng backend CSKH đa kênh hiện có của hệ thống, sau đó mở rộng dần theo lộ trình 4 phase.

**Đề xuất phê duyệt:**

| Hạng mục | Đề xuất |
|---|---|
| Phạm vi Phase 1 | Chatbot AI trả lời tự động trên Zalo OA + ALOBO Chat, có cơ chế chuyển tiếp cho nhân viên (human handoff) |
| Nền tảng triển khai | Backend CSKH đa kênh (omnichannel) hiện có của hệ thống |
| Mô hình AI | LLM thương mại qua API (khuyến nghị bắt đầu, chi tiết tại mục 7) |
| Tiêu chí thành công Phase 1 | ≥ 50% hội thoại được bot xử lý trọn vẹn; CSAT bot ≥ 4/5; thời gian phản hồi < 5 giây |

---

## 2. BỐI CẢNH & CƠ HỘI

### 2.1. Bối cảnh thị trường

- **AI tạo sinh đã trưởng thành:** Các mô hình ngôn ngữ lớn (LLM) hiện xử lý tiếng Việt tốt, chi phí API giảm mạnh qua từng năm, đủ rẻ để áp dụng đại trà cho CSKH.
- **Kỳ vọng của khách hàng thay đổi:** Người dùng quen với trải nghiệm hỏi–đáp tức thì (ChatGPT, trợ lý ảo ngân hàng, chatbot sàn TMĐT). Chờ đợi nhân viên trả lời qua nhiều giờ không còn được chấp nhận.
- **Zalo là kênh giao tiếp số 1 Việt Nam:** Phần lớn khách hàng Việt hiện diện trên Zalo; CSKH qua Zalo OA / nhóm Zalo là kênh bắt buộc phải làm tốt.

### 2.2. Bối cảnh nội tại ALOBO

- ALOBO đã sở hữu **ALOBO Chat** — nền tảng nhắn tin riêng tương tự Zalo — nghĩa là ALOBO **làm chủ hoàn toàn một kênh chat**: chủ động về API, dữ liệu, trải nghiệm, không phụ thuộc chính sách bên thứ ba.
- Lượng khách hàng lớn và tăng trưởng nhanh khiến mô hình CSKH thuần nhân sự **không thể scale tuyến tính**: thêm khách là phải thêm người, chi phí tăng theo, chất lượng không đồng đều giữa các ca trực.
- Hệ thống backend CSKH **đa kênh (omnichannel)** đã có sẵn — đây là điểm tựa hạ tầng quan trọng: tin nhắn từ nhiều kênh đã được quy về một nơi xử lý tập trung, chỉ cần "cắm" thêm lớp AI vào pipeline xử lý tin nhắn.

### 2.3. Cơ hội

| Cơ hội | Mô tả |
|---|---|
| Tự động hóa CSKH | Bot xử lý câu hỏi thường gặp (giá, chính sách, hướng dẫn sử dụng, tra cứu...) — giải phóng nhân viên cho các case khó |
| Phục vụ 24/7 | Khách nhắn lúc 2h sáng vẫn được trả lời ngay |
| Đồng nhất trải nghiệm đa kênh | Cùng một "bộ não AI" phục vụ cả Zalo lẫn ALOBO Chat — khách chuyển kênh vẫn nhận chất lượng như nhau |
| Khai thác dữ liệu hội thoại | Toàn bộ hội thoại bot–khách là nguồn dữ liệu quý để phân tích nhu cầu, cải thiện sản phẩm |
| Lợi thế cạnh tranh cho ALOBO Chat | ALOBO Chat có trợ lý AI tích hợp sẵn là điểm khác biệt so với các nền tảng chat thông thường |

---

## 3. KẾT QUẢ THỬ NGHIỆM (PROOF OF CONCEPT)

### 3.1. Mô tả thử nghiệm

Đội dự án đã tiến hành thử nghiệm tích hợp một chatbot AI vào **nhóm chat Zalo thực tế** để bot trực tiếp trò chuyện với các thành viên trong nhóm.

### 3.2. Kết quả đạt được

✅ **Thử nghiệm THÀNH CÔNG — giải pháp được xác nhận KHẢ THI về mặt kỹ thuật.** Cụ thể:

1. **Kết nối kênh Zalo thành công:** Bot nhận được tin nhắn từ nhóm Zalo và gửi phản hồi trở lại nhóm theo thời gian thực, hoạt động ổn định trong suốt quá trình thử nghiệm.
2. **Chất lượng hội thoại đạt yêu cầu:** Bot hiểu câu hỏi tiếng Việt tự nhiên (kể cả viết tắt, không dấu), trả lời mạch lạc, giữ được ngữ cảnh hội thoại qua nhiều lượt trao đổi.
3. **Độ trễ chấp nhận được:** Thời gian từ lúc khách nhắn đến lúc bot phản hồi nằm trong ngưỡng trải nghiệm chat thông thường (vài giây).
4. **Vận hành tự động hoàn toàn:** Trong phạm vi thử nghiệm, bot tự trò chuyện mà không cần con người can thiệp vào từng câu trả lời.

### 3.3. Bài học rút ra từ thử nghiệm

| Bài học | Hàm ý cho triển khai chính thức |
|---|---|
| Kênh Zalo tích hợp được với chatbot AI | Rủi ro kỹ thuật lớn nhất (kết nối kênh) đã được loại bỏ |
| LLM xử lý tiếng Việt hội thoại tốt | Không cần tự huấn luyện mô hình riêng ở giai đoạn đầu |
| Bot cần "biết" kiến thức doanh nghiệp mới trả lời đúng nghiệp vụ | Phải xây knowledge base + RAG (mục 6, 7) để bot trả lời chính xác về sản phẩm/chính sách của ALOBO |
| Cần kiểm soát khi bot không chắc chắn | Bắt buộc thiết kế cơ chế chuyển tiếp cho nhân viên (human handoff) ngay từ Phase 1 |
| Cần giới hạn phạm vi trả lời | Phải có guardrails: bot chỉ trả lời trong phạm vi CSKH, từ chối nội dung ngoài lề/nhạy cảm |

### 3.4. Kết luận từ PoC

Thử nghiệm chứng minh **con đường kỹ thuật đã thông**. Việc còn lại của dự án là bài toán **sản phẩm hóa**: đưa chatbot từ môi trường thử nghiệm vào hạ tầng chính thức, bổ sung tri thức doanh nghiệp, cơ chế giám sát, đo lường và vận hành ở quy mô lớn. Đây chính là nội dung của lộ trình triển khai tại mục 9, trong đó **Phase 1 được đề xuất triển khai ngay trên nền tảng backend CSKH đa kênh hiện có**.

---

## 4. MỤC TIÊU & PHẠM VI DỰ ÁN

### 4.1. Mục tiêu tổng thể (Objectives)

1. **O1 — Tự động hóa CSKH:** Bot xử lý trọn vẹn tối thiểu 50% hội thoại CSKH ở Phase 1, hướng tới 70%+ ở các phase sau.
2. **O2 — Phủ đa kênh:** Một trợ lý AI duy nhất phục vụ đồng thời Zalo và ALOBO Chat với trải nghiệm đồng nhất.
3. **O3 — Không đánh đổi chất lượng:** Điểm hài lòng (CSAT) với hội thoại có bot tham gia không thấp hơn hội thoại thuần nhân viên.
4. **O4 — Nền tảng mở rộng:** Kiến trúc cho phép bổ sung kênh mới, mô hình AI mới, nghiệp vụ mới mà không phải làm lại.

### 4.2. Phạm vi (Scope)

**Trong phạm vi (In-scope):**

- Chatbot AI trả lời tự động tin nhắn văn bản trên Zalo (OA, nhóm) và ALOBO Chat.
- Cơ chế human handoff: chuyển hội thoại cho nhân viên khi bot không xử lý được hoặc khách yêu cầu.
- Knowledge base tri thức doanh nghiệp + pipeline RAG.
- Trang quản trị: cấu hình bot, xem hội thoại, thống kê, quản lý knowledge base.
- Đo lường, giám sát chất lượng và chi phí AI.

**Ngoài phạm vi giai đoạn đầu (Out-of-scope, xem xét ở phase sau):**

- Xử lý giọng nói (voice bot), gọi thoại.
- Xử lý hình ảnh/video do khách gửi (chỉ ghi nhận và chuyển nhân viên).
- Bot chủ động bán hàng/marketing outbound (chỉ làm sau khi CSKH ổn định).
- Tự huấn luyện (fine-tune/self-host) mô hình riêng.

### 4.3. Ngoài mục tiêu (Non-goals)

- **Không thay thế hoàn toàn nhân viên CSKH.** Mô hình đúng là *bot xử lý số lượng, người xử lý chất lượng* — bot lo câu hỏi phổ thông, nhân viên lo case phức tạp và khách VIP.
- Không xây dựng mô hình AI nền tảng (foundation model) riêng.

---

## 5. ĐỐI TƯỢNG NGƯỜI DÙNG & USE CASE CSKH

### 5.1. Đối tượng người dùng

| Nhóm | Mô tả | Nhu cầu chính |
|---|---|---|
| **Khách hàng cuối** | Người dùng ALOBO nhắn tin qua Zalo hoặc ALOBO Chat | Được trả lời nhanh, đúng, mọi lúc |
| **Nhân viên CSKH (Agent)** | Người tiếp nhận hội thoại được bot chuyển tiếp | Nhận đủ ngữ cảnh hội thoại trước đó; được AI gợi ý câu trả lời |
| **Trưởng nhóm CSKH (Supervisor)** | Giám sát chất lượng | Dashboard, cảnh báo, đánh giá hội thoại bot |
| **Quản trị viên (Admin)** | Vận hành hệ thống bot | Cấu hình bot, quản lý knowledge base, phân quyền |

### 5.2. Use case CSKH ưu tiên cho chatbot (Phase 1)

| # | Use case | Ví dụ | Cách bot xử lý |
|---|---|---|---|
| UC1 | Câu hỏi thường gặp (FAQ) | "Phí dịch vụ là bao nhiêu?", "Cách đăng ký tài khoản?" | Trả lời từ knowledge base (RAG) |
| UC2 | Hướng dẫn sử dụng | "Làm sao đổi mật khẩu?", "Sao tôi không đăng nhập được?" | Trả lời theo tài liệu hướng dẫn, kèm bước thao tác |
| UC3 | Tra cứu chính sách | "Chính sách hoàn tiền thế nào?" | Trích dẫn đúng chính sách hiện hành |
| UC4 | Tiếp nhận & phân loại yêu cầu | Khách khiếu nại, báo lỗi | Bot thu thập thông tin ban đầu (mô tả, ảnh chụp...), tạo ticket, chuyển nhân viên |
| UC5 | Chào hỏi & điều hướng | Khách nhắn lần đầu | Chào tự động, giới thiệu khả năng hỗ trợ, gợi ý câu hỏi |
| UC6 | Chuyển tiếp cho nhân viên | "Cho tôi gặp nhân viên" | Chuyển hội thoại kèm toàn bộ ngữ cảnh, thông báo thời gian chờ dự kiến |

### 5.3. Use case mở rộng (phase sau)

- Tra cứu thông tin cá nhân hóa (trạng thái đơn hàng/yêu cầu của chính khách đó) — cần định danh và phân quyền dữ liệu chặt chẽ.
- Agent Assist: AI gợi ý câu trả lời cho nhân viên ngay trong màn hình làm việc.
- Tóm tắt hội thoại tự động khi handoff và khi đóng ticket.
- Phân tích cảm xúc (sentiment) để cảnh báo sớm khách đang bức xúc.
- Bot chủ động (proactive): nhắc lịch, thông báo trạng thái yêu cầu.

---

## 6. KIẾN TRÚC GIẢI PHÁP TỔNG THỂ

### 6.1. Nguyên tắc kiến trúc

1. **Channel-agnostic (độc lập kênh):** Lõi AI không biết tin nhắn đến từ Zalo hay ALOBO Chat. Mỗi kênh chỉ là một adapter chuẩn hóa tin nhắn vào/ra. Thêm kênh mới = thêm adapter, không sửa lõi.
2. **Model-agnostic (độc lập mô hình):** Tầng gọi LLM đặt sau một lớp trừu tượng (AI Gateway) để có thể thay đổi nhà cung cấp mô hình mà không ảnh hưởng nghiệp vụ.
3. **Human-in-the-loop:** Mọi luồng đều có đường thoát sang nhân viên. Bot không bao giờ là điểm kết thúc bắt buộc.
4. **Tri thức tách khỏi mô hình:** Kiến thức doanh nghiệp nằm trong knowledge base (cập nhật hằng ngày được), không "nhồi" vào mô hình.
5. **Đo lường được từ ngày đầu:** Mọi hội thoại, mọi lần gọi AI đều được log kèm chi phí token, độ trễ, kết quả.

### 6.2. Sơ đồ kiến trúc logic

```text
┌─────────────────────────────  KÊNH GIAO TIẾP  ─────────────────────────────┐
│                                                                            │
│   ┌──────────────┐        ┌──────────────┐        ┌────────────────────┐   │
│   │  Zalo OA /   │        │  ALOBO Chat  │        │  (Kênh tương lai:  │   │
│   │  Nhóm Zalo   │        │  (in-app)    │        │  web, app khác...) │   │
│   └──────┬───────┘        └──────┬───────┘        └─────────┬──────────┘   │
└──────────┼───────────────────────┼──────────────────────────┼──────────────┘
           │  webhook              │  API/socket nội bộ       │
           ▼                       ▼                          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    TẦNG TÍCH HỢP KÊNH (Channel Adapters)                   │
│        Chuẩn hóa tin nhắn vào/ra về một định dạng hội thoại chung          │
└──────────────────────────────────┬─────────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 LÕI HỘI THOẠI ĐA KÊNH (Conversation Core)                  │
│   • Quản lý hội thoại/phiên (session), định danh khách hàng theo kênh      │
│   • Định tuyến: BOT xử lý ⟷ NHÂN VIÊN xử lý (routing & handoff)            │
│   • Hàng đợi tin nhắn (message queue) đảm bảo không mất tin                │
└───────────────┬───────────────────────────────────────┬────────────────────┘
                ▼                                       ▼
┌───────────────────────────────┐        ┌───────────────────────────────────┐
│     AI ORCHESTRATOR (Bot)     │        │       WORKSPACE NHÂN VIÊN         │
│  • Quản lý ngữ cảnh hội thoại │        │  • Nhận hội thoại được chuyển     │
│  • Phân loại ý định (intent)  │        │    tiếp kèm ngữ cảnh + tóm tắt    │
│  • Truy xuất tri thức (RAG)   │        │  • (Phase sau) AI gợi ý trả lời   │
│  • Sinh câu trả lời qua LLM   │        └───────────────────────────────────┘
│  • Guardrails + quyết định    │
│    trả lời hay chuyển người   │
└───────┬───────────┬───────────┘
        ▼           ▼
┌──────────────┐ ┌─────────────────────────────────────────┐
│  AI GATEWAY  │ │        KNOWLEDGE BASE + RAG             │
│ (LLM API,    │ │  • Tài liệu sản phẩm, FAQ, chính sách   │
│  đổi được    │ │  • Vector database (tìm kiếm ngữ nghĩa) │
│  nhà cung    │ │  • Pipeline nạp/cập nhật tài liệu       │
│  cấp)        │ └─────────────────────────────────────────┘
└──────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│              QUAN SÁT & QUẢN TRỊ (Observability & Admin)                   │
│  • Log hội thoại, token, chi phí, độ trễ   • Dashboard chất lượng & KPI    │
│  • Quản lý knowledge base                  • Cấu hình bot, phân quyền      │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.3. Thành phần chính

| Thành phần | Vai trò | Ghi chú triển khai |
|---|---|---|
| **Channel Adapter — Zalo** | Nhận webhook tin nhắn Zalo, gửi trả lời qua Zalo API | Đã được kiểm chứng khả thi qua PoC |
| **Channel Adapter — ALOBO Chat** | Kết nối trực tiếp với hạ tầng chat nội bộ | Lợi thế: làm chủ API, không giới hạn bên thứ ba |
| **Conversation Core** | Quản lý phiên hội thoại, trạng thái (bot đang xử lý / đã chuyển người), hàng đợi tin nhắn | Tận dụng backend CSKH đa kênh hiện có |
| **AI Orchestrator** | Bộ não điều phối: nhận tin → phân loại → truy xuất tri thức → gọi LLM → hậu kiểm → trả lời hoặc chuyển người | Thành phần mới, trọng tâm của Phase 1 |
| **AI Gateway** | Lớp trừu tượng gọi LLM: quản lý API key, retry, timeout, fallback giữa các mô hình, đếm token/chi phí | Bắt buộc có để không bị khóa chặt vào một nhà cung cấp |
| **Knowledge Base + RAG** | Kho tri thức + tìm kiếm ngữ nghĩa để bot trả lời đúng nghiệp vụ ALOBO | Phase 1 có thể bắt đầu với FAQ có cấu trúc, Phase 2 mở rộng RAG đầy đủ |
| **Admin & Dashboard** | Cấu hình bot, duyệt nội dung knowledge base, xem thống kê | Phát triển tăng dần theo phase |

### 6.4. Quản lý ngữ cảnh hội thoại (Conversation Memory)

- **Ngắn hạn:** Lưu N lượt trao đổi gần nhất của phiên (trong Redis/cache) để đưa vào ngữ cảnh mỗi lần gọi LLM — bot "nhớ" khách vừa nói gì.
- **Tóm tắt phiên:** Khi hội thoại dài vượt ngưỡng token, tự động tóm tắt phần cũ để giữ chi phí ổn định.
- **Dài hạn (phase sau):** Hồ sơ khách hàng hợp nhất đa kênh (khách A trên Zalo và trên ALOBO Chat là một người) để cá nhân hóa.

---

## 7. LỰA CHỌN CÔNG NGHỆ

### 7.1. Mô hình ngôn ngữ (LLM)

**Khuyến nghị: bắt đầu bằng LLM thương mại qua API**, vì: không cần đầu tư hạ tầng GPU, chất lượng tiếng Việt tốt nhất hiện có, tốc độ triển khai nhanh, trả tiền theo mức dùng.

| Phương án | Ưu điểm | Nhược điểm | Khuyến nghị |
|---|---|---|---|
| **LLM thương mại qua API** (OpenAI GPT, Anthropic Claude, Google Gemini) | Chất lượng cao nhất, tiếng Việt tốt, không lo hạ tầng, có tier giá rẻ cho tác vụ đơn giản | Chi phí theo token; dữ liệu đi qua bên thứ ba (cần ký DPA, chọn chế độ không dùng dữ liệu để huấn luyện) | ✅ **Phase 1–2** |
| **LLM mã nguồn mở self-host** (Llama, Qwen, Gemma...) | Dữ liệu không rời hạ tầng; chi phí biên thấp khi volume rất lớn | Cần GPU + đội MLOps; chất lượng tiếng Việt phải kiểm chứng; tổng chi phí sở hữu cao ở quy mô nhỏ | ⏳ Đánh giá lại ở Phase 3–4 khi volume đủ lớn |
| **Fine-tune mô hình riêng** | Tối ưu sâu cho domain | Đắt, chậm, knowledge base + RAG đã giải quyết 90% nhu cầu | ❌ Chưa cần |

**Chiến lược đa mô hình (model routing):** dùng mô hình nhỏ/rẻ cho tác vụ đơn giản (phân loại ý định, chào hỏi, tóm tắt) và mô hình lớn cho câu trả lời nghiệp vụ phức tạp — giảm đáng kể chi phí mà không giảm chất lượng cảm nhận.

### 7.2. RAG & Vector Database

| Hạng mục | Lựa chọn đề xuất | Lý do |
|---|---|---|
| Kiến trúc truy xuất tri thức | **RAG (Retrieval-Augmented Generation)** | Bot trả lời dựa trên tài liệu thật của ALOBO → giảm bịa đặt (hallucination), cập nhật tri thức không cần đụng mô hình |
| Vector database | **pgvector (PostgreSQL extension)** cho giai đoạn đầu | Tận dụng hạ tầng PostgreSQL sẵn có, vận hành đơn giản; chuyển sang vector DB chuyên dụng (Qdrant/Milvus) nếu volume tăng mạnh |
| Embedding model | Embedding API đa ngôn ngữ hỗ trợ tốt tiếng Việt (theo nhà cung cấp LLM đã chọn) | Đồng bộ hệ sinh thái, giảm số nhà cung cấp |
| Pipeline nạp tài liệu | Chunking theo ngữ nghĩa + metadata (nguồn, ngày hiệu lực, phiên bản) | Truy vết được câu trả lời của bot đến đúng tài liệu gốc |

### 7.3. Hạ tầng & tích hợp

| Hạng mục | Đề xuất |
|---|---|
| Nền tảng backend | Tận dụng backend CSKH đa kênh hiện có (Node.js/NestJS, kiến trúc module) — bổ sung module AI, không xây hệ thống mới từ đầu |
| Hàng đợi tin nhắn | Message queue/pub-sub hiện có của hệ thống — đảm bảo tin nhắn không mất khi AI chậm hoặc lỗi |
| Cache & session | Redis — lưu ngữ cảnh hội thoại ngắn hạn, rate limiting |
| Tích hợp Zalo | Zalo Official Account API + webhook (đã kiểm chứng qua PoC) |
| Tích hợp ALOBO Chat | API/event nội bộ của nền tảng chat — bot tham gia như một "thành viên hệ thống" trong hội thoại |
| Giám sát | Log tập trung + dashboard: độ trễ, tỉ lệ lỗi, token/chi phí theo ngày, tỉ lệ handoff |

### 7.4. Tiêu chí lựa chọn nhà cung cấp LLM (đánh giá trong Phase 1)

1. Chất lượng tiếng Việt trên bộ câu hỏi thử nghiệm thực tế của ALOBO (blind test có chấm điểm).
2. Chi phí trên 1.000 hội thoại chuẩn.
3. Độ trễ p95 < 3 giây cho một lượt trả lời.
4. Cam kết dữ liệu: không dùng dữ liệu khách hàng để huấn luyện, có DPA.
5. Độ ổn định API (SLA, lịch sử sự cố).

---

## 8. THIẾT KẾ LUỒNG NGHIỆP VỤ CHI TIẾT

### 8.1. Luồng chính: Bot-first với human handoff

```text
Khách nhắn tin (Zalo / ALOBO Chat)
        │
        ▼
[1] Adapter kênh chuẩn hóa tin nhắn → đưa vào hàng đợi
        │
        ▼
[2] Conversation Core kiểm tra trạng thái hội thoại
        │
        ├── Hội thoại đang do NHÂN VIÊN phụ trách → chuyển thẳng cho nhân viên (bot im lặng)
        │
        └── Hội thoại ở chế độ BOT
                │
                ▼
[3] AI Orchestrator xử lý:
    a. Tiền kiểm (guardrails đầu vào): lọc spam, nội dung độc hại
    b. Phân loại ý định (intent):
         • FAQ/hướng dẫn/chính sách  → bước 4
         • Yêu cầu gặp nhân viên     → bước 6 (handoff)
         • Khiếu nại/vấn đề nhạy cảm → bước 6 (handoff, ưu tiên cao)
         • Ngoài phạm vi hỗ trợ      → từ chối lịch sự + gợi ý phạm vi hỗ trợ
    c. Truy xuất tri thức liên quan từ knowledge base (RAG)
        │
        ▼
[4] Gọi LLM sinh câu trả lời (kèm ngữ cảnh hội thoại + tri thức truy xuất)
        │
        ▼
[5] Hậu kiểm (guardrails đầu ra):
    • Điểm tin cậy đủ cao? Có nguồn tri thức đối chiếu?
    • Không lộ thông tin nhạy cảm, không hứa hẹn vượt chính sách?
        ├── ĐẠT     → gửi trả lời cho khách (ghi rõ đây là trợ lý AI)
        └── KHÔNG ĐẠT → bước 6 (handoff)
        │
        ▼
[6] HANDOFF (khi cần):
    • Tóm tắt hội thoại + thông tin đã thu thập → gắn vào ticket
    • Đưa vào hàng đợi nhân viên theo mức ưu tiên
    • Thông báo khách: "Mình đã chuyển bạn tới nhân viên hỗ trợ..."
    • Ngoài giờ làm việc: hẹn thời gian phản hồi + tạo ticket chờ
```

### 8.2. Quy tắc handoff (chuyển tiếp cho nhân viên)

Bot **bắt buộc** chuyển cho nhân viên khi gặp một trong các điều kiện:

1. Khách yêu cầu trực tiếp ("gặp nhân viên", "gọi người thật"...).
2. Bot không đủ tin cậy sau **2 lần liên tiếp** không trả lời được cùng một vấn đề.
3. Phát hiện ý định thuộc danh sách nhạy cảm: khiếu nại gay gắt, tranh chấp tài chính, vấn đề pháp lý, dữ liệu cá nhân.
4. Phát hiện cảm xúc tiêu cực mạnh (khách bức xúc).
5. Yêu cầu nằm ngoài danh sách nghiệp vụ bot được phép xử lý.

**Nguyên tắc trải nghiệm khi handoff:** khách không phải kể lại từ đầu — nhân viên nhận đủ lịch sử + bản tóm tắt của bot.

### 8.3. Guardrails (hàng rào an toàn)

| Lớp | Biện pháp |
|---|---|
| Đầu vào | Lọc spam/flood (rate limit theo người dùng), chặn prompt injection cơ bản |
| System prompt | Giới hạn vai trò: "chỉ là trợ lý CSKH của ALOBO", cấm tư vấn ngoài phạm vi, cấm hứa hẹn ưu đãi/chính sách không có trong tri thức |
| Đầu ra | Kiểm tra câu trả lời phải bám nguồn tri thức; lọc PII không được phép tiết lộ; độ dài và tông giọng chuẩn thương hiệu |
| Vận hành | Ngưỡng chi tiêu API theo ngày + cảnh báo; nút "tắt bot khẩn cấp" theo kênh |
| Minh bạch | Luôn cho khách biết đang trò chuyện với trợ lý AI và luôn có lối thoát sang nhân viên |

### 8.4. Trải nghiệm trong nhóm chat (group)

Khác với chat 1-1, trong **nhóm Zalo / nhóm ALOBO Chat** bot cần quy tắc riêng (đúc kết từ PoC):

- Chỉ phản hồi khi được **gọi đích danh** (mention/tag bot hoặc từ khóa kích hoạt) hoặc khi tin nhắn rõ ràng là câu hỏi hỗ trợ — tránh bot "nói leo" gây phiền.
- Chống lặp: không trả lời lại cùng một câu hỏi đã trả lời trong khoảng thời gian ngắn.
- Trong nhóm đông, ưu tiên trả lời ngắn gọn + mời khách nhắn riêng 1-1 cho vấn đề cá nhân (bảo vệ quyền riêng tư).

---

## 9. LỘ TRÌNH TRIỂN KHAI THEO PHASE

> Tổng quan: 4 phase, mỗi phase có mục tiêu, phạm vi và tiêu chí nghiệm thu (exit criteria) riêng. Chỉ chuyển phase khi đạt tiêu chí nghiệm thu phase trước.

### PHASE 0 — Chuẩn bị (tiền đề, chạy song song trước Phase 1)

| Hạng mục | Nội dung |
|---|---|
| Mục tiêu | Sẵn sàng dữ liệu, pháp lý, nhân sự trước khi code Phase 1 |
| Công việc chính | • Chọn nhà cung cấp LLM theo tiêu chí mục 7.4 (blind test tiếng Việt)<br>• Thu thập & chuẩn hóa bộ tri thức ban đầu: FAQ, chính sách, hướng dẫn sử dụng (mục tiêu ≥ 100 mục FAQ chất lượng)<br>• Rà soát pháp lý: DPA với nhà cung cấp AI, đối chiếu Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân<br>• Thiết kế tông giọng (persona) của bot: tên gọi, cách xưng hô, mức độ trang trọng |
| Nghiệm thu | Nhà cung cấp LLM được chốt; knowledge base v1 được nghiệp vụ duyệt; persona bot được duyệt |

### PHASE 1 — Chatbot CSKH chính thức trên Zalo + ALOBO Chat ⭐ (đề xuất triển khai ngay)

Đây là phase **được đề xuất phê duyệt để triển khai ngay**, dựa trên kết quả PoC thành công. Phase 1 được xây dựng trên **nền tảng backend CSKH đa kênh hiện có** — tận dụng toàn bộ hạ tầng quản lý hội thoại, hàng đợi tin nhắn và kết nối kênh sẵn có, chỉ bổ sung các module AI mới.

| Hạng mục | Nội dung |
|---|---|
| Mục tiêu | Bot trả lời tự động FAQ/hướng dẫn/chính sách trên cả 2 kênh, có handoff hoàn chỉnh |
| Phạm vi kỹ thuật | • Module **AI Orchestrator** + **AI Gateway** tích hợp vào pipeline xử lý tin nhắn hiện có<br>• Adapter Zalo hoàn thiện production-grade (từ nền tảng đã kiểm chứng ở PoC)<br>• Adapter ALOBO Chat (bot là thành viên hệ thống trong hội thoại)<br>• Quản lý ngữ cảnh hội thoại (Redis) + trạng thái bot/người<br>• RAG mức cơ bản trên bộ FAQ có cấu trúc (pgvector)<br>• Guardrails vào/ra + quy tắc handoff (mục 8.2, 8.3)<br>• Logging đầy đủ: hội thoại, token, chi phí, độ trễ<br>• Màn hình quản trị tối thiểu: bật/tắt bot theo kênh, xem hội thoại, sửa FAQ |
| Chiến lược rollout | 1. **Internal alpha:** đội nội bộ test trên kênh riêng, chấm điểm câu trả lời<br>2. **Beta giới hạn:** bật cho một nhóm nhỏ khách hàng thật (5–10% lưu lượng), giám sát chặt<br>3. **Mở rộng dần:** tăng theo nấc 25% → 50% → 100% khi các chỉ số ổn định |
| Nghiệm thu (exit criteria) | • ≥ 50% hội thoại bot xử lý trọn vẹn (không cần nhân viên)<br>• CSAT hội thoại có bot ≥ 4/5<br>• Độ trễ trả lời p95 < 5 giây<br>• Tỉ lệ trả lời sai nghiêm trọng (bịa chính sách, lộ thông tin) = 0 trong beta<br>• Chi phí AI/hội thoại nằm trong ngân sách duyệt |

### PHASE 2 — Mở rộng tri thức & cá nhân hóa

| Hạng mục | Nội dung |
|---|---|
| Mục tiêu | Bot trả lời sâu hơn về nghiệp vụ và theo ngữ cảnh từng khách hàng |
| Phạm vi | • RAG đầy đủ: nạp toàn bộ tài liệu sản phẩm/quy trình, pipeline cập nhật tự động, quản lý phiên bản tài liệu<br>• Định danh khách hàng & truy vấn cá nhân hóa (trạng thái yêu cầu/ticket của chính khách) với phân quyền dữ liệu nghiêm ngặt<br>• Hồ sơ khách hợp nhất đa kênh (một khách — nhiều kênh)<br>• Tóm tắt hội thoại tự động khi handoff và khi đóng ticket<br>• Vòng lặp cải tiến: dashboard câu bot trả lời kém → nghiệp vụ bổ sung tri thức → đo lại |
| Nghiệm thu | ≥ 60% hội thoại bot xử lý trọn vẹn; tỉ lệ "bot không biết" giảm ≥ 30% so với Phase 1 |

### PHASE 3 — Agent Assist & Vận hành thông minh

| Hạng mục | Nội dung |
|---|---|
| Mục tiêu | AI phục vụ cả nhân viên và cấp quản lý, không chỉ khách hàng |
| Phạm vi | • **Agent Assist:** gợi ý câu trả lời thời gian thực cho nhân viên trong màn hình làm việc (nhân viên duyệt trước khi gửi)<br>• Phân tích cảm xúc & cảnh báo sớm hội thoại rủi ro<br>• Phân loại & định tuyến ticket tự động theo kỹ năng nhân viên<br>• Dashboard insight: chủ đề khách hỏi nhiều, xu hướng khiếu nại, khoảng trống tri thức<br>• Đánh giá chất lượng hội thoại tự động (AI chấm QA thay vì nghe/đọc xác suất) |
| Nghiệm thu | Thời gian xử lý trung bình của nhân viên (AHT) giảm ≥ 20%; ≥ 70% hội thoại bot xử lý trọn vẹn |

### PHASE 4 — AI chủ động & Tối ưu quy mô lớn

| Hạng mục | Nội dung |
|---|---|
| Mục tiêu | Từ "trả lời khi được hỏi" sang "chủ động phục vụ"; tối ưu chi phí ở quy mô lớn |
| Phạm vi | • Bot chủ động: thông báo trạng thái yêu cầu, nhắc lịch, khảo sát hài lòng sau hỗ trợ<br>• Đánh giá lại phương án self-host LLM / model routing sâu hơn nếu volume đủ lớn để tiết kiệm chi phí<br>• Mở rộng kênh (nếu chiến lược yêu cầu)<br>• Nghiên cứu voice bot / xử lý hình ảnh nếu có nhu cầu thực tế |
| Nghiệm thu | Theo OKR kinh doanh tại thời điểm đó |

### 9.1. Điều kiện chuyển phase & cơ chế dừng

- **Go/No-Go review** cuối mỗi phase với đủ ba bên: kỹ thuật, nghiệp vụ CSKH, quản lý.
- Nếu Phase 1 beta phát hiện lỗi nghiêm trọng lặp lại (bot bịa chính sách, lộ dữ liệu): **tắt bot ngay bằng công tắc khẩn cấp**, toàn bộ lưu lượng quay về nhân viên — hệ thống phải được thiết kế để việc tắt bot không gây gián đoạn CSKH.

---

## 10. KPI & PHƯƠNG PHÁP ĐO LƯỜNG

### 10.1. Bộ KPI chính

| Nhóm | KPI | Định nghĩa | Mục tiêu Phase 1 |
|---|---|---|---|
| Hiệu quả tự động hóa | **Containment rate** | % hội thoại bot xử lý trọn vẹn, không cần nhân viên | ≥ 50% |
| | **Handoff rate** | % hội thoại phải chuyển nhân viên | ≤ 50% (giảm dần theo phase) |
| Chất lượng | **CSAT (bot)** | Điểm hài lòng khảo sát cuối hội thoại có bot | ≥ 4/5 |
| | **Tỉ lệ trả lời đúng** | % câu trả lời được QA đánh giá đúng (chấm mẫu ngẫu nhiên hằng tuần) | ≥ 90% |
| | **Lỗi nghiêm trọng** | Bịa chính sách, lộ thông tin, tư vấn sai gây thiệt hại | 0 |
| Trải nghiệm | **First response time** | Thời gian phản hồi đầu tiên | < 5 giây (bot) |
| | **Độ trễ p95** | Độ trễ sinh câu trả lời | < 5 giây |
| Vận hành & chi phí | **Chi phí AI / hội thoại** | Tổng chi phí token ÷ số hội thoại | Trong ngân sách duyệt |
| | **Uptime pipeline bot** | Tỉ lệ thời gian bot sẵn sàng | ≥ 99.5% |
| Tác động kinh doanh | **AHT nhân viên** | Thời gian xử lý trung bình của nhân viên (case được chuyển) | Giảm dần từ Phase 2–3 |
| | **Khối lượng/nhân viên** | Số hội thoại một nhân viên phụ trách được | Tăng dần |

### 10.2. Cơ chế đo lường

- **Khảo sát tức thì:** sau khi bot kết thúc hỗ trợ, hỏi nhanh 1 chạm (hài lòng/không) — tối giản để có tỉ lệ trả lời cao.
- **QA chấm mẫu:** hằng tuần chấm ngẫu nhiên tối thiểu 100 hội thoại bot theo rubric (đúng/đủ/tông giọng/an toàn).
- **Feedback từ nhân viên:** nút "bot trả lời sai" ngay trong workspace để nhân viên gắn cờ hội thoại kém — nguồn dữ liệu cải tiến quan trọng nhất.
- **Dashboard realtime:** containment, handoff, chi phí, độ trễ theo ngày/kênh.

---

## 11. QUẢN TRỊ RỦI RO

| # | Rủi ro | Khả năng | Tác động | Biện pháp giảm thiểu |
|---|---|---|---|---|
| R1 | **Bot trả lời sai/bịa (hallucination)** gây hiểu lầm chính sách | Trung bình | Cao | RAG bám nguồn tài liệu; guardrails hậu kiểm; ngưỡng tin cậy → handoff; QA chấm mẫu; công tắc tắt khẩn cấp |
| R2 | **Rò rỉ dữ liệu cá nhân** qua nhà cung cấp LLM | Thấp | Rất cao | DPA + chế độ không huấn luyện trên dữ liệu; lọc/che PII trước khi gửi API; phân quyền truy vấn dữ liệu cá nhân hóa |
| R3 | **Phụ thuộc nhà cung cấp LLM** (tăng giá, đổi chính sách, sự cố) | Trung bình | Trung bình | AI Gateway trừu tượng hóa; sẵn cấu hình fallback sang mô hình thứ hai; theo dõi thị trường định kỳ |
| R4 | **Chi phí API vượt dự toán** khi lưu lượng tăng | Trung bình | Trung bình | Hạn mức chi tiêu ngày + cảnh báo; model routing (mô hình rẻ cho tác vụ đơn giản); cache câu trả lời FAQ phổ biến; tóm tắt ngữ cảnh dài |
| R5 | **Thay đổi chính sách/API nền tảng Zalo** | Trung bình | Cao (với kênh Zalo) | Bám tài liệu & điều khoản Zalo OA chính thức; kiến trúc adapter cô lập ảnh hưởng; **ALOBO Chat là kênh tự chủ chiến lược** — luôn hoạt động bất kể bên thứ ba |
| R6 | **Khách hàng phản ứng tiêu cực với bot** | Trung bình | Trung bình | Minh bạch "trợ lý AI"; luôn có lối thoát gặp người; rollout theo nấc + đo CSAT liên tục; tông giọng thân thiện được duyệt |
| R7 | **Prompt injection / lạm dụng bot** | Trung bình | Trung bình | Guardrails đầu vào; giới hạn vai trò trong system prompt; rate limit; log & cảnh báo hành vi bất thường |
| R8 | **Knowledge base lỗi thời** → bot trả lời theo chính sách cũ | Cao (nếu không có quy trình) | Cao | Quy trình duyệt nội dung có chủ sở hữu (content owner) phía nghiệp vụ; metadata ngày hiệu lực; review định kỳ |
| R9 | **Đội CSKH lo ngại bị thay thế** → thiếu hợp tác | Trung bình | Trung bình | Truyền thông nội bộ rõ: bot xử lý lặp lại, người xử lý giá trị cao; đưa nhân viên CSKH vào vòng xây dựng tri thức & đánh giá bot |

---

## 12. BẢO MẬT, QUYỀN RIÊNG TƯ & TUÂN THỦ PHÁP LÝ

### 12.1. Nguyên tắc dữ liệu

1. **Tối thiểu hóa dữ liệu gửi ra ngoài:** chỉ gửi nội dung cần thiết cho việc sinh câu trả lời tới API LLM; lọc/che (mask) số điện thoại, email, giấy tờ tùy thân... trước khi gửi khi không cần thiết cho nghiệp vụ.
2. **Hợp đồng xử lý dữ liệu (DPA)** với nhà cung cấp LLM; bật chế độ **không sử dụng dữ liệu để huấn luyện**.
3. **Mã hóa**: dữ liệu hội thoại mã hóa khi truyền (TLS) và khi lưu trữ; API key quản lý qua secret manager, xoay vòng định kỳ.
4. **Phân quyền truy cập** log hội thoại theo vai trò; audit log cho mọi truy cập dữ liệu khách.
5. **Chính sách lưu trữ (retention):** quy định thời hạn lưu hội thoại và cơ chế xóa theo yêu cầu của chủ thể dữ liệu.

### 12.2. Tuân thủ pháp lý (Việt Nam)

- **Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân:** rà soát cơ sở pháp lý xử lý dữ liệu, cập nhật chính sách quyền riêng tư, thông báo cho khách về việc sử dụng AI trong quy trình hỗ trợ, đảm bảo quyền của chủ thể dữ liệu (truy cập, xóa, phản đối).
- **Điều khoản nền tảng Zalo OA:** tuân thủ quy định về tin nhắn tự động, tần suất, nội dung của Zalo.
- **Minh bạch AI:** khách hàng được biết rõ khi nào đang trò chuyện với AI, khi nào với người — vừa là đạo đức sản phẩm, vừa đón đầu xu hướng quy định về AI.

### 12.3. An toàn vận hành

- Công tắc tắt bot khẩn cấp theo từng kênh (kill switch).
- Hạn mức chi tiêu API theo ngày, cảnh báo ở 70%/90%.
- Môi trường staging tách biệt với dữ liệu giả lập để kiểm thử trước mỗi thay đổi prompt/tri thức lớn.
- Bộ kiểm thử hồi quy hội thoại (bộ câu hỏi chuẩn + đáp án kỳ vọng) chạy trước mỗi lần release.

---

## 13. TỔ CHỨC ĐỘI NGŨ & NGUỒN LỰC

### 13.1. Cơ cấu đội dự án (Phase 1)

| Vai trò | Số lượng | Trách nhiệm |
|---|---|---|
| Product Owner | 1 | Chốt phạm vi, ưu tiên, nghiệm thu; cầu nối nghiệp vụ CSKH |
| Backend Engineer | 2 | AI Orchestrator, AI Gateway, adapter kênh, tích hợp pipeline hiện có |
| AI Engineer | 1 | Prompt engineering, RAG, đánh giá chất lượng mô hình, guardrails |
| Frontend Engineer | 1 (bán thời gian) | Màn hình quản trị bot, dashboard |
| QA Engineer | 1 | Kiểm thử luồng hội thoại, bộ test hồi quy, kịch bản phá hoại (adversarial) |
| Nghiệp vụ CSKH (SME) | 1–2 (kiêm nhiệm) | Xây và duyệt knowledge base, định nghĩa quy tắc handoff, chấm QA hội thoại |
| DevOps | Kiêm nhiệm | Hạ tầng, giám sát, secret management |

### 13.2. Vận hành sau go-live

- **Bot Manager (vai trò mới, có thể kiêm nhiệm từ trưởng nhóm CSKH):** theo dõi dashboard hằng ngày, duyệt cập nhật tri thức, tổng hợp lỗi bot → backlog cải tiến hằng tuần.
- **Nhịp cải tiến hằng tuần:** review các hội thoại bot xử lý kém → bổ sung/sửa tri thức hoặc điều chỉnh prompt → chạy bộ test hồi quy → release.

---

## 14. ƯỚC TÍNH CHI PHÍ VẬN HÀNH

> Con số dưới đây là **khung ước tính để lập ngân sách**, cần hiệu chỉnh theo báo giá thực tế của nhà cung cấp được chọn và lưu lượng thật của ALOBO.

### 14.1. Cấu trúc chi phí

| Khoản mục | Tính chất | Ghi chú ước tính |
|---|---|---|
| **API LLM** (chi phí biến đổi chính) | Theo token | Một hội thoại CSKH trung bình ~5–10 lượt trao đổi; với model routing hợp lý, chi phí mỗi hội thoại ở mức vài trăm đồng → thấp hơn nhiều lần chi phí nhân sự cho hội thoại tương đương |
| API Embedding (nạp tri thức + truy vấn) | Theo token | Rất nhỏ so với chi phí LLM chính (thường < 5% tổng chi AI) |
| Hạ tầng bổ sung | Cố định | Tận dụng hạ tầng hiện có (PostgreSQL + pgvector, Redis, queue) → phần tăng thêm không đáng kể ở Phase 1 |
| Nhân sự phát triển | Một lần / theo phase | Theo cơ cấu đội mục 13.1 |
| Nhân sự vận hành bot | Thường xuyên | Chủ yếu kiêm nhiệm (Bot Manager + SME nghiệp vụ) |

### 14.2. Logic hoàn vốn (ROI)

- Mỗi hội thoại bot xử lý trọn vẹn là một hội thoại nhân viên **không phải** xử lý. Với containment 50% ở Phase 1, năng lực phục vụ của đội CSKH hiện tại tăng xấp xỉ **gấp đôi** mà không tăng nhân sự.
- Giá trị khó đo bằng tiền nhưng thực: phục vụ 24/7, giảm thời gian chờ, trải nghiệm đồng nhất, dữ liệu insight từ hội thoại.
- Khuyến nghị: chốt **ngân sách trần chi phí AI theo tháng** cho Phase 1 + cơ chế cảnh báo (mục 12.3), sau beta sẽ có số liệu thật để dự toán chính xác cho các phase sau.

---

## 15. PHỤ LỤC

### 15.1. Thuật ngữ

| Thuật ngữ | Giải thích |
|---|---|
| **LLM** (Large Language Model) | Mô hình ngôn ngữ lớn — "bộ não" sinh câu trả lời của chatbot |
| **RAG** (Retrieval-Augmented Generation) | Kỹ thuật cho bot tra cứu tài liệu doanh nghiệp trước khi trả lời, giúp trả lời đúng và có nguồn |
| **Vector Database** | Cơ sở dữ liệu tìm kiếm theo ngữ nghĩa (tìm tài liệu "cùng ý nghĩa" chứ không chỉ cùng từ khóa) |
| **Containment rate** | Tỉ lệ hội thoại bot xử lý trọn vẹn không cần con người |
| **Human handoff** | Chuyển hội thoại từ bot sang nhân viên kèm đầy đủ ngữ cảnh |
| **Guardrails** | Các hàng rào kiểm soát để bot trả lời an toàn, đúng phạm vi |
| **Prompt injection** | Kiểu tấn công dùng tin nhắn để "lừa" bot làm trái chỉ dẫn |
| **Agent Assist** | AI gợi ý câu trả lời cho nhân viên (người vẫn là người gửi) |
| **CSAT** | Customer Satisfaction — điểm hài lòng của khách hàng |
| **AHT** | Average Handling Time — thời gian xử lý trung bình một yêu cầu |
| **DPA** | Data Processing Agreement — hợp đồng xử lý dữ liệu với nhà cung cấp |
| **PoC** | Proof of Concept — thử nghiệm chứng minh tính khả thi |

### 15.2. Câu hỏi mở cần chốt trước khi khởi động Phase 1

1. Ngân sách trần hằng tháng cho chi phí API AI ở Phase 1?
2. Danh sách nghiệp vụ bot **được phép** và **không được phép** trả lời (do nghiệp vụ CSKH chốt)?
3. Persona chính thức của bot: tên, cách xưng hô, mức độ trang trọng?
4. Khung giờ có nhân viên trực để nhận handoff; thông điệp hẹn phản hồi ngoài giờ?
5. Ai là content owner chịu trách nhiệm duyệt knowledge base phía nghiệp vụ?
6. Nhóm khách hàng nào tham gia beta giới hạn đầu tiên?

### 15.3. Tài liệu tham chiếu nên chuẩn bị kèm theo

- Bộ FAQ + chính sách + hướng dẫn sử dụng hiện hành (đầu vào knowledge base).
- Tài liệu API Zalo Official Account (webhook, gửi tin, giới hạn tần suất).
- Đặc tả API/event của nền tảng ALOBO Chat cho tài khoản hệ thống (bot).
- Chính sách quyền riêng tư hiện hành của ALOBO (để cập nhật mục sử dụng AI).

---

*Tài liệu này là đề xuất kế hoạch tổng thể. Sau khi được phê duyệt chủ trương, bước tiếp theo là lập tài liệu thiết kế kỹ thuật chi tiết (Technical Design Document) cho Phase 1.*
