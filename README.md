# BandUp — Express + TypeScript + Prisma

Đây là backend Express + TypeScript + Prisma cho BandUp, được xây theo từng
bước học tập. Dự án hiện có model User, migration PostgreSQL, module lấy hồ sơ
người dùng, middleware xác minh JWT access token, error handler, Docker Compose
tùy chọn và CI kiểm tra build. Đăng ký, xác thực email qua đường link, đăng nhập,
refresh access token và logout đã có.

## Các phần code chính

| File | Công việc |
| --- | --- |
| `src/app.ts` | Tạo Express app và lắp các router/middleware |
| `src/server.ts` | Đọc PORT rồi mở cổng nhận request |
| `src/prisma.ts` | Tạo Prisma Client với DATABASE_URL |
| `src/modules/user` | Route, service, repository và DTO của User |
| `src/middlewares/authentication.middleware.ts` | Xác minh Bearer access token |
| `src/middlewares/error-handler.middleware.ts` | Trả JSON cho lỗi ngoài dự kiến |
| `src/learning` | CRUD PracticeUser dùng cho quá trình học |

`server.ts` dùng `app.ts` để nhận request. API `GET /` trả trạng thái hoạt động;
API `GET /api/v1/users/me` yêu cầu Bearer access token hợp lệ.

## Chạy dự án

Cần Node.js 24.

1. `npm install`.
2. Nếu chưa có .env, sao chép .env.example thành .env.
3. Điền DATABASE_URL, JWT_EMAIL_VERIFICATION_SECRET, JWT_ACCESS_SECRET,
   JWT_REFRESH_SECRET (mỗi secret JWT dài ít nhất 32 ký tự),
   SMTP_USER và SMTP_PASS theo .env.example. Nếu API không chạy tại localhost:3000,
   điền PUBLIC_API_URL để link trong email trỏ đúng địa chỉ.
4. `npm run db:generate`.
5. `npm run dev`.
6. Gọi GET http://localhost:3000/ trong trình duyệt hoặc Postman.

Kết quả:

```json
{ "message": "BandUp API is running" }
```

Trong PowerShell, nếu npm.ps1 bị chặn, dùng `npm.cmd` thay cho `npm`.
Ví dụ: `npm.cmd run dev`.

## Prisma và PostgreSQL

DATABASE_URL có dạng:

```text
postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE?schema=public
```

Username/password có ký tự đặc biệt cần được percent-encode trong URL.
Prisma 7 dùng adapter-pg và thư viện pg để giao tiếp với PostgreSQL.

- `prisma/schema.prisma`: khai báo User, UserRole, UserStatus và PracticeUser.
- `prisma.config.ts`: cấu hình cho lệnh Prisma, đọc DATABASE_URL.
- `src/generated/prisma`: Prisma Client tự sinh, không chỉnh sửa bằng tay.
- `prisma/migrations`: baseline database có sẵn và migration đồng bộ User.

`db:generate` chỉ tạo code client. Thay đổi bảng được thực hiện bằng migration,
không tự chạy khi backend khởi động.

Nếu muốn PostgreSQL riêng bằng Docker:

```powershell
docker compose up -d postgres
```

Docker Compose là tùy chọn. Nếu đã có PostgreSQL chạy sẵn, dùng DATABASE_URL tương ứng.
Các biến POSTGRES_* dùng để khởi tạo PostgreSQL Docker; không đổi mật khẩu PostgreSQL đã cài.

## Đăng ký và xác thực email bằng Postman

1. Gửi `POST http://localhost:3000/api/v1/auth/register` với body JSON:

   ```json
   { "email": "you@example.com", "password": "example-password" }
   ```

   Thành công trả HTTP 201 và user đang chờ xác thực, ví dụ:

   ```json
   { "id": "<uuid>", "email": "you@example.com", "role": "STUDENT", "status": "PENDING_VERIFICATION" }
   ```

   Token xác thực và password hash không nằm trong response. Backend đã yêu cầu SMTP
   gửi link tới email trên.

2. Mở email và bấm link, hoặc dán toàn bộ link vào Postman và gửi GET. Link có dạng
   `http://localhost:3000/api/v1/auth/verify-email?token=<token>`. Thành công trả
   HTTP 200 với `{ "message": "Email verified successfully" }`. Link hết hạn sau
   30 phút; link thiếu, sai hoặc hết hạn trả HTTP 400.

3. Gửi `POST http://localhost:3000/api/v1/auth/login` với cùng email và password.
   Thành công trả HTTP 200 cùng thông tin user và `accessToken`. Dùng
   `Authorization: Bearer <accessToken>` cho `GET /api/v1/users/me`. Response login
   cũng đặt cookie `bandup_refresh` (HttpOnly, hạn 7 ngày); refresh token không nằm
   trong JSON. Postman có thể tự giữ cookie cho `localhost`.

4. Gửi `POST http://localhost:3000/api/v1/auth/refresh` không cần body hay Bearer
   token. Postman gửi cookie từ bước login; thành công trả HTTP 200 với
   `{ "accessToken": "<new-token>" }`. Nếu thiếu cookie hoặc refresh token sai/hết hạn,
   API trả HTTP 401. Access token mới dùng với Bearer như ở bước 3.

5. Gửi `POST http://localhost:3000/api/v1/auth/logout` để xóa refresh cookie.
   Thành công trả HTTP 200 với `{ "message": "Logged out successfully" }`.
   Sau đó Postman không còn cookie để gọi `/refresh`.

Nếu link hết hạn, gửi `POST /api/v1/auth/resend-verification` với cùng email và password.
Thành công trả HTTP 200 và `{ "message": "Verification email sent" }`, sau đó mở link mới.

Register với email đã có trả HTTP 409. Email hoặc password không hợp lệ trả HTTP 400.
Nếu SMTP không gửi được, register trả HTTP 500 và xóa tài khoản đang chờ vừa tạo để
có thể thử đăng ký lại. Tài khoản chưa xác thực không thể đăng nhập.

Refresh token hiện là JWT không lưu trong database. Logout chỉ xóa cookie trên
trình duyệt đang dùng; bản sao refresh token đã bị lấy trước đó vẫn hợp lệ đến
khi hết hạn. Access token đã cấp cũng còn hiệu lực tối đa 30 phút. Khi cần thu hồi
token ngay hoặc logout từng thiết bị, phải bổ sung trạng thái phiên ở backend.
Nếu frontend và backend ở hai site khác nhau, cần cấu hình cookie và CORS phù hợp
trước khi dùng refresh trên trình duyệt.

## Các lệnh

| Lệnh | Công việc |
| --- | --- |
| `npm run dev` | Chạy TypeScript và tự khởi động lại khi sửa code |
| `npm run build` | Tạo Prisma Client rồi biên dịch TypeScript sang dist |
| `npm start` | Chạy bản JavaScript đã build |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run db:generate` | Tạo lại Prisma Client |
| `npm run db:migrate -- --name ten_thay_doi` | Tạo/ap dụng migration khi đã có model và database development phù hợp |

## Các file còn lại

- package.json: thư viện và các lệnh phía trên.
- package-lock.json: khóa phiên bản dependency.
- tsconfig.json: cấu hình TypeScript.
- .env: cấu hình trên máy bạn; Git bỏ qua file này.
- .env.example: mẫu cấu hình.
- .gitignore: những file Git bỏ qua.
- .nvmrc: phiên bản Node dùng cho dự án.
- compose.yaml: PostgreSQL Docker tùy chọn.
- .github/workflows/ci.yml: GitHub tự cài dependency và build khi push/PR.
- node_modules: thư viện npm cài; không sửa trực tiếp.
- dist: JavaScript sau build; không sửa trực tiếp.

CI hiện chỉ kiểm tra build, chưa có tự động deploy (CD).

## Học tiếp theo từng bước

1. Chạy và hiểu API GET /.
2. Thêm một route đơn giản tự trả JSON.
3. CRUD PracticeUser và tách route/service.
4. Model, migration và module User.
5. Xác minh JWT cho `GET /api/v1/users/me`.
6. Hash mật khẩu, đăng ký, xác thực email và đăng nhập.
7. Sau đó: refresh token, logout, phân quyền và các lớp bảo vệ khác.
