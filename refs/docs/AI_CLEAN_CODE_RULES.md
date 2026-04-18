# Omnichat Backend - Quy tắc Clean Code cho AI

Sử dụng tài liệu này làm guideline mặc định cho mọi phiên AI mới trong repository này.

## 1) Mục tiêu cốt lõi

- Ưu tiên kiến trúc sạch, mã dễ đọc và dễ bảo trì.
- Giữ logic bám đúng ngữ cảnh domain Omnichat.
- Tránh copy nguyên mẫu code từ dự án/template không liên quan.

## 2) Quy tắc style bắt buộc

- Không tạo file `*util*` chung chung cho luồng nghiệp vụ.
- Đặt constants/enums/interfaces đúng thư mục theo domain:
  - `src/app/constants`
  - `src/app/enums`
  - `src/common/**/constants`
  - `src/common/**/enums`
  - `src/common/**/interfaces`
- Đặt tên rõ nghĩa theo nghiệp vụ, tránh tên mơ hồ.
- Mỗi file nên tập trung vào một trách nhiệm chính.

## 3) Quy tắc cho middleware

- Middleware chỉ xử lý các concern của pipeline request/response.
- Đăng ký middleware trong `src/app/app.middleware.module.ts` với thứ tự rõ ràng, nhất quán.
- Luồng xử lý phải theo config:
  - Đọc giá trị qua `ConfigService`
  - Truy cập key config qua constants (ví dụ: `MIDDLEWARE_CONFIG_PATH`)
- Kiểu dữ liệu mở rộng của request phải có interface riêng (ví dụ: `IRequestWithContext`).

## 4) Quy tắc cho exception & response

- Chuẩn response lỗi phải nhất quán (`statusCode`, `message`, tùy chọn `errors`/`data`, `_metadata`).
- Logic metadata/header phải tập trung trong service chuyên biệt, không lặp ở nhiều filter.
- Message key phải khai báo bằng enum/constants, không hard-code string.

## 5) Quy tắc config & environment

- Mỗi key `process.env.*` mới phải được bổ sung vào:
  - file config tương ứng trong `src/configs`
  - `.env.example`
- Luôn có default value rõ ràng và an toàn.
- Không để lại key config chết/không còn sử dụng.

## 6) Quy tắc đặt tên theo domain

- Chỉ dùng naming thuộc Omnichat.
- Loại bỏ hoặc từ chối các thuật ngữ từ domain khác (ví dụ: `crm`, `shop`) nếu không có yêu cầu rõ ràng.
- Ưu tiên các tên như `omnichat`, `session`, `client`, `conversation`, ...

## 7) Quy tắc dependency

- Chỉ thêm dependency khi thực sự cần.
- Ưu tiên khả năng có sẵn của Node/Nest/Express trước khi thêm package mới.
- Giữ import tối thiểu và xóa import thừa ngay khi phát sinh.

## 8) Quy tắc kiểm chứng

- Sau các thay đổi đáng kể, luôn chạy:
  - build/type-check
  - lint cho các file đã chỉnh sửa
- Sửa hết lỗi phát sinh trước khi kết thúc.

## 9) Cách AI cần hành xử trong session

- Trước khi code, đọc các file liên quan để bám đúng style hiện có của dự án.
- Refactor để rõ ràng hơn khi cần, nhưng tránh over-engineering.
- Không thêm logic ngoài phạm vi domain liên quan.
- Nếu phân vân giữa nhiều cách làm, ưu tiên cách đã dùng trong codebase.

## 10) Checklist nhanh trước khi hoàn tất

- [ ] Không tạo file `util` kiểu gom tạp
- [ ] Constants/enums được đặt đúng thư mục
- [ ] Tách bạch trách nhiệm middleware/filter
- [ ] Env key đã đồng bộ với `.env.example`
- [ ] Không còn naming từ domain ngoài
- [ ] Build và lint pass cho phần thay đổi
