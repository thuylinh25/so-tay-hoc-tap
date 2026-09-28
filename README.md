# Sổ tay học tập

Web app cá nhân để đọc, tìm kiếm và theo dõi tiến độ học với kho tài liệu trong `Tài liệu học/`.
Next.js 16 + TypeScript + Tailwind CSS 4, xuất web tĩnh để host trên Cloudflare Pages.

## Chạy trên máy

```bash
npm install        # lần đầu
npm run dev        # http://localhost:3000
```

`npm run dev` và `npm run build` tự chạy `npm run content` trước, để quét lại `Tài liệu học/`.

## Nội dung được xử lý thế nào

- `Tài liệu học/` **chỉ được đọc**. Script `scripts/build-content.mjs` sinh ra:
  - `src/generated/manifest.json`: danh sách tài liệu, taxonomy, mục lục
  - `src/generated/html/*.html`: Markdown đã render sẵn, có tô màu code
  - `public/search-index.json`: chỉ mục tìm kiếm toàn văn, chia theo từng mục
  - `public/files/`: bản sao ảnh, PDF và trang HTML, đặt tên không dấu
- Taxonomy, tiêu đề, cấp độ, tài liệu liên quan và lộ trình khai báo trong `content.config.mjs`.
- Thêm tài liệu mới: chép vào `Tài liệu học/`, rồi chạy lại `npm run content`. File chưa khai báo vẫn hiện trong mục "Chưa phân loại" (script in cảnh báo); muốn xếp đúng chỗ thì thêm một dòng vào `content.config.mjs`.
- Text trong PDF lấy bằng `pdftotext` (có sẵn trong Git for Windows). Nếu máy không có công cụ này, PDF vẫn xem được, chỉ không tìm kiếm được nội dung.

## Dữ liệu cá nhân

Tiến độ, bookmark và ghi chú lưu trong `localStorage` của trình duyệt (`src/lib/store.ts`). Dữ liệu không đồng bộ giữa các máy. Xoá dữ liệu trình duyệt là mất.

## Deploy lên Cloudflare Pages (riêng tư)

1. Build và upload thẳng từ máy, không cần GitHub (tài liệu không bị đưa lên repo):
   ```bash
   npx wrangler@latest login     # lần đầu, mở trình duyệt để đăng nhập Cloudflare
   npm run deploy                # build + upload thư mục out/
   ```
   Địa chỉ web: `https://so-tay-hoc-tap.pages.dev` (project đã được tạo).

   > ⚠️ Nếu cần tạo lại project: phải tạo bằng `npx wrangler pages project create so-tay-hoc-tap --production-branch main --force` **trước** lần deploy đầu tiên. Không có `--force`, Wrangler 4.142+ sẽ chuyển sang Cloudflare Workers/OpenNext. Nó tự sửa `package.json` và `next.config.ts`, tạo thêm `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars`, `.open-next/`, rồi báo lỗi 500 khó hiểu.
2. Khoá bằng Cloudflare Access (miễn phí tới 50 người dùng):
   Cloudflare dashboard → **Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted**
   - Domain: `so-tay-hoc-tap.pages.dev`, thêm cả `*.so-tay-hoc-tap.pages.dev` để khoá luôn các bản preview
   - Policy: **Allow**, điều kiện **Emails** = email của bạn
   - Cách đăng nhập: **One-time PIN** (mã gửi qua email)

## Cấu trúc

```
content.config.mjs          taxonomy + metadata tài liệu + lộ trình
scripts/build-content.mjs   quét tài liệu → manifest, HTML, chỉ mục tìm kiếm
src/app/                    route: /, /library, /learn/[slug], /roadmaps, /bookmarks, /notes, …
src/components/reader/      trình đọc: Markdown, HTML nhúng, PDF, sổ tay ảnh, mục lục
src/lib/store.ts            tiến độ, bookmark, ghi chú (localStorage)
```

## Chưa làm

- Flashcards, Quiz, Luyện phỏng vấn, Ask AI (đang là trang "Sắp có")
- OCR cho 162 trang ảnh, để tìm kiếm được nội dung bên trong
