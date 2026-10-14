const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
test('class lifecycle and concurrency on an isolated MySQL schema', { skip: process.env.RUN_CLASS_DB_TESTS !== '1' }, async (t) => {
    const options = { host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD };
    const source = process.env.DB_NAME;
    const name = 'yoga_classes_test_' + Date.now();
    assert.match(name, /^yoga_classes_test_\d+$/);
    const c = await mysql.createConnection({ ...options, database: source });
    let pool, server;
    try {
        const [tables] = await c.query('SHOW FULL TABLES WHERE Table_type="BASE TABLE"');
        const ddl = [];
        for (const table of tables) {
            const n = Object.values(table)[0];
            const [r] = await c.query('SHOW CREATE TABLE `' + n.replaceAll('`', '``') + '`');
            ddl.push(r[0]['Create Table']);
        }
        await c.query('CREATE DATABASE `' + name + '` CHARACTER SET utf8mb4');
        await c.query('USE `' + name + '`');
        await c.query('SET FOREIGN_KEY_CHECKS=0');
        for (const sql of ddl)
            await c.query(sql);
        await c.query('SET FOREIGN_KEY_CHECKS=1');
        process.env.DB_NAME = name;
        const Classes = require('../models/classes.model');
        const Lich = require('../models/lichpt.model');
        const Thue = require('../models/thuept.model');
        pool = require('../common/db');
        const insert = async (table, data) => (await c.query('INSERT INTO ' + table + ' SET ?', data))[0].insertId;
        const admin = await insert('taikhoan', { Email: 'admin@class.test', MatKhau: 'unused', VaiTro: 'ADMIN' });
        const staff = await insert('taikhoan', { Email: 'staff@class.test', MatKhau: 'unused', VaiTro: 'STAFF' });
        const accounts = [], members = [];
        for (let i = 0; i < 3; i++) {
            const id = await insert('taikhoan', { Email: `member${i}@class.test`, MatKhau: 'unused', VaiTro: 'CUSTOMER' });
            accounts.push(id);
            members.push(await insert('hoivien', { TaiKhoanID: id, HoTen: `Test ${i}` }));
        }
        const pt = await insert('pt', { HoTen: 'Instructor One', GiaThue: 200000 });
        const pt2 = await insert('pt', { HoTen: 'Instructor Two', GiaThue: 200000 });
        const pkg = await insert('goitap', { TenGoi: 'Test yoga', ThoiHan: 365, Gia: 100 });
        const duration = await insert('goitapthoihan', { GoiTapID: pkg, SoThang: 12 });
        await insert('quyenloigoitap', { GoiTapID: pkg, MaQuyenLoi: 'YOGA', TenQuyenLoi: 'Yoga' });
        const [{ startAt, endAt, date }] = (await c.query("SELECT DATE_FORMAT(DATE_ADD(CURDATE(),INTERVAL 10 DAY),'%Y-%m-%d 10:00:00') startAt, DATE_FORMAT(DATE_ADD(CURDATE(),INTERVAL 10 DAY),'%Y-%m-%d 11:00:00') endAt,DATE_FORMAT(DATE_ADD(CURDATE(),INTERVAL 10 DAY),'%Y-%m-%d') date"))[0];
        const registrations = [];
        for (const member of members) {
            const id = await insert('dangkygoitap', { HoiVienID: member, GoiTapID: pkg, GoiTapThoiHanID: duration, NgayBatDau: '2020-01-01', NgayKetThuc: '2099-12-31', TrangThai: 'ACTIVE' });
            registrations.push(id);
            if (member !== members[2])
                await insert('thanhtoan', { DangKyID: id, HoiVienID: member, SoTien: 100, PhuongThucThanhToan: 'TIEN_MAT', TrangThai: 'SUCCESS' });
        }
        const room = (await Classes.saveResource('rooms', null, { TenPhong: 'Room One', SucChua: 2, TrangThai: 'ACTIVE' })).id;
        const room2 = (await Classes.saveResource('rooms', null, { TenPhong: 'Room Two', SucChua: 2, TrangThai: 'ACTIVE' })).id;
        const type = (await Classes.saveResource('types', null, { TenLoai: 'Hatha', LoaiHinh: 'YOGA', MaQuyenLoi: 'YOGA', TrangThai: 'ACTIVE' })).id;
        const data = { LoaiLopID: type, PhongTapID: room, PTID: pt, TenBuoi: 'Morning yoga', BatDau: startAt, KetThuc: endAt, SucChua: 1, TrangThai: 'PUBLISHED' };
        const cls = (await Classes.saveSession(null, data, admin)).id;
        await t.test('room capacity and timetable collisions reject writes', async () => {
            await assert.rejects(Classes.saveSession(null, { ...data, SucChua: 3 }, admin), { code: 'CAPACITY_INVALID' });
            await assert.rejects(Classes.saveSession(null, { ...data, PTID: pt2 }, admin), { code: 'CLASS_OVERLAP' });
            await assert.rejects(Classes.saveSession(null, { ...data, PhongTapID: room2 }, admin), { code: 'CLASS_OVERLAP' });
            await assert.rejects(Classes.saveResource('rooms', room, { TenPhong: 'Room One', SucChua: 1, TrangThai: 'INACTIVE' }), { code: 'RESOURCE_IN_USE' });
        });
        let winner, loser, booking;
        await t.test('last seat cannot be sold twice; duplicate booking is idempotent', async () => {
            const results = await Promise.allSettled(accounts.slice(0, 2).map(id => Classes.book(cls, id)));
            assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
            const win = results.findIndex(r => r.status === 'fulfilled');
            winner = accounts[win];
            loser = accounts[1 - win];
            booking = results[win].value.id;
            assert.equal(results[1 - win].reason.code, 'CLASS_FULL');
            assert.equal((await Classes.book(cls, winner)).id, booking);
            assert.equal((await Classes.list(false))[0].DaDangKy, 1);
            assert.equal((await Classes.mine(winner))[0].DangKyTrangThai, 'BOOKED');
        });
        await t.test('payment, membership coverage and ownership enforced', async () => {
            await assert.rejects(Classes.book(cls, accounts[2]), { code: 'MEMBERSHIP_REQUIRED' });
            await insert('thanhtoan', { DangKyID: registrations[2], HoiVienID: members[2], SoTien: 100, PhuongThucThanhToan: 'TIEN_MAT', TrangThai: 'SUCCESS' });
            await c.query('UPDATE dangkygoitap SET NgayKetThuc=CURDATE() WHERE DangKyID=?', [registrations[2]]);
            await assert.rejects(Classes.book(cls, accounts[2]), { code: 'MEMBERSHIP_REQUIRED' });
            await c.query("UPDATE dangkygoitap SET NgayKetThuc='2099-12-31' WHERE DangKyID=?", [registrations[2]]);
            await c.query("UPDATE quyenloigoitap SET TrangThai='INACTIVE'");
            await assert.rejects(Classes.book(cls, accounts[2]), { code: 'MEMBERSHIP_REQUIRED' });
            await c.query("UPDATE quyenloigoitap SET TrangThai='ACTIVE',SoLuong=8");
            await assert.rejects(Classes.book(cls, accounts[2]), { code: 'BENEFIT_LIMIT_UNDEFINED' });
            await c.query('UPDATE quyenloigoitap SET SoLuong=NULL');
            await assert.rejects(Classes.cancelBooking(booking, loser), { code: 'BOOKING_NOT_FOUND' });
            await assert.rejects(Classes.saveSession(cls, { ...data, BatDau: startAt.replace('10:00:00', '09:00:00') }, admin), { code: 'CLASS_HAS_BOOKINGS' });
        });
        const other = (await Classes.saveSession(null, { ...data, PhongTapID: room2, PTID: pt2 }, admin)).id;
        await t.test('member cannot overlap classes; PT roster cannot overlap group class', async () => {
            await assert.rejects(Classes.book(other, winner), { code: 'MEMBER_OVERLAP' });
            const shift = { PTID: pt, NgayLam: date, GioBatDau: '10:00', GioKetThuc: '11:00', TrangThai: 'AVAILABLE' };
            await assert.rejects(new Promise((resolve, reject) => Lich.insert(shift, (e, r) => e ? reject(e) : resolve(r))), { code: 'SCHEDULE_OVERLAP' });
            await c.query("UPDATE buoihoc SET TrangThai='DRAFT' WHERE BuoiHocID=?", [other]);
            const ptShift = (await new Promise((resolve, reject) => Lich.insert({ ...shift, PTID: pt2 }, (e, r) => e ? reject(e) : resolve(r)))).LichPTID;
            await assert.rejects(new Promise((resolve, reject) => Thue.book({ TaiKhoanID: winner, LichPTID: ptShift }, (e, r) => e ? reject(e) : resolve(r))), { code: 'MEMBER_OVERLAP' });
            await assert.rejects(Classes.saveSession(other, { ...data, PhongTapID: room2, PTID: pt2 }, admin), { code: 'CLASS_OVERLAP' });
            assert.equal((await c.query('SELECT COUNT(*) n FROM thuept'))[0][0].n, 0);
        });
        await t.test('cancel is idempotent, releases seat, canceled class notifies member', async () => {
            await Classes.cancelBooking(booking, winner);
            await Classes.cancelBooking(booking, winner);
            await Classes.book(cls, loser);
            await Classes.cancelSession(cls);
            await Classes.cancelSession(cls);
            assert.equal((await Classes.mine(loser))[0].DangKyTrangThai, 'CANCELLED');
            assert.equal((await c.query('SELECT COUNT(*) n FROM thongbao'))[0][0].n, 1);
            await assert.rejects(Classes.book(cls, winner), { code: 'CLASS_UNAVAILABLE' });
        });
        await t.test('attendance is unique, has a time window and blocks cancellation', async () => {
            const b = (await Classes.saveSession(null, { ...data, TenBuoi: 'Attendance test' }, admin)).id;
            const d = (await Classes.book(b, winner)).id;
            await assert.rejects(Classes.attend(b, d, staff), { code: 'ATTENDANCE_CLOSED' });
            await c.query('UPDATE buoihoc SET BatDau=DATE_ADD(NOW(),INTERVAL 10 MINUTE),KetThuc=DATE_ADD(NOW(),INTERVAL 70 MINUTE) WHERE BuoiHocID=?', [b]);
            const a = await Classes.attend(b, d, staff);
            assert.equal((await Classes.attend(b, d, staff)).id, a.id);
            await assert.rejects(Classes.cancelBooking(d, winner), { code: 'CANCEL_NOT_ALLOWED' });
            await assert.rejects(Classes.cancelSession(b), { code: 'CANCEL_NOT_ALLOWED' });
            assert.equal((await Classes.roster(b))[0].DiemDanhLuc !== null, true);
            await c.query('UPDATE buoihoc SET SucChua=2 WHERE BuoiHocID=?', [b]);
            await Classes.book(b, loser);
            const idx = accounts.indexOf(loser);
            process.env.CHECKIN_TOKEN_SECRET = process.env.CHECKIN_TOKEN_SECRET || 'class-test-only-qr-secret';
            const now = Math.floor(Date.now() / 1000);
            const unsigned = 'v1.' + Buffer.from(JSON.stringify({ h: members[idx], d: registrations[idx], iat: now, exp: now + 45, jti: 'test-qr' })).toString('base64url');
            const token = unsigned + '.' + require('node:crypto').createHmac('sha256', process.env.CHECKIN_TOKEN_SECRET).update(unsigned).digest('base64url');
            const resolveCode = require('../controllers/checkin.controller').resolveCode;
            await assert.rejects(resolveCode(token + 'x'), { code: 'QR_SIGNATURE_INVALID' });
            const qr = await resolveCode(token);
            await insert('maqr', { MaCode: token, NgayHetHan: '2000-01-01 00:00:00' });
            await assert.rejects(Classes.attend(b, null, staff, qr), { code: 'QR_INVALID' });
            await c.query('UPDATE maqr SET NgayHetHan=DATE_ADD(NOW(),INTERVAL 1 MINUTE) WHERE MaCode=?', [token]);
            await Classes.attend(b, null, staff, qr);
            assert.equal((await c.query("SELECT COUNT(*) n FROM diemdanhlop WHERE Nguon='QR'"))[0][0].n, 1);
            await assert.rejects(Classes.complete(b), { code: 'CLASS_NOT_ENDED' });
            await c.query('UPDATE buoihoc SET BatDau=DATE_SUB(NOW(),INTERVAL 2 HOUR),KetThuc=DATE_SUB(NOW(),INTERVAL 1 HOUR) WHERE BuoiHocID=?', [b]);
            await Classes.complete(b);
            await Classes.complete(b);
        });
        await t.test('API roles and self ownership use server auth, not supplied account ids', async () => {
            const app = require('../app');
            const { signToken } = require('../middleware/auth');
            process.env.AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'test-only-secret-not-used-in-production';
            server = app.listen(0, '127.0.0.1');
            await new Promise(resolve => server.once('listening', resolve));
            const base = `http://127.0.0.1:${server.address().port}/classes`;
            const headers = { Authorization: 'Bearer ' + signToken({ TaiKhoanID: winner }), 'Content-Type': 'application/json' };
            assert.equal((await fetch(base)).status, 401);
            assert.equal((await fetch(base, { headers })).status, 200);
            assert.equal((await fetch(base + '/resources', { headers })).status, 403);
            assert.equal((await fetch(base, { method: 'POST', headers, body: '{}' })).status, 403);
            assert.equal((await fetch(base + '/mine', { headers })).status, 200);
            assert.equal((await fetch(base + '/' + cls + '/attendance', { method: 'POST', headers, body: '{}' })).status, 403);
            assert.equal((await fetch(base + '/' + cls + '/book', { method: 'POST', headers, body: JSON.stringify({ TaiKhoanID: loser }) })).status, 403);
        });
    }
    finally {
        if (server)
            await new Promise(resolve => server.close(resolve));
        if (pool)
            await pool.promise().end();
        process.env.DB_NAME = source;
        assert.match(name, /^yoga_classes_test_\d+$/);
        await c.query('DROP DATABASE IF EXISTS `' + name + '`');
        await c.end();
    }
});
