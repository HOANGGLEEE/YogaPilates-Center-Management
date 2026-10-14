const db = require('../common/db');
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
async function transaction(work) {
    const c = await db.promise().getConnection();
    try {
        await c.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
        await c.beginTransaction();
        const result = await work(c);
        await c.commit();
        return result;
    }
    catch (error) {
        await c.rollback();
        throw error;
    }
    finally {
        c.release();
    }
}
const select = `SELECT b.*, b.BatDau>NOW() IsFuture, DATE_FORMAT(b.BatDau,'%Y-%m-%d %H:%i:%s') BatDau,
  DATE_FORMAT(b.KetThuc,'%Y-%m-%d %H:%i:%s') KetThuc, l.TenLoai,l.LoaiHinh,l.MoTa,p.TenPhong,t.HoTen HoTenPT,t.AnhDaiDien,
  (SELECT COUNT(*) FROM dangkylop d WHERE d.BuoiHocID=b.BuoiHocID AND d.TrangThai='BOOKED') DaDangKy
  FROM buoihoc b JOIN loailop l ON l.LoaiLopID=b.LoaiLopID JOIN phongtap p ON p.PhongTapID=b.PhongTapID JOIN pt t ON t.PTID=b.PTID`;
async function member(c, accountId) {
    const [rows] = await c.query(`SELECT h.HoiVienID FROM hoivien h JOIN taikhoan t ON t.TaiKhoanID=h.TaiKhoanID
    WHERE h.TaiKhoanID=? AND h.TrangThai='ACTIVE' AND t.TrangThai='ACTIVE' AND t.VaiTro='CUSTOMER' FOR UPDATE`, [accountId]);
    if (!rows.length)
        fail(403, 'MEMBER_INACTIVE', 'Hồ sơ hội viên không hoạt động.');
    return rows[0].HoiVienID;
}
async function lockedSession(c, id) {
    const [rows] = await c.query(`SELECT *, BatDau>NOW() IsFuture, NOW() BETWEEN DATE_SUB(BatDau, INTERVAL 30 MINUTE) AND KetThuc CanAttend,
    DATE_FORMAT(BatDau,'%Y-%m-%d %H:%i:%s') BatDau, DATE_FORMAT(KetThuc,'%Y-%m-%d %H:%i:%s') KetThuc FROM buoihoc WHERE BuoiHocID=? FOR UPDATE`, [id]);
    if (!rows.length)
        fail(404, 'CLASS_NOT_FOUND', 'Không tìm thấy buổi học.');
    return rows[0];
}
async function lockPT(c, id) {
    const [rows] = await c.query('SELECT PTID,TrangThai FROM pt WHERE PTID=? FOR UPDATE', [id]);
    if (!rows.length || rows[0].TrangThai !== 'ACTIVE')
        fail(409, 'PT_INACTIVE', 'Hướng dẫn viên không hoạt động.');
}
async function checkMemberOverlap(c, memberId, start, end, exclude = 0) {
    const [classes] = await c.query(`SELECT d.DangKyLopID FROM dangkylop d JOIN buoihoc b ON b.BuoiHocID=d.BuoiHocID
    WHERE d.HoiVienID=? AND d.TrangThai='BOOKED' AND b.TrangThai='PUBLISHED' AND b.BatDau<? AND b.KetThuc>? AND b.BuoiHocID<>? LIMIT 1 FOR UPDATE`, [memberId, end, start, exclude]);
    const [pt] = await c.query(`SELECT t.ThuePTID FROM thuept t JOIN lichpt l ON l.LichPTID=t.LichPTID
    WHERE t.HoiVienID=? AND t.TrangThai IN ('PENDING','CONFIRMED') AND TIMESTAMP(l.NgayLam,l.GioBatDau)<? AND TIMESTAMP(l.NgayLam,l.GioKetThuc)>? LIMIT 1 FOR UPDATE`, [memberId, end, start]);
    if (classes.length || pt.length)
        fail(409, 'MEMBER_OVERLAP', 'Bạn đã có lịch tập trong khoảng thời gian này.');
}
const Classes = {
    lockPT, checkMemberOverlap,
    async list(admin) {
        const [rows] = await db.promise().query(`${select} ${admin ? '' : "WHERE b.TrangThai='PUBLISHED' AND b.BatDau>NOW() AND l.TrangThai='ACTIVE' AND p.TrangThai='ACTIVE' AND t.TrangThai='ACTIVE'"} ORDER BY b.BatDau ${admin ? 'DESC' : 'ASC'} LIMIT 500`);
        return rows;
    },
    async resources() {
        const q = db.promise();
        const [[rooms], [types], [trainers]] = await Promise.all([q.query('SELECT * FROM phongtap ORDER BY TenPhong'), q.query('SELECT * FROM loailop ORDER BY TenLoai'), q.query("SELECT PTID,HoTen FROM pt WHERE TrangThai='ACTIVE' ORDER BY HoTen")]);
        return { rooms, types, trainers };
    },
    async saveResource(kind, id, data) {
        return transaction(async (c) => {
            const table = kind === 'rooms' ? 'phongtap' : 'loailop';
            const key = kind === 'rooms' ? 'PhongTapID' : 'LoaiLopID';
            if (id) {
                const [rows] = await c.query(`SELECT * FROM ${table} WHERE ${key}=? FOR UPDATE`, [id]);
                if (!rows.length)
                    fail(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu.');
                const [scheduled] = await c.query(`SELECT BuoiHocID FROM buoihoc WHERE ${key}=? AND TrangThai='PUBLISHED' AND KetThuc>NOW() LIMIT 1`, [id]);
                if (scheduled.length)
                    fail(409, 'RESOURCE_IN_USE', 'Chỉ sửa phòng hoặc loại lớp sau khi các buổi đã công bố kết thúc hoặc được hủy.');
                await c.query(`UPDATE ${table} SET ? WHERE ${key}=?`, [data, id]);
                return { id };
            }
            const [r] = await c.query(`INSERT INTO ${table} SET ?`, data);
            return { id: r.insertId };
        });
    },
    async saveSession(id, data, accountId) {
        return transaction(async (c) => {
            await lockPT(c, data.PTID);
            const [rooms] = await c.query('SELECT * FROM phongtap WHERE PhongTapID=? FOR UPDATE', [data.PhongTapID]);
            const [types] = await c.query('SELECT * FROM loailop WHERE LoaiLopID=? FOR UPDATE', [data.LoaiLopID]);
            if (!rooms.length || !types.length || rooms[0].TrangThai !== 'ACTIVE' || types[0].TrangThai !== 'ACTIVE')
                fail(409, 'RESOURCE_INACTIVE', 'Phòng và loại lớp phải đang hoạt động.');
            if (data.SucChua > rooms[0].SucChua)
                fail(400, 'CAPACITY_INVALID', 'Sức chứa buổi học vượt sức chứa phòng.');
            const [time] = await c.query('SELECT ?>NOW() IsFuture', [data.BatDau]);
            if (!time[0].IsFuture)
                fail(409, 'CLASS_STARTED', 'Chỉ tạo hoặc sửa buổi học chưa bắt đầu.');
            if (id) {
                const old = await lockedSession(c, id);
                if (!['DRAFT', 'PUBLISHED'].includes(old.TrangThai))
                    fail(409, 'CLASS_LOCKED', 'Buổi học đã hủy hoặc hoàn thành.');
                const [bookings] = await c.query("SELECT DangKyLopID FROM dangkylop WHERE BuoiHocID=? AND TrangThai='BOOKED'", [id]);
                if (bookings.length && (data.BatDau !== old.BatDau || data.KetThuc !== old.KetThuc || data.PTID !== old.PTID || data.PhongTapID !== old.PhongTapID || data.LoaiLopID !== old.LoaiLopID || data.TrangThai !== 'PUBLISHED' || data.SucChua < bookings.length))
                    fail(409, 'CLASS_HAS_BOOKINGS', 'Buổi có hội viên chỉ được sửa tên, ghi chú hoặc tăng sức chứa.');
            }
            if (data.TrangThai === 'PUBLISHED') {
                const [conflict] = await c.query(`SELECT BuoiHocID FROM buoihoc WHERE TrangThai='PUBLISHED' AND (PhongTapID=? OR PTID=?) AND BatDau<? AND KetThuc>? AND BuoiHocID<>? LIMIT 1 FOR UPDATE`, [data.PhongTapID, data.PTID, data.KetThuc, data.BatDau, id || 0]);
                const [pt] = await c.query(`SELECT LichPTID FROM lichpt WHERE PTID=? AND TrangThai<>'OFF' AND TIMESTAMP(NgayLam,GioBatDau)<? AND TIMESTAMP(NgayLam,GioKetThuc)>? LIMIT 1 FOR UPDATE`, [data.PTID, data.KetThuc, data.BatDau]);
                if (conflict.length || pt.length)
                    fail(409, 'CLASS_OVERLAP', 'Phòng hoặc hướng dẫn viên trùng lịch. Kiểm tra cả lịch hướng dẫn 1–1.');
            }
            if (id) {
                await c.query('UPDATE buoihoc SET ? WHERE BuoiHocID=?', [data, id]);
                return { id };
            }
            const [r] = await c.query('INSERT INTO buoihoc SET ?', { ...data, TaoBoi: accountId });
            return { id: r.insertId };
        });
    },
    async book(id, accountId) {
        return transaction(async (c) => {
            const memberId = await member(c, accountId);
            const [initial] = await c.query('SELECT PTID FROM buoihoc WHERE BuoiHocID=?', [id]);
            if (!initial.length)
                fail(404, 'CLASS_NOT_FOUND', 'Không tìm thấy buổi học.');
            await lockPT(c, initial[0].PTID);
            const b = await lockedSession(c, id);
            if (b.PTID !== initial[0].PTID)
                fail(409, 'CLASS_CHANGED', 'Lịch lớp vừa thay đổi. Vui lòng tải lại.');
            if (!b.IsFuture || b.TrangThai !== 'PUBLISHED')
                fail(409, 'CLASS_UNAVAILABLE', 'Buổi học không còn nhận đăng ký.');
            const [resource] = await c.query(`SELECT l.MaQuyenLoi FROM loailop l JOIN phongtap p ON p.PhongTapID=? WHERE l.LoaiLopID=? AND l.TrangThai='ACTIVE' AND p.TrangThai='ACTIVE'`, [b.PhongTapID, b.LoaiLopID]);
            if (!resource.length)
                fail(409, 'CLASS_UNAVAILABLE', 'Phòng hoặc loại lớp đã ngừng hoạt động.');
            const [existing] = await c.query('SELECT * FROM dangkylop WHERE BuoiHocID=? AND HoiVienID=? FOR UPDATE', [id, memberId]);
            if (existing[0]?.TrangThai === 'BOOKED')
                return { id: existing[0].DangKyLopID, alreadyBooked: true };
            const [paid] = await c.query(`SELECT d.DangKyID,q.SoLuong FROM dangkygoitap d JOIN quyenloigoitap q ON q.GoiTapID=d.GoiTapID
        WHERE d.HoiVienID=? AND d.TrangThai='ACTIVE' AND d.NgayBatDau<=DATE(?) AND d.NgayKetThuc>=DATE(?)
        AND q.MaQuyenLoi=? AND q.TrangThai='ACTIVE' AND EXISTS(SELECT 1 FROM thanhtoan t WHERE t.DangKyID=d.DangKyID AND t.TrangThai='SUCCESS')
        ORDER BY (q.SoLuong IS NULL) DESC,d.DangKyID DESC LIMIT 1 FOR UPDATE`, [memberId, b.BatDau, b.KetThuc, resource[0].MaQuyenLoi]);
            if (!paid.length)
                fail(403, 'MEMBERSHIP_REQUIRED', 'Bạn cần gói tập đã thanh toán, có quyền lợi lớp này và còn hạn vào ngày học.');
            // shortcut: finite benefit units have no period contract; refuse until that business rule is defined.
            if (paid[0].SoLuong !== null)
                fail(409, 'BENEFIT_LIMIT_UNDEFINED', 'Quyền lợi có giới hạn lượt cần được trung tâm xác nhận trước khi đăng ký.');
            const [count] = await c.query("SELECT COUNT(*) n FROM dangkylop WHERE BuoiHocID=? AND TrangThai='BOOKED'", [id]);
            if (count[0].n >= b.SucChua)
                fail(409, 'CLASS_FULL', 'Lớp đã đủ số lượng hội viên.');
            await checkMemberOverlap(c, memberId, b.BatDau, b.KetThuc, id);
            if (existing.length) {
                await c.query("UPDATE dangkylop SET TrangThai='BOOKED',DangKyID=?,DangKyLuc=NOW(),HuyLuc=NULL WHERE DangKyLopID=?", [paid[0].DangKyID, existing[0].DangKyLopID]);
                return { id: existing[0].DangKyLopID };
            }
            const [r] = await c.query('INSERT INTO dangkylop SET ?', { BuoiHocID: id, HoiVienID: memberId, DangKyID: paid[0].DangKyID });
            return { id: r.insertId };
        });
    },
    async mine(accountId) {
        const withBooking = select.replace('SELECT b.*', "SELECT d.DangKyLopID,d.TrangThai DangKyTrangThai,DATE_FORMAT(a.DiemDanhLuc,'%Y-%m-%d %H:%i:%s') DiemDanhLuc,b.*");
        const [rows] = await db.promise().query(`${withBooking} JOIN dangkylop d ON d.BuoiHocID=b.BuoiHocID JOIN hoivien h ON h.HoiVienID=d.HoiVienID
      LEFT JOIN diemdanhlop a ON a.DangKyLopID=d.DangKyLopID WHERE h.TaiKhoanID=? ORDER BY b.BatDau DESC LIMIT 500`, [accountId]);
        return rows;
    },
    async cancelBooking(id, accountId) {
        return transaction(async (c) => {
            const memberId = await member(c, accountId);
            const [refs] = await c.query('SELECT BuoiHocID FROM dangkylop WHERE DangKyLopID=? AND HoiVienID=?', [id, memberId]);
            if (!refs.length)
                fail(404, 'BOOKING_NOT_FOUND', 'Không tìm thấy đăng ký của bạn.');
            const b = await lockedSession(c, refs[0].BuoiHocID);
            const [rows] = await c.query('SELECT * FROM dangkylop WHERE DangKyLopID=? FOR UPDATE', [id]);
            if (rows[0].TrangThai === 'CANCELLED')
                return { id };
            const [attendance] = await c.query('SELECT 1 FROM diemdanhlop WHERE DangKyLopID=?', [id]);
            if (!b.IsFuture || attendance.length)
                fail(409, 'CANCEL_NOT_ALLOWED', 'Không thể hủy sau khi buổi học bắt đầu hoặc đã điểm danh.');
            await c.query("UPDATE dangkylop SET TrangThai='CANCELLED',HuyLuc=NOW() WHERE DangKyLopID=?", [id]);
            return { id };
        });
    },
    async cancelSession(id) {
        return transaction(async (c) => {
            const b = await lockedSession(c, id);
            if (b.TrangThai === 'CANCELLED')
                return { id };
            const [attendance] = await c.query('SELECT 1 FROM diemdanhlop a JOIN dangkylop d ON d.DangKyLopID=a.DangKyLopID WHERE d.BuoiHocID=? LIMIT 1', [id]);
            if (!b.IsFuture || attendance.length)
                fail(409, 'CANCEL_NOT_ALLOWED', 'Chỉ hủy lớp chưa bắt đầu và chưa điểm danh.');
            await c.query(`INSERT INTO thongbao (TaiKhoanID,Loai,DanhMuc,TieuDe,NoiDung)
        SELECT h.TaiKhoanID,'SYSTEM','SYSTEM','Buổi học đã hủy',? FROM dangkylop d JOIN hoivien h ON h.HoiVienID=d.HoiVienID WHERE d.BuoiHocID=? AND d.TrangThai='BOOKED'`, [`Buổi ${b.TenBuoi} lúc ${b.BatDau} đã được trung tâm hủy.`, id]);
            await c.query("UPDATE dangkylop SET TrangThai='CANCELLED',HuyLuc=NOW() WHERE BuoiHocID=? AND TrangThai='BOOKED'", [id]);
            await c.query("UPDATE buoihoc SET TrangThai='CANCELLED' WHERE BuoiHocID=?", [id]);
            return { id };
        });
    },
    async roster(id) {
        const [rows] = await db.promise().query(`SELECT d.DangKyLopID,d.HoiVienID,h.HoTen,h.SoDienThoai,d.TrangThai,
      DATE_FORMAT(a.DiemDanhLuc,'%Y-%m-%d %H:%i:%s') DiemDanhLuc FROM dangkylop d JOIN hoivien h ON h.HoiVienID=d.HoiVienID
      LEFT JOIN diemdanhlop a ON a.DangKyLopID=d.DangKyLopID WHERE d.BuoiHocID=? ORDER BY h.HoTen`, [id]);
        return rows;
    },
    async complete(id) {
        return transaction(async (c) => {
            const b = await lockedSession(c, id);
            if (b.TrangThai === 'COMPLETED')
                return { id };
            const [time] = await c.query('SELECT ?<=NOW() HasEnded', [b.KetThuc]);
            if (b.TrangThai !== 'PUBLISHED' || !time[0].HasEnded)
                fail(409, 'CLASS_NOT_ENDED', 'Chỉ hoàn thành buổi đã công bố và đã kết thúc.');
            await c.query("UPDATE buoihoc SET TrangThai='COMPLETED' WHERE BuoiHocID=?", [id]);
            return { id };
        });
    },
    async attend(id, bookingId, accountId, qr) {
        return transaction(async (c) => {
            const b = await lockedSession(c, id);
            if (b.TrangThai !== 'PUBLISHED' || !b.CanAttend)
                fail(409, 'ATTENDANCE_CLOSED', 'Điểm danh từ 30 phút trước giờ học đến khi buổi học kết thúc.');
            const [rows] = await c.query(`SELECT * FROM dangkylop WHERE BuoiHocID=? AND ${qr ? 'HoiVienID' : 'DangKyLopID'}=? AND TrangThai='BOOKED' FOR UPDATE`, [id, qr ? qr.HoiVienID : bookingId]);
            if (!rows.length)
                fail(404, 'BOOKING_NOT_FOUND', 'Hội viên chưa đăng ký hoặc đã hủy lớp.');
            const [eligible] = await c.query(`SELECT 1 FROM hoivien h JOIN taikhoan t ON t.TaiKhoanID=h.TaiKhoanID JOIN dangkygoitap d ON d.HoiVienID=h.HoiVienID
        WHERE h.HoiVienID=? AND d.DangKyID=? AND h.TrangThai='ACTIVE' AND t.TrangThai='ACTIVE' AND d.TrangThai='ACTIVE'
        AND d.NgayBatDau<=DATE(?) AND d.NgayKetThuc>=DATE(?) AND EXISTS(SELECT 1 FROM thanhtoan paid WHERE paid.DangKyID=d.DangKyID AND paid.TrangThai='SUCCESS')`, [rows[0].HoiVienID, rows[0].DangKyID, b.BatDau, b.KetThuc]);
            if (!eligible.length)
                fail(403, 'MEMBERSHIP_REQUIRED', 'Hội viên hoặc gói tập không còn đủ điều kiện điểm danh.');
            if (qr) {
                const [tokens] = await c.query("SELECT 1 FROM maqr WHERE MaCode=? AND TrangThai='ACTIVE' AND NgayHetHan>NOW() FOR UPDATE", [qr.token]);
                if (!tokens.length)
                    fail(403, 'QR_INVALID', 'Mã QR không còn hiệu lực.');
            }
            const [existing] = await c.query('SELECT DiemDanhLopID FROM diemdanhlop WHERE DangKyLopID=?', [rows[0].DangKyLopID]);
            if (existing.length)
                return { id: existing[0].DiemDanhLopID, alreadyAttended: true };
            const [r] = await c.query('INSERT INTO diemdanhlop SET ?', { DangKyLopID: rows[0].DangKyLopID, DiemDanhBoi: accountId, Nguon: qr ? 'QR' : 'MANUAL' });
            return { id: r.insertId };
        });
    },
};
module.exports = Classes;
