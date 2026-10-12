# Yoga & Pilates Center Management

Hệ thống quản lý trung tâm Yoga & Pilates với giao diện quản trị Website, ứng dụng hội viên Mobile và API MySQL trong BE.

Quản lý hội viên, gói tập, hướng dẫn cá nhân 1-1, lịch hướng dẫn, QR check-in, thanh toán, sản phẩm, kho hàng và báo cáo bằng các API hiện có.

## Chạy dự án

- BE: sao chép `.env.example` thành `.env`, cấu hình MySQL rồi chạy `npm ci` và `npm start`.
- Website: `npm ci`, `npm run dev`; kiểm tra bằng `npm run build` và `npm run lint`.
- Mobile: `npm ci`, `npm start`; kiểm tra bằng `npx tsc --noEmit` và `npm run lint`.

## Thiết kế và dữ liệu

Giao diện dùng nền xanh rừng, điểm nhấn sage, cát ấm và hình ảnh Yoga. Các lịch lớp học tĩnh trên trang chủ được đánh dấu minh họa; chưa có API đặt chỗ lớp nhóm.

Tên bảng, trường API, mã quyền lợi, khóa phiên đăng nhập, mã chuyển khoản và Android application ID được giữ tương thích. Chức năng hướng dẫn 1-1 sử dụng API PT hiện có.

`database/seeds/package_details_seed.sql` chứa nội dung Yoga & Pilates cho dữ liệu mẫu. Chỉ dùng trong cơ sở dữ liệu thử nghiệm sau khi kiểm tra ID gói; seed có thể ghi đè quyền lợi. Không chạy trên dữ liệu thật. Dữ liệu hội viên, sản phẩm và gói hiện có vẫn do backend quản lý; chỉnh nội dung qua màn hình quản trị theo dịch vụ thực tế của trung tâm.
