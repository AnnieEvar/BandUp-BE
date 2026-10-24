# BandUp — Express + TypeScript + Prisma

Đây là backend Express + TypeScript + Prisma cho BandUp, được xây theo từng
bước học tập. Dự án hiện có model User, migration PostgreSQL, module lấy hồ sơ
người dùng, middleware xác minh JWT access token, error handler, Docker Compose
tùy chọn và CI kiểm tra build. Đăng ký, đăng nhập, refresh token và logout chưa
được triển khai.

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
3. Điền DATABASE_URL theo PostgreSQL của bạn.
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
6. Tiếp theo: hash mật khẩu, đăng ký và đăng nhập.
7. Sau đó: refresh token, logout, phân quyền và các lớp bảo vệ khác.
