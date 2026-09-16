# CHIẾN LƯỢC KINH DOANH & GO-TO-MARKET — SẢN PHẨM AI CHATBOT

> **Dành cho:** Founder xuất thân kỹ thuật (technical founder) — đã có sản phẩm chạy được, cần biến nó thành sản phẩm **có người dùng và bán được**.
>
> **Bối cảnh:** Chatbot AI CSKH đã tích hợp và test thành công trên Zalo (PoC khả thi), sẽ mở rộng sang ALOBO Chat. Sản phẩm kỹ thuật đã sẵn sàng ở mức nền tảng; phần còn thiếu là toàn bộ mảng thị trường, khách hàng, doanh thu.
>
> **Phiên bản:** 1.0 — Trạng thái: Đề xuất
>
> **Tài liệu liên quan:** `ALOBO_AI_CHATBOT_PLAN.md` (kế hoạch kỹ thuật & triển khai)

---

## MỤC LỤC

1. [Tư duy nền tảng: Sản phẩm ≠ Doanh nghiệp](#1-tư-duy-nền-tảng-sản-phẩm--doanh-nghiệp)
2. [Từ điển khái niệm kinh doanh cho dân Tech](#2-từ-điển-khái-niệm-kinh-doanh-cho-dân-tech)
3. [Phân tích thị trường & đối thủ cạnh tranh](#3-phân-tích-thị-trường--đối-thủ-cạnh-tranh)
4. [Khách hàng mục tiêu (ICP) & chân dung người mua](#4-khách-hàng-mục-tiêu-icp--chân-dung-người-mua)
5. [Định vị sản phẩm & thông điệp bán hàng](#5-định-vị-sản-phẩm--thông-điệp-bán-hàng)
6. [Mô hình kinh doanh & chiến lược giá](#6-mô-hình-kinh-doanh--chiến-lược-giá)
7. [Chiến lược Go-To-Market theo giai đoạn](#7-chiến-lược-go-to-market-theo-giai-đoạn)
8. [Kênh marketing & kế hoạch thực thi](#8-kênh-marketing--kế-hoạch-thực-thi)
9. [Quy trình bán hàng B2B cho dân Tech](#9-quy-trình-bán-hàng-b2b-cho-dân-tech)
10. [Đo lường: Funnel & Unit Economics](#10-đo-lường-funnel--unit-economics)
11. [Pháp lý & vận hành doanh nghiệp](#11-pháp-lý--vận-hành-doanh-nghiệp)
12. [Tài chính & gọi vốn](#12-tài-chính--gọi-vốn)
13. [Đội ngũ: những vai trò phi kỹ thuật cần có](#13-đội-ngũ-những-vai-trò-phi-kỹ-thuật-cần-có)
14. [Lộ trình hành động 0 → 1](#14-lộ-trình-hành-động-0--1)
15. [Những sai lầm kinh điển của founder kỹ thuật](#15-những-sai-lầm-kinh-điển-của-founder-kỹ-thuật)
16. [Phụ lục: Checklist & mẫu tham khảo](#16-phụ-lục-checklist--mẫu-tham-khảo)

---

## 1. TƯ DUY NỀN TẢNG: SẢN PHẨM ≠ DOANH NGHIỆP

Đây là điều quan trọng nhất tài liệu này muốn truyền đạt, trước mọi chiến thuật:

> **Xây được sản phẩm chạy tốt mới chỉ là 30% con đường. 70% còn lại là: tìm đúng người cần nó, thuyết phục họ dùng, thuyết phục họ trả tiền, và giữ họ ở lại.**

### 1.1. Ba sự thật khó nghe cho dân Tech

1. **"Build it and they will come" là ngộ nhận số 1.** Không ai tự tìm đến sản phẩm tốt. Sản phẩm tốt + không ai biết = sản phẩm chết. Trên thực tế, một sản phẩm 7/10 điểm với marketing 9/10 sẽ thắng sản phẩm 9/10 điểm với marketing 3/10.
2. **Khách hàng không mua công nghệ, họ mua kết quả.** Khách không quan tâm bạn dùng LLM nào, RAG hay fine-tune. Họ quan tâm: *"Tôi tiết kiệm được bao nhiêu tiền/thời gian? Khách của tôi có hài lòng hơn không?"* Mọi thông điệp bán hàng phải nói bằng ngôn ngữ **kết quả**, không phải ngôn ngữ **tính năng**.
3. **Doanh thu là bằng chứng duy nhất của Product-Market Fit.** Lời khen ("hay đấy, hữu ích đấy") không có giá trị xác nhận. Chỉ khi khách **rút ví trả tiền** và **tiếp tục trả tiền tháng sau**, sản phẩm mới thực sự có chỗ đứng.

### 1.2. Vòng đời startup — bạn đang ở đâu?

```text
[Ý tưởng] → [PoC/Prototype] → [MVP có người dùng thật] → [Product-Market Fit] → [Tăng trưởng] → [Mở rộng]
                  ▲
             BẠN Ở ĐÂY
```

Bạn đã có PoC thành công (chatbot chạy thật trên Zalo). Mục tiêu của toàn bộ chiến lược này là đi từ **PoC → những khách hàng trả tiền đầu tiên → Product-Market Fit**. Mọi quyết định trong 6–12 tháng tới phải phục vụ mục tiêu đó, không phải phục vụ việc "làm sản phẩm hoàn hảo hơn".

### 1.3. Quy tắc phân bổ thời gian cho technical founder

Từ nay, một tuần làm việc của founder nên chia:

| Hoạt động | Tỉ lệ khuyến nghị | Ghi chú |
|---|---|---|
| Nói chuyện với khách hàng (phỏng vấn, demo, bán) | **40%** | Việc quan trọng nhất và không thể ủy quyền ở giai đoạn đầu |
| Phát triển sản phẩm | 30% | Chỉ build thứ khách hàng thật yêu cầu/cần |
| Marketing & nội dung | 20% | Xây kênh, viết content, đo số liệu |
| Vận hành, pháp lý, tài chính | 10% | Đủ để không vướng, không sa đà |

Cảm giác "code mới là làm việc thật, đi nói chuyện là mất thời gian" là cái bẫy lớn nhất — hãy chủ động chống lại nó.

---

## 2. TỪ ĐIỂN KHÁI NIỆM KINH DOANH CHO DÂN TECH

Nắm vững các khái niệm này trước khi đọc phần chiến lược. Chúng là "syntax" của thế giới kinh doanh.

### 2.1. Khái niệm thị trường & sản phẩm

| Thuật ngữ | Định nghĩa dễ hiểu | Vì sao quan trọng |
|---|---|---|
| **GTM (Go-To-Market)** | Kế hoạch tổng thể đưa sản phẩm đến tay khách hàng: bán cho ai, qua kênh nào, với thông điệp gì, giá bao nhiêu | Là "kiến trúc hệ thống" của việc bán hàng |
| **PMF (Product-Market Fit)** | Trạng thái sản phẩm đáp ứng đúng nhu cầu thị trường đủ mạnh: khách chủ động tìm đến, trả tiền, giới thiệu người khác | Trước PMF: đừng scale, đừng đốt tiền quảng cáo. Sau PMF: dồn lực tăng trưởng |
| **TAM / SAM / SOM** | TAM: tổng thị trường lý thuyết. SAM: phần thị trường bạn phục vụ được. SOM: phần bạn thực tế chiếm được trong 2–3 năm | Nhà đầu tư luôn hỏi; giúp bạn không ảo tưởng cũng không bi quan |
| **ICP (Ideal Customer Profile)** | Chân dung khách hàng lý tưởng: ngành, quy mô, nỗi đau, ngân sách | Bán cho "tất cả mọi người" = bán cho không ai cả |
| **Persona** | Chân dung *con người cụ thể* ra quyết định mua (chức danh, mục tiêu, nỗi sợ) | B2B: người dùng và người trả tiền thường khác nhau |
| **USP (Unique Selling Proposition)** | Lý do duy nhất khiến khách chọn bạn thay vì đối thủ | Không có USP rõ = cạnh tranh bằng giá = chết chậm |
| **Positioning (định vị)** | Vị trí sản phẩm trong tâm trí khách hàng so với các lựa chọn khác | Quyết định toàn bộ thông điệp marketing |
| **MVP (Minimum Viable Product)** | Phiên bản tối thiểu đủ để khách dùng thật và trả tiền | MVP để *học từ thị trường*, không phải bản demo kỹ thuật |
| **Early adopter** | Nhóm khách chấp nhận dùng sản phẩm mới dù chưa hoàn hảo | Là khách hàng mục tiêu duy nhất của 6 tháng đầu |

### 2.2. Khái niệm tài chính & đo lường

| Thuật ngữ | Định nghĩa dễ hiểu | Công thức / ngưỡng tham khảo |
|---|---|---|
| **MRR / ARR** | Doanh thu định kỳ theo tháng / năm (Monthly/Annual Recurring Revenue) | Chỉ số sức khỏe số 1 của SaaS |
| **ARPU** | Doanh thu trung bình trên một khách hàng | MRR ÷ số khách trả tiền |
| **CAC (Customer Acquisition Cost)** | Tổng chi phí để có được 1 khách hàng mới (quảng cáo + lương sales + công cụ...) | Tổng chi phí sales & marketing ÷ số khách mới |
| **LTV (Lifetime Value)** | Tổng doanh thu một khách mang lại trong suốt vòng đời sử dụng | ARPU × số tháng trung bình khách ở lại × biên lợi nhuận gộp |
| **LTV : CAC** | Tỉ lệ giá trị khách / chi phí kiếm khách | Lành mạnh: **≥ 3:1**. Dưới 1:1 = càng bán càng lỗ |
| **Churn rate** | Tỉ lệ khách rời bỏ mỗi tháng | SaaS SME tốt: < 3–5%/tháng. Churn cao = thùng không đáy |
| **Retention** | Tỉ lệ khách ở lại (ngược của churn) | Retention là chỉ báo PMF trung thực nhất |
| **Gross margin (biên lợi nhuận gộp)** | (Doanh thu − chi phí trực tiếp tạo ra dịch vụ) ÷ doanh thu | SaaS tốt: 70–85%. Lưu ý: **chi phí API LLM ăn trực tiếp vào biên này** |
| **Burn rate** | Tiền mặt "đốt" mỗi tháng | Quyết định bạn sống được bao lâu |
| **Runway** | Số tháng còn sống với tiền hiện có | Tiền mặt ÷ burn rate. Dưới 6 tháng = báo động |
| **Payback period** | Số tháng để thu hồi CAC của một khách | Tốt: < 12 tháng |
| **NPS (Net Promoter Score)** | Khảo sát "Bạn có giới thiệu sản phẩm cho người khác không?" (0–10) | %(9–10 điểm) − %(0–6 điểm). > 30 là tốt |
| **Conversion rate** | Tỉ lệ chuyển đổi giữa các bước (xem trang → đăng ký → trả tiền) | Đo từng bước của funnel để biết "tắc" ở đâu |

### 2.3. Khái niệm marketing & bán hàng

| Thuật ngữ | Định nghĩa dễ hiểu |
|---|---|
| **Funnel (phễu)** | Hành trình khách hàng từ "chưa biết bạn" → "trả tiền" → "giới thiệu người khác", mỗi bước rơi rụng dần |
| **AARRR (Pirate Metrics)** | Khung phễu 5 bước: **A**cquisition (kéo về) → **A**ctivation (dùng lần đầu thành công) → **R**etention (quay lại) → **R**evenue (trả tiền) → **R**eferral (giới thiệu) |
| **Lead** | Người/công ty có thông tin liên hệ và có khả năng mua. **MQL**: lead do marketing đem về đủ tiêu chuẩn. **SQL**: lead sales đã xác nhận có nhu cầu + ngân sách |
| **Inbound marketing** | Khách tự tìm đến qua nội dung (blog, SEO, video, mạng xã hội) — rẻ, bền, chậm |
| **Outbound** | Chủ động tiếp cận khách (gọi điện, nhắn tin, email lạnh) — nhanh, tốn công, dễ bị từ chối |
| **PLG (Product-Led Growth)** | Tăng trưởng nhờ chính sản phẩm: dùng thử miễn phí → tự thấy giá trị → tự nâng cấp trả phí |
| **SLG (Sales-Led Growth)** | Tăng trưởng nhờ đội bán hàng chủ động chốt deal (phù hợp deal lớn, khách doanh nghiệp) |
| **Freemium** | Bản miễn phí có giới hạn để kéo người dùng, thu tiền ở bản nâng cao |
| **Onboarding** | Quá trình hướng dẫn khách mới thiết lập và đạt giá trị đầu tiên. Onboarding tệ = churn cao |
| **Aha moment** | Khoảnh khắc khách "à, hiểu rồi, cái này đáng tiền!" — với chatbot: lần đầu thấy bot tự trả lời đúng câu hỏi của khách họ |
| **Case study / Social proof** | Câu chuyện khách hàng thật với con số thật — vũ khí bán hàng B2B mạnh nhất |
| **Churn interview** | Phỏng vấn khách rời bỏ để biết lý do thật — nguồn học quý ngang khách mới |
| **CRM** | Phần mềm quản lý quan hệ khách hàng: lưu mọi lead, cuộc gọi, trạng thái deal — dùng ngay từ ngày có lead đầu tiên |

---

## 3. PHÂN TÍCH THỊ TRƯỜNG & ĐỐI THỦ CẠNH TRANH

### 3.1. Thị trường chatbot AI CSKH tại Việt Nam

**Động lực thị trường (tailwinds):**

- Làn sóng AI tạo sinh khiến mọi doanh nghiệp đều "muốn có AI" — nhu cầu tìm hiểu rất cao, rào cản niềm tin đang giảm nhanh.
- Chi phí nhân sự CSKH tăng đều mỗi năm; tuyển và giữ nhân viên trực chat khó.
- Zalo là nền tảng chat thống trị tại Việt Nam — kinh doanh online Việt Nam sống trên Zalo/Facebook, và mảng **chatbot AI hội thoại tự nhiên trên Zalo** vẫn còn thưa đối thủ hơn nhiều so với Facebook Messenger.

**Lực cản (headwinds):**

- Khách SME Việt nhạy cảm về giá, quen "dùng chùa".
- Nhiều doanh nghiệp từng thất vọng với chatbot thế hệ cũ (kịch bản cứng nhắc, trả lời ngớ ngẩn) → phải vượt qua định kiến "chatbot = vô dụng".
- LLM đôi khi trả lời sai → doanh nghiệp sợ rủi ro thương hiệu.

### 3.2. Bản đồ cạnh tranh

Phân loại đối thủ theo nhóm (cần khảo sát giá & tính năng cập nhật trước khi chốt định vị):

| Nhóm | Đại diện tiêu biểu | Điểm mạnh của họ | Điểm yếu của họ (cơ hội của ta) |
|---|---|---|---|
| **Chatbot kịch bản (rule-based) nội địa** | AhaChat, BotBanHang, Harafunnel, Fchat | Rẻ, nhiều người dùng, mạnh trên Facebook Messenger | Kịch bản cứng, không hiểu ngôn ngữ tự nhiên; trải nghiệm "máy móc"; yếu trên Zalo |
| **Nền tảng AI doanh nghiệp lớn** | FPT.AI, Viettel Cyberbot, VinBase | Thương hiệu lớn, năng lực enterprise | Đắt, triển khai chậm, nhắm khách lớn — bỏ trống phân khúc SME |
| **Công cụ quốc tế** | Intercom, Tidio, Chatfuel, ManyChat | Sản phẩm trưởng thành | Không hỗ trợ Zalo hoặc hỗ trợ kém; tiếng Việt yếu; giá USD cao; không hiểu nghiệp vụ Việt Nam |
| **Agency tự làm bot theo dự án** | Các agency/freelancer | Tùy biến sâu | Không phải sản phẩm, khó bảo trì, chi phí dự án cao |
| **"Không làm gì" (status quo)** | Nhân viên trực chat thủ công | Quen thuộc, không tốn tiền phần mềm | Chậm, bỏ sót tin nhắn ngoài giờ, không scale — **đây mới là "đối thủ" lớn nhất cần đánh bại trong tâm trí khách** |

> **Ghi nhớ quan trọng:** Với sản phẩm mới, đối thủ số 1 hiếm khi là công ty khác — mà là **thói quen hiện tại của khách hàng** ("để nhân viên trả lời cũng được mà"). Thông điệp marketing phải đánh vào chi phí của việc *không thay đổi*: tin nhắn bỏ sót lúc 10h đêm = đơn hàng mất.

### 3.3. Khoảng trống thị trường ta nhắm vào

**"Chatbot AI hội thoại tự nhiên tiếng Việt, chuyên sâu cho kênh Zalo (+ nền tảng chat riêng), triển khai nhanh, giá SME chịu được."**

- Nhóm rule-based: không có AI hội thoại thật.
- Nhóm enterprise: bỏ rơi SME.
- Nhóm quốc tế: không có Zalo.
- → Giao điểm "AI thật × Zalo × giá SME" đang trống. Đây là **beachhead market** (thị trường bàn đạp) của chúng ta.

### 3.4. Việc cần làm ngay (nghiên cứu thị trường thực địa)

1. **Phỏng vấn tối thiểu 20 chủ doanh nghiệp/quản lý CSKH** đang bán hàng qua Zalo (xem kịch bản phỏng vấn ở Phụ lục 16.2). Mục tiêu: xác nhận nỗi đau, mức sẵn sàng chi trả, quy trình mua.
2. **Đăng ký dùng thử 3–5 sản phẩm đối thủ**, ghi lại bảng giá, tính năng, trải nghiệm onboarding của họ.
3. **Ước lượng SOM thực tế:** ví dụ khuôn tính — số doanh nghiệp SME có bán hàng/CSKH qua Zalo trong ngành mục tiêu × tỉ lệ tiếp cận được năm đầu × giá gói trung bình = doanh thu khả thi năm 1. Điền số thật sau khảo sát.

---

## 4. KHÁCH HÀNG MỤC TIÊU (ICP) & CHÂN DUNG NGƯỜI MUA

### 4.1. Nguyên tắc: chọn một mũi nhọn

Sai lầm phổ biến: "sản phẩm của tôi dùng được cho mọi ngành". Đúng về kỹ thuật, chết về marketing. Giai đoạn đầu phải chọn **một phân khúc hẹp** để: thông điệp sắc bén, tri thức mẫu (bot template) làm sẵn theo ngành, khách giới thiệu lẫn nhau trong cùng ngành.

### 4.2. Đề xuất ICP giai đoạn đầu (cần xác nhận lại bằng phỏng vấn)

**ICP chính — SME bán hàng/dịch vụ có lượng chat Zalo lớn:**

| Tiêu chí | Mô tả |
|---|---|
| Ngành ưu tiên | Bán lẻ online (mỹ phẩm, mẹ & bé, thời trang), giáo dục (trung tâm ngoại ngữ, khóa học), dịch vụ (spa, phòng khám, bất động sản cho thuê) |
| Quy mô | 5–50 nhân sự; có 1–5 người trực chat |
| Dấu hiệu nhận biết nỗi đau | ≥ 50–100 hội thoại Zalo/ngày; khách nhắn ngoài giờ không ai trả lời; câu hỏi lặp đi lặp lại (giá, ship, lịch hẹn, chương trình khuyến mãi) |
| Ngân sách khả thi | Vài trăm nghìn đến vài triệu đồng/tháng cho công cụ giúp bán được nhiều hơn |
| Người quyết định mua | Chủ doanh nghiệp (quyết nhanh, quan tâm tiền) hoặc trưởng nhóm CSKH (quan tâm đỡ việc) |

**ICP phụ (sau khi có case study):** doanh nghiệp vừa và lớn có đội CSKH riêng — chu kỳ bán dài hơn, deal to hơn, cần hồ sơ năng lực.

### 4.3. Persona người mua (B2B: người dùng ≠ người trả tiền)

| Persona | Vai trò | Điều họ quan tâm | Điều họ sợ | Thông điệp dành cho họ |
|---|---|---|---|---|
| **Chị Lan — chủ shop online** | Người trả tiền + quyết định | Không sót đơn, đỡ thuê thêm người, khách được trả lời lúc nửa đêm | Bot trả lời bậy làm mất khách; cài đặt phức tạp | "Không bỏ sót khách nào lúc 2h sáng. Cài trong 1 ngày, không cần biết kỹ thuật." |
| **Bạn Minh — nhân viên trực chat** | Người dùng hằng ngày | Đỡ trả lời câu lặp lại; bot đừng làm mình mất việc | Bị thay thế | "Bot lo câu hỏi nhàm chán, bạn lo chốt đơn và khách khó." |
| **Anh Tuấn — trưởng CSKH công ty vừa** | Người đề xuất, cần thuyết phục sếp | Số liệu: giảm thời gian phản hồi, tăng CSAT, báo cáo đẹp để trình sếp | Chọn sai nhà cung cấp mất uy tín | ROI cụ thể + bản pilot miễn phí + case study cùng ngành |

---

## 5. ĐỊNH VỊ SẢN PHẨM & THÔNG ĐIỆP BÁN HÀNG

### 5.1. Tuyên bố định vị (positioning statement)

Khuôn chuẩn: *Dành cho [ICP], đang gặp [nỗi đau], [tên sản phẩm] là [loại sản phẩm] giúp [kết quả chính], khác với [đối thủ/hiện trạng] vì [USP].*

Áp dụng:

> **Dành cho doanh nghiệp SME bán hàng và chăm sóc khách qua Zalo**, đang quá tải tin nhắn và bỏ sót khách ngoài giờ, **[Tên thương mại của bot]** là **trợ lý AI trả lời khách tự động bằng tiếng Việt tự nhiên 24/7**, giúp **xử lý phần lớn câu hỏi lặp lại và không bỏ lỡ khách hàng nào**, khác với chatbot kịch bản cứng nhắc vì **hiểu và trò chuyện như người thật, học từ chính tài liệu của doanh nghiệp, và chuyển cho nhân viên đúng lúc**.

### 5.2. Chuyển "tính năng" thành "lợi ích" — bảng dịch bắt buộc

Dân tech nói cột trái; khách hàng chỉ nghe cột phải:

| ❌ Ngôn ngữ kỹ thuật (đừng nói) | ✅ Ngôn ngữ khách hàng (hãy nói) |
|---|---|
| "Dùng LLM thế hệ mới nhất, hỗ trợ RAG" | "Bot trả lời đúng thông tin sản phẩm của chính shop bạn, không bịa" |
| "Xử lý ngôn ngữ tự nhiên tiếng Việt" | "Khách nhắn kiểu gì cũng hiểu — viết tắt, sai chính tả, không dấu" |
| "Human handoff với ngưỡng tin cậy" | "Câu khó bot tự động chuyển cho nhân viên, kèm tóm tắt — khách không phải kể lại" |
| "Độ trễ p95 dưới 5 giây" | "Khách được trả lời ngay lập tức, kể cả 2 giờ sáng" |
| "Kiến trúc đa kênh, channel-agnostic" | "Một bot chăm khách trên cả Zalo lẫn app chat của bạn" |
| "Dashboard analytics" | "Biết khách hỏi gì nhiều nhất để nhập hàng/điều chỉnh dịch vụ" |

### 5.3. Ba tầng thông điệp

1. **Tagline (7 từ đổ lại):** ví dụ *"Trợ lý AI chốt khách 24/7 trên Zalo"*.
2. **Elevator pitch (30 giây):** "Shop bạn nhận hàng trăm tin nhắn Zalo mỗi ngày, và cứ 10 tin thì 7–8 tin là câu hỏi lặp lại. Bot của chúng tôi trả lời những câu đó ngay lập tức, bằng tiếng Việt tự nhiên như nhân viên thật, học từ chính tài liệu của bạn. Câu khó nó chuyển cho người. Kết quả: không sót khách, nhân viên nhàn hơn, bán được cả lúc ngủ."
3. **Chứng minh (proof):** kết quả PoC + số liệu pilot + video demo 60 giây bot trả lời thật + case study khách đầu tiên.

---

## 6. MÔ HÌNH KINH DOANH & CHIẾN LƯỢC GIÁ

### 6.1. Mô hình đề xuất: SaaS subscription theo gói, tính theo tháng

Lý do chọn: doanh thu định kỳ (MRR) dễ dự đoán, khớp chuẩn ngành, khách SME quen thuê bao tháng.

### 6.2. Khung gói giá đề xuất (số tiền cần chốt sau khảo sát giá đối thủ + phỏng vấn ICP)

| | **Miễn phí / Trial** | **Cơ bản** | **Chuyên nghiệp** | **Doanh nghiệp** |
|---|---|---|---|---|
| Mục đích gói | Kéo người dùng, tạo aha moment | Shop nhỏ bắt đầu | Nguồn doanh thu chính | Deal lớn, bán trực tiếp |
| Kênh | 1 kênh Zalo | 1 kênh | Zalo + kênh chat riêng | Đa kênh + tùy biến |
| Giới hạn hội thoại AI/tháng | Thấp (đủ nếm thử) | Trung bình | Cao | Thỏa thuận |
| Knowledge base | Giới hạn số tài liệu | Chuẩn | Đầy đủ + cập nhật tự động | Đầy đủ + hỗ trợ nhập liệu |
| Human handoff | ✔ | ✔ | ✔ + tóm tắt AI | ✔ + phân quyền đội nhóm |
| Báo cáo | Cơ bản | Cơ bản | Nâng cao | Nâng cao + xuất dữ liệu |
| Hỗ trợ | Tài liệu | Chat | Ưu tiên | Chuyên viên riêng, SLA |

**Nguyên tắc định giá quan trọng cho dân tech:**

1. **Định giá theo giá trị, không theo chi phí.** Đừng lấy chi phí API + hạ tầng rồi cộng lãi. Hãy hỏi: bot thay được bao nhiêu phần công việc của một nhân viên trực chat (lương 7–10 triệu/tháng)? Nếu bot làm được 50% việc đó, mức giá 1–3 triệu/tháng là "rẻ hơn 3–5 lần thuê người" — đó là cách khách so sánh.
2. **Phải có giới hạn theo mức dùng (usage cap)** vì chi phí API LLM biến đổi theo lượng hội thoại — nếu bán "không giới hạn" giá cố định, một khách siêu to có thể ăn sạch biên lợi nhuận. Vượt hạn mức → mua thêm gói hội thoại (add-on).
3. **Đặt 3 gói trả phí, đẩy khách vào gói giữa** (hiệu ứng mỏ neo — anchor: gói Doanh nghiệp đắt làm gói Chuyên nghiệp trông hợp lý).
4. **Khuyến khích trả theo năm** (tặng 1–2 tháng): cải thiện dòng tiền và giảm churn.
5. **Đừng định giá quá thấp.** Giá thấp không chỉ giảm doanh thu — nó làm khách *nghi ngờ chất lượng* và thu hút đúng nhóm khách phiền nhất. Tăng giá sau này khó hơn nhiều so với giảm giá.
6. **Trial 14 ngày có đủ tính năng** thường hiệu quả hơn freemium vĩnh viễn ở B2B — tạo cảm giác khẩn trương.

### 6.3. Dòng doanh thu phụ (sau khi ổn định)

- **Phí triển khai/nhập tri thức (setup fee):** gói "làm hộ" cho khách không rành kỹ thuật — vừa thu tiền vừa giảm churn do onboarding tốt.
- **Gói hội thoại bổ sung (add-on)** khi vượt hạn mức.
- **White-label / API cho agency:** cho agency marketing bán lại bot dưới thương hiệu của họ — kênh phân phối đòn bẩy cao (xem mục 8.4).

### 6.4. Bảo vệ unit economics — việc sống còn với sản phẩm AI

Khác SaaS thường, sản phẩm AI có **chi phí biến đổi thật** (token LLM) trên mỗi khách. Bắt buộc theo dõi từ ngày đầu:

```text
Biên gộp mỗi khách = Giá gói − (chi phí API LLM + hạ tầng phân bổ cho khách đó)
```

- Đo **chi phí API trên mỗi khách, mỗi tháng** ngay trong dashboard nội bộ.
- Kỹ thuật giảm chi phí đã nêu trong tài liệu kỹ thuật (model routing, cache FAQ, tóm tắt ngữ cảnh) — ở góc kinh doanh, chúng chính là **công cụ bảo vệ biên lợi nhuận**.
- Mục tiêu: chi phí AI ≤ 15–25% giá gói (biên gộp ≥ 75%).

---

## 7. CHIẾN LƯỢC GO-TO-MARKET THEO GIAI ĐOẠN

### GIAI ĐOẠN 1 — "Do things that don't scale": 10 khách hàng đầu tiên

**Mục tiêu:** 10 khách dùng thật (trong đó ≥ 5 trả tiền), 3 case study có số liệu.

**Cách làm — thủ công, trực tiếp, không quảng cáo:**

1. **Khai thác mạng lưới cá nhân:** bạn bè, người quen, cộng đồng đang kinh doanh online qua Zalo. Mục tiêu không phải "nhờ ủng hộ" mà tìm người **có nỗi đau thật**.
2. **Đề nghị không thể từ chối cho khách sơ khai (design partner):** miễn phí 2–3 tháng, founder trực tiếp cài đặt và nhập tri thức hộ, hỗ trợ tức thì qua nhóm Zalo riêng. Đổi lại: được dùng số liệu + logo làm case study, phản hồi hằng tuần, và **cam kết mức giá trả sau trial nếu hài lòng** (để kiểm chứng mức sẵn sàng chi trả ngay từ đầu).
3. **Founder tự làm onboarding từng khách** — mỗi buổi cài đặt là một buổi nghiên cứu người dùng miễn phí: xem họ vướng đâu, chữ nào không hiểu, tính năng nào họ *thực sự* dùng.
4. **Đo bằng tay cũng được, nhưng phải đo:** với mỗi khách pilot, chốt trước 2–3 con số sẽ đo (số tin bot tự trả lời, thời gian phản hồi trước/sau, số đơn/lịch hẹn ngoài giờ). Số liệu này là **tài sản marketing** quý nhất giai đoạn sau.

**Tín hiệu để chuyển giai đoạn:** ≥ 5 khách trả tiền thật; churn tháng đầu thấp; ít nhất 1 khách chủ động giới thiệu khách khác.

### GIAI ĐOẠN 2 — Lặp lại được: xây "cỗ máy" marketing & bán hàng

**Mục tiêu:** tăng từ 10 → 50–100 khách trả tiền; tìm ra 1–2 kênh marketing hiệu quả nhất; chuẩn hóa onboarding để không cần founder cài tay từng khách.

**Cách làm:**

1. Đóng gói self-service onboarding: khách tự kết nối Zalo OA, tự tải FAQ lên, có video hướng dẫn + template tri thức theo ngành.
2. Bơm case study giai đoạn 1 vào mọi kênh (mục 8).
3. Thử nghiệm có kỷ luật từng kênh marketing: mỗi kênh chạy thử với ngân sách nhỏ cố định, đo CAC từng kênh, giữ 1–2 kênh tốt nhất, tắt phần còn lại.
4. Tuyển nhân sự thương mại đầu tiên (mục 13).

**Tín hiệu chuyển giai đoạn:** CAC từng kênh đo được và LTV:CAC ≥ 3; quy trình từ lead → trả tiền không còn phụ thuộc cá nhân founder.

### GIAI ĐOẠN 3 — Scale: đổ nhiên liệu vào cỗ máy đã chạy

- Tăng ngân sách vào kênh đã chứng minh CAC tốt.
- Mở phân khúc ICP thứ hai (khách vừa/lớn) với quy trình bán SLG.
- Kích hoạt kênh đối tác/agency (white-label) như một đường phân phối nhân bản.
- Cân nhắc gọi vốn *tại thời điểm này* nếu cần tăng tốc (gọi vốn khi đã có cỗ máy chạy → định giá tốt hơn nhiều; xem mục 12).

> **Kỷ luật quan trọng nhất của GTM: đừng làm giai đoạn 3 khi chưa xong giai đoạn 1.** Đốt tiền quảng cáo khi sản phẩm chưa giữ được khách = mua churn bằng tiền túi.

---

## 8. KÊNH MARKETING & KẾ HOẠCH THỰC THI

### 8.1. Ưu tiên kênh theo giai đoạn

| Kênh | Chi phí | Tốc độ ra kết quả | Độ bền | Khi nào dùng |
|---|---|---|---|---|
| Bán trực tiếp qua mạng lưới cá nhân | Công sức | Nhanh | — | Giai đoạn 1 |
| Cộng đồng online (nhóm Zalo/Facebook chủ shop, hội kinh doanh) | Công sức | Nhanh–vừa | Trung bình | Giai đoạn 1–2 |
| **Chính sản phẩm làm marketing (xem 8.3)** | Rất thấp | Vừa | Cao | Ngay từ đầu |
| Content + SEO (blog, TikTok/YouTube ngắn) | Công sức | Chậm (3–6 tháng) | **Rất cao** | Bắt đầu sớm ở giai đoạn 2 |
| Referral (khách giới thiệu khách) | Thấp | Vừa | Cao | Ngay khi có khách hài lòng |
| Quảng cáo trả phí (Facebook/Google Ads) | Tiền thật | Nhanh | Thấp (tắt tiền là tắt lead) | Chỉ sau khi có PMF + đo được CAC |
| Đối tác/agency (white-label) | Chia sẻ doanh thu | Chậm khởi động | Rất cao | Giai đoạn 2–3 |
| Sự kiện/hội thảo SME, webinar | Trung bình | Vừa | Trung bình | Giai đoạn 2–3 |

### 8.2. Chiến lược nội dung (content) — kênh chủ lực dài hạn

Nguyên tắc: **bán bằng cách dạy**. Khách SME khát kiến thức vận hành — hãy trở thành người dạy họ, sản phẩm bán kèm một cách tự nhiên.

- **Trụ cột nội dung:** (a) Mẹo CSKH & chốt đơn qua Zalo; (b) Ứng dụng AI cho doanh nghiệp nhỏ — giải thích không màu mè; (c) Câu chuyện khách hàng (case study); (d) Hậu trường xây sản phẩm (build in public — dân tech có lợi thế kể chuyện này chân thật).
- **Định dạng ưu tiên tại Việt Nam:** video ngắn TikTok/Reels/YouTube Shorts quay cảnh **bot trả lời khách thật trên Zalo** — demo trực quan 30 giây thuyết phục hơn 10 bài viết; bài đăng nhóm Facebook/Zalo cộng đồng chủ shop; blog SEO cho từ khóa "chatbot Zalo", "AI trả lời tin nhắn Zalo", "phần mềm CSKH Zalo"...
- **Nhịp tối thiểu duy trì được:** 2–3 video ngắn/tuần + 1 bài dài/tuần. Đều đặn quan trọng hơn hay xuất sắc từng bài.

### 8.3. Dùng chính sản phẩm để marketing (Product-as-marketing)

- **Chữ ký bot:** gói miễn phí/rẻ hiển thị dòng "Trả lời bởi [Tên bot]" kèm link — mỗi hội thoại của khách là một quảng cáo tự nhiên (chính là cách Hotmail, Intercom tăng trưởng).
- **Bot demo công khai:** nhóm Zalo/OA demo cho khách tiềm năng nhắn thử thoải mái — "showroom" mở cửa 24/7.
- **Trang landing page** với demo tương tác ngay trên web, form đăng ký trial không quá 3 trường thông tin.

### 8.4. Kênh đối tác — đòn bẩy lớn nhất về sau

- **Agency marketing/quảng cáo cho SME:** họ có sẵn hàng chục khách hàng đúng ICP. Cho họ hoa hồng định kỳ (20–30% doanh thu tháng của khách họ giới thiệu) hoặc gói white-label.
- **Đơn vị bán giải pháp bán hàng (POS, website, CRM):** tích hợp/bán chéo.
- Một đối tác tốt = một "nhân viên sales" không lương cố định, tự mang theo niềm tin sẵn có với khách của họ.

### 8.5. Referral có chủ đích

Đừng chờ khách tự giới thiệu — thiết kế cơ chế: tặng tháng sử dụng cho cả người giới thiệu lẫn người được giới thiệu; xin lời giới thiệu **ngay tại đỉnh hài lòng** (vừa xem báo cáo tháng đẹp, vừa khen bot).

---

## 9. QUY TRÌNH BÁN HÀNG B2B CHO DÂN TECH

Bán hàng B2B là **quy trình có cấu trúc**, không phải tài ăn nói bẩm sinh. Dân tech học được, thậm chí có lợi thế (hiểu sản phẩm sâu, demo mượt, nói chuyện số liệu).

### 9.1. Pipeline chuẩn — như một state machine

```text
[Lead] → [Liên hệ đầu] → [Khám phá nhu cầu] → [Demo] → [Pilot/Trial] → [Báo giá & thương lượng] → [Chốt] → [Onboarding] → [Gia hạn/Upsell]
```

Quản lý bằng CRM ngay từ lead số 1 (HubSpot free/Notion/Google Sheet đều được — quan trọng là **có kỷ luật cập nhật**). Mỗi deal phải có: người liên hệ, trạng thái, bước tiếp theo, ngày hẹn tiếp theo.

### 9.2. Kỹ thuật của từng bước

- **Khám phá nhu cầu (discovery) — bước quan trọng nhất, dân tech hay bỏ qua để nhảy vào demo.** Hỏi trước khi nói: "Một ngày shop nhận bao nhiêu tin nhắn? Ai trực? Ngoài giờ thì sao? Đã từng thử công cụ nào chưa, vì sao dừng? Nếu giải quyết được X thì giá trị với anh/chị cỡ nào?" — Nghe 70%, nói 30%. Câu trả lời của khách chính là **kịch bản demo và báo giá** của bạn.
- **Demo:** không tour tính năng. Demo đúng kịch bản khách vừa kể — tốt nhất là nạp thử FAQ *của chính khách* rồi để họ tự nhắn thử với bot. Khoảnh khắc bot trả lời đúng câu hỏi về sản phẩm *của họ* chính là aha moment chốt deal.
- **Pilot có cấu trúc:** trial 14 ngày với tiêu chí thành công thống nhất *trước* ("bot tự xử lý ≥ 40% tin nhắn trong 2 tuần") + lịch review giữa kỳ và cuối kỳ. Trial không có tiêu chí = trôi vào quên lãng.
- **Xử lý từ chối (objection) phổ biến:**

| Khách nói | Ý thật | Cách trả lời |
|---|---|---|
| "Để anh suy nghĩ thêm" | Chưa thấy đủ giá trị hoặc chưa gặp đúng người quyết định | "Dạ, để em hỏi thêm: điều gì khiến anh còn phân vân nhất ạ?" — đưa cuộc nói chuyện về nỗi đau |
| "Đắt quá" | Chưa quy đổi được ra giá trị | So sánh với lương 1 nhân viên trực chat; đưa số liệu pilot |
| "Sợ bot trả lời bậy" | Rủi ro thương hiệu | Giải thích cơ chế chỉ trả lời theo tài liệu được duyệt + chuyển người khi không chắc + cho xem log thật |
| "Bên X rẻ hơn" | So sánh nhầm loại | Phân biệt bot kịch bản với AI hội thoại thật — mời nhắn thử demo cả hai |

- **Chốt:** chủ động đề xuất bước tiếp theo cụ thể có thời hạn ("Em gửi hợp đồng hôm nay, mình bắt đầu cài thứ Hai nhé?"). Người bán không dám hỏi câu chốt thì deal không tự chốt.

### 9.3. Onboarding & Customer Success — nơi quyết định churn

Với SaaS, **bán được chỉ là bắt đầu; giữ được mới là kinh doanh**:

- Khách phải đạt aha moment trong **ngày đầu tiên** (bot trả lời đúng ít nhất một câu hỏi thật của khách họ). Thiết kế onboarding ngược từ mốc này.
- Tuần 1: chủ động hỏi thăm + tinh chỉnh tri thức hộ. Tháng 1: gửi báo cáo "bot đã trả lời giúp bạn X tin nhắn, tiết kiệm ~Y giờ" — báo cáo này chính là **lý do gia hạn**.
- Theo dõi tín hiệu sắp churn: lượng dùng giảm, không đăng nhập dashboard, không phản hồi — can thiệp sớm.
- Phỏng vấn mọi khách rời bỏ (churn interview): 15 phút, chỉ hỏi và ghi, không bao biện.

---

## 10. ĐO LƯỜNG: FUNNEL & UNIT ECONOMICS

### 10.1. Bảng số liệu tuần (dashboard founder) — bắt đầu từ tuần đầu tiên

| Tầng phễu (AARRR) | Chỉ số | Nguồn đo |
|---|---|---|
| Acquisition | Khách truy cập landing page; lead mới theo từng kênh | Web analytics + CRM |
| Activation | % đăng ký trial hoàn tất kết nối kênh + nạp tri thức + bot trả lời tin đầu tiên | Sản phẩm |
| Retention | % khách còn hoạt động sau 30/60/90 ngày; churn tháng | Sản phẩm + billing |
| Revenue | MRR, số khách trả phí, ARPU, chi phí API/khách, biên gộp | Billing + log chi phí AI |
| Referral | Số khách đến từ giới thiệu; NPS | CRM + khảo sát |

### 10.2. Unit economics — bài toán một khách hàng

Ví dụ minh họa cách tính (số liệu giả định để làm mẫu, thay bằng số thật):

```text
Giá gói Chuyên nghiệp:            1.500.000 đ/tháng
Chi phí API AI + hạ tầng/khách:    -300.000 đ/tháng   → Biên gộp 80%
Khách ở lại trung bình:            18 tháng
LTV = 1.200.000 × 18            = 21.600.000 đ
CAC cho phép (LTV/3):           ≤ 7.200.000 đ/khách
→ Nếu một kênh quảng cáo tốn > 7,2 triệu để ra 1 khách trả tiền: tắt kênh đó.
```

Ba câu hỏi phải trả lời được mỗi tháng: (1) Một khách đáng giá bao nhiêu (LTV)? (2) Kiếm một khách tốn bao nhiêu (CAC theo từng kênh)? (3) Khách ở lại bao lâu và vì sao rời đi (churn + lý do)?

### 10.3. Tín hiệu Product-Market Fit (biết khi nào "đã đến")

- Retention 90 ngày ổn định ở mức cao; khách gia hạn không cần thuyết phục.
- ≥ 40% người dùng trả lời "rất thất vọng" nếu sản phẩm biến mất (khảo sát Sean Ellis test).
- Lead tự đến (inbound) tăng đều; khách giới thiệu khách.
- Sales cycle ngắn dần vì thị trường bắt đầu "tự hiểu" sản phẩm.

---

## 11. PHÁP LÝ & VẬN HÀNH DOANH NGHIỆP

> Phần này liệt kê các việc mà dân tech thường không biết là *phải làm*. Chi tiết thực thi nên thuê dịch vụ kế toán/luật (chi phí thấp, tránh rủi ro lớn).

### 11.1. Thành lập & thuế (Việt Nam)

| Việc | Điểm cần biết |
|---|---|
| Thành lập công ty (thường là **Công ty TNHH**) | Cần pháp nhân để ký hợp đồng B2B và xuất hóa đơn — khách doanh nghiệp gần như bắt buộc yêu cầu **hóa đơn VAT** |
| Kế toán & thuế | Thuê dịch vụ kế toán ngoài (phổ biến, chi phí vừa phải/tháng) lo báo cáo thuế GTGT, TNDN, TNCN — đừng tự làm |
| Hóa đơn điện tử | Đăng ký từ đầu; không xuất được hóa đơn = mất khách doanh nghiệp |
| Tài khoản ngân hàng doanh nghiệp + cổng thanh toán | Tách bạch tiền công ty/cá nhân từ ngày đầu; tích hợp thanh toán định kỳ (chuyển khoản/QR trước, cổng thanh toán tự động sau) |
| Ngành nghề kinh doanh phần mềm | Lưu ý các ưu đãi thuế cho doanh nghiệp phần mềm/công nghệ — hỏi kế toán để tận dụng |

### 11.2. Hợp đồng & tài liệu pháp lý sản phẩm

- **Hợp đồng dịch vụ / Điều khoản sử dụng (ToS):** phạm vi dịch vụ, SLA, giới hạn trách nhiệm (đặc biệt điều khoản về **nội dung do AI sinh ra** — cam kết cơ chế kiểm soát nhưng giới hạn trách nhiệm với sai sót của AI ở mức pháp luật cho phép).
- **Chính sách quyền riêng tư + Thỏa thuận xử lý dữ liệu (DPA)** với khách hàng: bạn xử lý **dữ liệu khách của khách** (tin nhắn người dùng cuối) — theo Nghị định 13/2023/NĐ-CP, cần rõ vai trò, mục đích, thời hạn lưu, cam kết bảo mật; đây còn là **điểm cộng bán hàng** với khách lớn.
- **Tuân thủ điều khoản nền tảng Zalo OA:** đọc kỹ quy định tin tự động; vi phạm có thể bị khóa OA của khách — rủi ro kinh doanh trực tiếp.
- **Sở hữu trí tuệ:** đăng ký nhãn hiệu (tên bot + logo) sớm — chi phí nhỏ, tranh chấp sau này rất đắt; mua các tên miền liên quan ngay.

### 11.3. Vận hành tối thiểu

- Công cụ: CRM (lead & khách), công cụ hóa đơn/thu tiền định kỳ, kênh hỗ trợ khách (nhóm Zalo/OA hỗ trợ), tài liệu hướng dẫn (help center đơn giản).
- Quy trình khi có sự cố (bot trả lời sai nghiêm trọng cho khách của khách): tắt bot kênh đó → thông báo khách chủ động → khắc phục → báo cáo lại. Xử lý sự cố minh bạch là cơ hội **tăng** niềm tin.

---

## 12. TÀI CHÍNH & GỌI VỐN

### 12.1. Ba con đường vốn

| Con đường | Bản chất | Phù hợp khi | Đánh đổi |
|---|---|---|---|
| **Bootstrapping** (tự lực) | Sống bằng doanh thu + tiền tiết kiệm | Chi phí thấp, sản phẩm bán được sớm — *trường hợp của chúng ta khá phù hợp* | Chậm hơn, áp lực dòng tiền cá nhân |
| **Angel investor** | Cá nhân đầu tư vài trăm triệu – vài tỷ đồng, đổi 5–15% cổ phần | Cần tiền tăng tốc vừa phải + cần mentor/mạng lưới | Pha loãng cổ phần, thêm tiếng nói |
| **Venture Capital (VC)** | Quỹ đầu tư lớn, kỳ vọng tăng trưởng rất nhanh (mô hình "1 thắng bù 9 thua") | Đã có PMF + thị trường đủ lớn + muốn chiếm thị trường nhanh | Áp lực tăng trưởng cực lớn, mất quyền kiểm soát dần, hội đồng quản trị |

**Khuyến nghị:** bootstrapping/vốn mỏng đến khi có PMF (mục 10.3). Sản phẩm này có chi phí vận hành thấp và bán được sớm — không bắt buộc gọi vốn để sống. Gọi vốn sau PMF định giá tốt gấp nhiều lần và giữ được quyền chủ động. Chỉ cân nhắc gọi sớm nếu xuất hiện cạnh tranh nóng cần chạy đua chiếm thị trường.

### 12.2. Khái niệm gọi vốn cần biết trước khi ngồi với nhà đầu tư

| Thuật ngữ | Nghĩa |
|---|---|
| **Valuation (định giá)** | Pre-money: giá công ty trước khi nhận tiền; Post-money = pre-money + tiền đầu tư |
| **Dilution (pha loãng)** | Nhận đầu tư = bán bớt % công ty; qua nhiều vòng, % của founder giảm dần |
| **Cap table** | Bảng ghi ai sở hữu bao nhiêu % — giữ sạch sẽ từ đầu, chia cổ phần founder rõ ràng bằng văn bản |
| **Vesting** | Cổ phần founder/nhân sự nhận dần theo thời gian (chuẩn: 4 năm, cliff 1 năm) — bảo vệ công ty khi ai đó rời sớm |
| **SAFE / Convertible note** | Công cụ nhận vốn sớm không cần chốt định giá ngay (chuyển thành cổ phần ở vòng sau) |
| **Term sheet** | Thỏa thuận điều khoản đầu tư sơ bộ — đọc kỹ các điều khoản quyền phủ quyết, thanh lý ưu tiên (liquidation preference) |
| **Runway / Burn** | (Xem mục 2.2) — nhà đầu tư luôn hỏi: "Tiền này cho bạn bao nhiêu tháng runway, đạt milestone gì?" |
| **Traction** | Bằng chứng tăng trưởng: MRR, số khách, retention, tốc độ tăng — **traction là ngôn ngữ thuyết phục duy nhất** |

### 12.3. Kế hoạch tài chính tối thiểu (không cần CFO vẫn phải có)

- Bảng theo dõi **tiền vào – tiền ra – runway** cập nhật hằng tháng (một sheet là đủ).
- Ngân sách giai đoạn 1 gồm: chi phí API AI (có trần + cảnh báo), hạ tầng, công cụ (CRM, analytics...), chi phí pháp lý/kế toán, marketing thử nghiệm.
- Nguyên tắc: **mọi khoản chi marketing phải gắn với giả thuyết đo được** ("5 triệu cho kênh X, kỳ vọng ~N lead, CAC ≤ M" — sai thì dừng, đúng thì tăng).

---

## 13. ĐỘI NGŨ: NHỮNG VAI TRÒ PHI KỸ THUẬT CẦN CÓ

### 13.1. Thứ tự bổ sung năng lực (không nhất thiết là tuyển full-time ngay)

| Ưu tiên | Vai trò | Giải quyết việc gì | Hình thức giai đoạn đầu |
|---|---|---|---|
| 1 | **Người đồng hành thương mại** (co-founder/partner mảng business) | Bán hàng, quan hệ khách, thị trường — nửa còn thiếu của technical founder | Lý tưởng: co-founder có cổ phần (có vesting). Nếu chưa gặp đúng người: founder tự học bán (mục 9) — đừng vội trao cổ phần lớn cho người chưa được thử thách |
| 2 | Kế toán/pháp lý | Thuế, hóa đơn, hợp đồng | Thuê dịch vụ ngoài |
| 3 | Content/Media | Video ngắn, bài viết, quản lý kênh | Cộng tác viên/part-time |
| 4 | Sales/CSKH đầu tiên | Nhân bản quy trình bán mà founder đã tự chứng minh | Full-time khi lead vượt sức founder |
| 5 | Customer Success | Onboarding, giữ chân, upsell | Khi ≥ 30–50 khách trả phí |

**Nguyên tắc tuyển nhân sự thương mại đầu tiên:** chỉ tuyển sales khi **founder đã tự bán được** và có quy trình ghi lại — nhân viên sales nhân bản quy trình thắng, họ không tự phát minh ra nó thay bạn.

### 13.2. Cố vấn (advisor)

Tìm 1–2 người từng làm SaaS/bán hàng B2B tại Việt Nam làm cố vấn (gặp 1–2 lần/tháng; thông lệ thị trường có thể kèm cổ phần nhỏ 0,25–1% có vesting). Một giờ của người từng đi qua tiết kiệm cho bạn nhiều tháng thử sai.

---

## 14. LỘ TRÌNH HÀNH ĐỘNG 0 → 1

> Trình bày theo **khối công việc tuần tự có tiêu chí hoàn thành** — xong khối trước mới sang khối sau.

### Khối A — Xác nhận thị trường (làm ngay, song song hoàn thiện sản phẩm)

- [ ] Phỏng vấn ≥ 20 người đúng ICP theo kịch bản (Phụ lục 16.2)
- [ ] Khảo sát giá + trải nghiệm 3–5 đối thủ
- [ ] Chốt ICP mũi nhọn + tuyên bố định vị (mục 5.1) + khung giá v1
- **Hoàn thành khi:** nói được trơn tru "bán cho ai, họ đau gì, vì sao chọn ta, giá bao nhiêu" và ≥ 5 người phỏng vấn nói "có, tôi muốn dùng thử"

### Khối B — Bộ vũ khí bán hàng tối thiểu

- [ ] Đặt tên thương mại cho bot + đăng ký nhãn hiệu, tên miền
- [ ] Landing page: 1 thông điệp chính, video demo 60 giây, form đăng ký trial
- [ ] Bot demo công khai (nhóm Zalo demo) + 2–3 template tri thức theo ngành mũi nhọn
- [ ] CRM + quy trình pipeline (mục 9.1); pitch 30 giây + deck 8–10 slide
- **Hoàn thành khi:** một người lạ xem landing page 30 giây hiểu ngay sản phẩm làm gì cho họ

### Khối C — 10 khách đầu tiên (design partners)

- [ ] Danh sách 50 khách tiềm năng từ mạng lưới + cộng đồng; liên hệ từng người
- [ ] Chốt 10 khách pilot với tiêu chí đo thống nhất trước (mục 7 — Giai đoạn 1)
- [ ] Founder trực tiếp onboarding; thu số liệu; phỏng vấn hằng tuần
- **Hoàn thành khi:** ≥ 5 khách chuyển sang trả tiền; 3 case study có con số thật

### Khối D — Nền tảng doanh nghiệp

- [ ] Thành lập pháp nhân, kế toán dịch vụ, hóa đơn điện tử, tài khoản ngân hàng
- [ ] ToS + chính sách quyền riêng tư + mẫu hợp đồng/DPA
- [ ] Thu tiền định kỳ vận hành được (dù thủ công)
- **Hoàn thành khi:** ký hợp đồng và xuất hóa đơn được cho khách doanh nghiệp đầu tiên

### Khối E — Cỗ máy marketing đầu tiên

- [ ] Khởi động nhịp content: 2–3 video ngắn/tuần + 1 bài dài/tuần, xoay quanh case study thật
- [ ] Bật cơ chế referral + chữ ký bot
- [ ] Thử nghiệm 2–3 kênh có trả phí với ngân sách trần cố định, đo CAC từng kênh
- **Hoàn thành khi:** xác định được 1–2 kênh có CAC chấp nhận được, lead về đều hằng tuần không phụ thuộc quan hệ cá nhân

### Khối F — Chuẩn bị scale

- [ ] Self-service onboarding hoàn chỉnh (khách tự cài không cần founder)
- [ ] Tuyển nhân sự thương mại đầu tiên theo quy trình đã chứng minh
- [ ] Ký 2–3 đối tác agency đầu tiên
- [ ] Rà soát unit economics (mục 10.2) — quyết định bootstrapping tiếp hay gọi vốn
- **Hoàn thành khi:** LTV:CAC ≥ 3, churn < 5%/tháng, MRR tăng đều — đủ điều kiện đổ nhiên liệu tăng trưởng

---

## 15. NHỮNG SAI LẦM KINH ĐIỂN CỦA FOUNDER KỸ THUẬT

Danh sách "chống trượt chân" — dán lên tường:

1. **Ở lì trong hang code.** Thêm tính năng thì vui, gọi cho khách lạ thì ngại — nhưng chỉ việc thứ hai tạo ra doanh thu. Nếu tuần này chưa nói chuyện với khách hàng nào, tuần này đi lùi.
2. **Làm tính năng không ai xin.** Trước khi build bất cứ gì mới, hỏi: *có bao nhiêu khách thật đã yêu cầu? Họ có trả thêm tiền cho nó không?*
3. **Cầu toàn trước khi ra mắt.** "Xong nốt cái này đã rồi launch" là vòng lặp vô hạn. Nếu không hơi xấu hổ về phiên bản đầu tiên tức là bạn đã ra mắt quá muộn.
4. **Nói tính năng, không nói lợi ích.** (Bảng dịch ở mục 5.2 — dùng mỗi ngày.)
5. **Định giá quá rẻ hoặc miễn phí kéo dài** vì "ngại lấy tiền". Khách trả tiền mới cho phản hồi thật; khách miễn phí cho lời khen xã giao.
6. **Đo cái dễ đo thay vì cái quan trọng.** Lượt xem, lượt thích là *vanity metrics*. Chỉ số thật: khách trả tiền mới, churn, MRR, CAC.
7. **Đốt tiền quảng cáo trước PMF.** Quảng cáo khuếch đại thứ đang có — kể cả khuếch đại sự rò rỉ.
8. **Bán cho tất cả mọi người.** Từ chối khách ngoài ICP giai đoạn đầu là kỷ luật, không phải mất mát.
9. **Coi thường pháp lý – kế toán** đến khi ký deal doanh nghiệp đầu tiên mới cuống. (Khối D — làm sớm, chi phí nhỏ.)
10. **Chia cổ phần mồm.** Mọi thỏa thuận founder/advisor phải bằng văn bản, có vesting, ngay từ đầu — hầu hết startup tan vỡ vì người, không vì sản phẩm.
11. **Nhầm im lặng là đồng ý.** Khách khen nhưng không trả tiền = lời từ chối lịch sự. Đo bằng hành vi (trả tiền, gia hạn, giới thiệu), không đo bằng lời nói.
12. **Bỏ quên khách cũ vì mải kiếm khách mới.** Với mô hình thuê bao, giữ một khách rẻ hơn kiếm khách mới nhiều lần — doanh thu thật nằm ở gia hạn.

---

## 16. PHỤ LỤC: CHECKLIST & MẪU THAM KHẢO

### 16.1. Checklist trước ngày ra mắt công khai (public launch)

- [ ] Landing page + video demo + form trial hoạt động
- [ ] Bot demo công khai chạy ổn định
- [ ] Bảng giá công khai + cơ chế thu tiền
- [ ] ToS + chính sách quyền riêng tư đăng công khai
- [ ] ≥ 3 case study/lời chứng thực (testimonial) có tên và con số thật
- [ ] Kênh hỗ trợ khách hàng sẵn sàng (OA/nhóm hỗ trợ + cam kết thời gian phản hồi)
- [ ] Quy trình sự cố + công tắc tắt bot khẩn cấp (đã có ở tài liệu kỹ thuật)
- [ ] Dashboard đo funnel tuần (mục 10.1) chạy từ ngày đầu

### 16.2. Kịch bản phỏng vấn khách hàng tiềm năng (30 phút)

Nguyên tắc vàng (theo tinh thần *The Mom Test*): **hỏi về quá khứ và hiện tại của họ, đừng hỏi "nếu có sản phẩm X anh có mua không"** — câu trả lời cho câu hỏi giả định luôn là lời khen vô giá trị.

1. "Anh/chị kể em nghe một ngày bán hàng qua Zalo diễn ra thế nào?"
2. "Trung bình một ngày bao nhiêu tin nhắn? Ai trả lời? Ngoài giờ thì sao?"
3. "Lần gần nhất bị sót/trả lời chậm tin nhắn khách là khi nào? Chuyện gì xảy ra?"
4. "Ba câu khách hỏi nhiều nhất là gì?"
5. "Anh/chị đã thử cách nào để xử lý chưa (thuê thêm người, chatbot, trả lời tự động)? Vì sao dừng/không hài lòng?"
6. "Hiện mỗi tháng chi bao nhiêu cho việc trực chat (lương, công cụ)?"
7. "Nếu vấn đề này biến mất hoàn toàn, nó đáng giá thế nào với anh/chị?"
8. (Cuối buổi) "Em đang xây công cụ giải quyết đúng việc này — anh/chị có muốn xem thử bản chạy thật không?" → nếu đồng ý xem + đồng ý pilot: đó là tín hiệu thật.

### 16.3. Sườn pitch deck 10 slide (khi cần trình bày với đối tác/nhà đầu tư)

1. Vấn đề (nỗi đau CSKH qua chat — kể bằng câu chuyện thật)
2. Giải pháp (demo 60 giây > 10 slide chữ)
3. Vì sao bây giờ (AI trưởng thành + chat thương mại bùng nổ)
4. Thị trường (TAM/SAM/SOM có nguồn)
5. Sản phẩm & lợi thế (AI hội thoại thật × Zalo × giá SME; kênh chat riêng tự chủ)
6. Traction (khách, MRR, retention, case study — slide quan trọng nhất)
7. Mô hình kinh doanh (gói giá, unit economics)
8. Cạnh tranh (bản đồ mục 3.2 + khoảng trống ta chiếm)
9. Đội ngũ (vì sao đội này thắng được)
10. Kế hoạch & đề nghị (milestone tiếp theo; cần gì)

### 16.4. Nguồn học khuyến nghị cho technical founder

| Chủ đề | Nguồn |
|---|---|
| Khởi nghiệp tinh gọn | *The Lean Startup* — Eric Ries |
| Phỏng vấn khách hàng đúng cách | *The Mom Test* — Rob Fitzpatrick (mỏng, thực chiến, nên đọc đầu tiên) |
| Tìm kênh tăng trưởng | *Traction* — Gabriel Weinberg |
| Định vị sản phẩm | *Obviously Awesome* — April Dunford |
| Bán hàng cho founder | *Founding Sales* — Pete Kazanjy (miễn phí online) |
| Kiến thức startup nền tảng | Y Combinator Startup School (khóa video miễn phí) |
| Chỉ số SaaS | Các bài viết "SaaS Metrics" của David Skok (forEntrepreneurs) |

---

*Tài liệu này là bản đồ tổng thể. Cách dùng đúng: mỗi thời điểm chỉ tập trung một khối của mục 14, dùng các mục còn lại làm tài liệu tra cứu khi chạm đến. Bước tiếp theo ngay: bắt đầu Khối A — đặt lịch 20 cuộc phỏng vấn khách hàng tiềm năng.*
