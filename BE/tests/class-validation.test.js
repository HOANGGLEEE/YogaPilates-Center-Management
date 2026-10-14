const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dateTime, resourcePayload, sessionPayload, positiveId } = require('../services/class-validation');
test('class timestamps reject impossible dates and compare full intervals', () => {
    assert.equal(dateTime('2026-10-20T07:30'), '2026-10-20 07:30:00');
    for (const value of ['2026-02-30T07:30', '2026-10-20T25:00', 'garbage'])
        assert.throws(() => dateTime(value));
    const input = { TenBuoi: ' Hatha ', LoaiLopID: 1, PhongTapID: 2, PTID: 3, SucChua: 12, BatDau: '2026-10-20T07:30', KetThuc: '2026-10-20T08:30', TrangThai: 'PUBLISHED' };
    assert.equal(sessionPayload(input).TenBuoi, 'Hatha');
    assert.throws(() => sessionPayload({ ...input, KetThuc: input.BatDau }));
    assert.throws(() => sessionPayload({ ...input, TrangThai: 'COMPLETED' }));
    assert.throws(() => sessionPayload({ ...input, SucChua: 0 }));
});
test('resource payload maps actual benefits and excludes unknown fields', () => {
    assert.deepEqual(resourcePayload('types', { TenLoai: 'Pilates', LoaiHinh: 'PILATES', TrangThai: 'ACTIVE', MaQuyenLoi: 'FAKE' }), { TenLoai: 'Pilates', LoaiHinh: 'PILATES', MaQuyenLoi: 'GROUP_X', MoTa: null, TrangThai: 'ACTIVE' });
    assert.throws(() => resourcePayload('rooms', { TenPhong: 'Studio', SucChua: -1, TrangThai: 'ACTIVE' }));
    for (const id of [0, -1, 1.5, 'invalid'])
        assert.throws(() => positiveId(id));
});
