
# 🧘 YogaPilates-Center-Management

## Hệ thống quản lý trung tâm Yoga/Pilates kết hợp bán sản phẩm tập luyện

`YogaPilates-Center-Management` là đồ án xây dựng hệ thống quản lý trung tâm Yoga/Pilates theo mô hình đa nền tảng, bao gồm ứng dụng Mobile dành cho học viên, Website quản trị dành cho nhân viên và quản trị viên, Backend REST API và cơ sở dữ liệu MySQL.

Hệ thống hỗ trợ các nghiệp vụ chính như quản lý học viên, gói tập, giáo viên/PT, lịch tập, check-in, sản phẩm, giỏ hàng, đơn hàng, kho hàng, thanh toán, khuyến mãi, thông báo và báo cáo thống kê.

---

## 📌 Mục tiêu đề tài

Đề tài hướng tới xây dựng một hệ thống hỗ trợ số hóa các hoạt động quản lý tại trung tâm Yoga/Pilates, giúp học viên thuận tiện trong việc đăng ký và sử dụng các dịch vụ tập luyện, đồng thời hỗ trợ nhân viên và quản trị viên quản lý dữ liệu tập trung.

Hệ thống được xây dựng theo kiến trúc:

```text
Mobile App
React Native + Expo
        │
        │ REST API
        ▼
Backend
Node.js + Express
        │
        ▼
MySQL Database
        ▲
        │ REST API
        │
Website Admin
React + TypeScript + Vite