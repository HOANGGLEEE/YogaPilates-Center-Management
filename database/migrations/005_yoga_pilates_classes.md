# Quản lý lớp Yoga & Pilates — hợp đồng triển khai

## SQL cần chạy trước

Migration đã áp dụng ngày 14/10/2026 vào database `gym_management` trên máy người dùng bằng cấu hình dự án hiện có. Đã lưu bản sao 31 bảng ngoài Git trước khi chạy, xác nhận 5 bảng mới dùng InnoDB và số dòng các bảng cũ không đổi. Không chạy lại trên database này. Các môi trường khác vẫn phải kiểm tra trước theo các bước dưới đây.

1. Chọn database thực tế trong `DB_NAME`, sao lưu trước khi chạy DDL.
2. Chạy `005_yoga_pilates_classes_preflight.sql` và kiểm tra kết quả: MySQL từ 8.0.16, bảng tham chiếu InnoDB, ID kiểu INT signed. Nếu đã có bảng lớp học thì đối chiếu thay vì chạy lại. Với server phân biệt hoa/thường, tên bảng tham chiếu phải khớp database thật.
3. Chạy `005_yoga_pilates_classes.sql` đúng một lần. File chỉ thêm 5 bảng và kiểm tra kết quả, không thêm dữ liệu mẫu hoặc sửa bản ghi nghiệp vụ cũ.
4. DDL MySQL tự commit. Không dùng `ROLLBACK` để giả định có thể hoàn tác migration; không xóa bảng nếu đã có dữ liệu lớp học.

## Nghiệp vụ đã triển khai

- Admin quản lý phòng, sức chứa và loại lớp. Dùng hồ sơ `PT` hiện có cho người hướng dẫn; giữ lịch 1-1 riêng.
- Admin tạo buổi học cụ thể, chọn loại lớp, phòng, hướng dẫn viên, thời gian và sức chứa. Nháp chưa xuất hiện cho hội viên; công bố mới cho phép đăng ký.
- Backend kiểm tra sức chứa buổi không vượt sức chứa phòng, các tài nguyên hoạt động và thời gian hợp lệ. Giao dịch khóa phòng/hướng dẫn viên khi kiểm tra lịch để tránh hai yêu cầu đồng thời cùng chiếm một tài nguyên.
- Lịch lớp không trùng phòng hoặc hướng dẫn viên với lớp khác. Đối chiếu lịch PT để không cho đặt lịch 1-1 và lớp nhóm trùng nhau, kiểm tra từ cả hai luồng ghi dữ liệu.
- Hội viên đăng ký bằng danh tính đã xác thực, không tin `HoiVienID` từ client. Phải có gói đã thanh toán, bao phủ ngày buổi học và quyền lợi tương ứng: `YOGA` cho Yoga; `GROUP_X` cho Pilates nhóm.
- Khóa hội viên và buổi học trong transaction khi đăng ký; chống đăng ký trùng, vượt chỗ và trùng giờ với lớp/booking PT của chính hội viên. Hủy trước giờ bắt đầu trả chỗ; yêu cầu lặp lại không tạo nhiều bản ghi hoặc trả nhiều chỗ.
- Khi đã có đăng ký, giữ thời gian/phòng/hướng dẫn viên để không âm thầm đổi lịch của hội viên. Điều chỉnh sức chứa không được thấp hơn số đăng ký; hủy buổi cập nhật đăng ký và thông báo trong cùng transaction.
- Staff/Admin xem danh sách theo buổi và điểm danh người đã đăng ký. Tái sử dụng xác thực QR hiện có khi điểm danh bằng QR; không đồng nhất điểm danh lớp với check-in vào trung tâm. Một đăng ký chỉ có một bản ghi điểm danh.
- Website có mục Lớp học: phòng, loại lớp, lịch buổi và danh sách/điểm danh. Mobile có lịch lớp, số chỗ còn lại, đăng ký/hủy, lịch của tôi. Dữ liệu đi theo MySQL → backend → API → client; thay các lịch minh họa bằng dữ liệu thật.

## Giới hạn phiên bản đầu

Buổi học được tạo theo ngày giờ cụ thể. Chưa bổ sung lịch lặp tự động, danh sách chờ, phí hủy/no-show, thanh toán theo từng lớp hoặc quota 8 buổi/tháng. Không giả lập các tính năng này trên frontend. Quyền lợi mã `YOGA`/`GROUP_X` chỉ quyết định quyền tham gia; không đại diện cho một số lượt hữu hạn.

Quyền lợi có `SoLuong` khác NULL bị từ chối đăng ký tự động vì chưa có quy tắc về chu kỳ tính lượt. Quyền lợi Yoga/Pilates hiện tại đã kiểm tra đều không giới hạn lượt. Điểm danh lớp tách biệt check-in cổng, dùng mã QR/mã ngắn còn hiệu lực và chỉ cho phép từ 30 phút trước giờ học đến giờ kết thúc. Phòng/loại lớp đã có buổi công bố chưa kết thúc phải chờ kết thúc hoặc hủy buổi trước khi sửa. Danh sách trả về tối đa 500 buổi; cần phân trang khi vận hành vượt mức này.

## API và màn hình

- `GET /classes`: Admin/Staff xem lịch; hội viên chỉ thấy lớp công bố, chưa bắt đầu và tài nguyên hoạt động.
- `GET /classes/mine`: lịch của hội viên đang đăng nhập, không nhận ID tài khoản từ client.
- `POST /classes/:id/book`, `POST /classes/bookings/:id/cancel`: đăng ký/hủy trong transaction.
- `GET /classes/resources`, `POST/PUT /classes/rooms[/:id]`, `POST/PUT /classes/types[/:id]`: tài nguyên; chỉ Admin sửa.
- `POST /classes`, `PUT /classes/:id`, `POST /classes/:id/cancel`, `POST /classes/:id/complete`: lịch lớp, chỉ Admin sửa; hoàn thành sau giờ kết thúc.
- `GET /classes/:id/roster`, `POST /classes/:id/attendance`: Admin/Staff xem danh sách, điểm danh bằng `DangKyLopID` hoặc `code` QR/mã ngắn đã xác thực.
- Website: menu Lớp học, ba mục Buổi học/Phòng tập/Loại lớp và danh sách điểm danh.
- Mobile: `/classes`, Khám phá lớp/Lịch của tôi, lọc bộ môn/ngày, chi tiết, đăng ký/hủy. Trang chủ hiển thị 3 buổi sắp tới từ API. Chi tiết PT/thuê PT dùng nền kem, xanh trầm và nút hành động cố định.

## Chạy test mới

`node --test tests/class-validation.test.js` kiểm tra payload/ngày giờ. `RUN_CLASS_DB_TESTS=1 node --test tests/classes.integration.test.js` chạy với biến `DB_*` đã cấu hình: tạo schema `yoga_classes_test_<timestamp>` riêng, sao chép cấu trúc (không sao chép dữ liệu), tạo fixture, kiểm tra nghiệp vụ rồi xóa schema thử nghiệm. Yêu cầu quyền tạo schema test. Không chạy toàn bộ các test DB cũ lên dữ liệu đang sử dụng.

## Kiểm tra bắt buộc khi triển khai

Kiểm tra phân quyền/ownership, quyền lợi và gói hết hạn/chưa thanh toán; hết chỗ và hai yêu cầu tranh chỗ cuối; đăng ký/hủy lặp; trùng lịch phòng/hướng dẫn viên/hội viên, bao gồm PT; hủy sau điểm danh; transaction rollback và đọc lại sau reload. Chạy build Website, export Mobile và các regression về membership, thanh toán, PT, QR hiện có.
