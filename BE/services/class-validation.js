const invalid = () => { throw Object.assign(new Error('Thông tin lớp học không hợp lệ.'), { status: 400, code: 'INVALID_INPUT' }); };
const positiveId = value => { const n = Number(value); if (!Number.isSafeInteger(n) || n <= 0)
    invalid(); return n; };
const text = (value, max, optional = false) => { if (optional && (value == null || value === ''))
    return null; if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    invalid(); return value.trim(); };
const status = value => { if (!['ACTIVE', 'INACTIVE'].includes(value))
    invalid(); return value; };
function dateTime(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/.test(value))
        invalid();
    const normalized = value.replace('T', ' ') + (value.length === 16 ? ':00' : '');
    const d = new Date(normalized.replace(' ', 'T') + 'Z');
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 19) !== normalized.replace(' ', 'T'))
        invalid();
    return normalized;
}
function resourcePayload(kind, body) {
    const MoTa = text(body.MoTa, 500, true), TrangThai = status(body.TrangThai);
    if (kind === 'rooms')
        return { TenPhong: text(body.TenPhong, 100), SucChua: positiveId(body.SucChua), MoTa, TrangThai };
    if (!['YOGA', 'PILATES'].includes(body.LoaiHinh))
        invalid();
    return { TenLoai: text(body.TenLoai, 100), LoaiHinh: body.LoaiHinh, MaQuyenLoi: body.LoaiHinh === 'YOGA' ? 'YOGA' : 'GROUP_X', MoTa, TrangThai };
}
function sessionPayload(body) {
    const BatDau = dateTime(body.BatDau), KetThuc = dateTime(body.KetThuc);
    if (KetThuc <= BatDau || !['DRAFT', 'PUBLISHED'].includes(body.TrangThai))
        invalid();
    return { TenBuoi: text(body.TenBuoi, 150), LoaiLopID: positiveId(body.LoaiLopID), PhongTapID: positiveId(body.PhongTapID), PTID: positiveId(body.PTID), SucChua: positiveId(body.SucChua), BatDau, KetThuc, GhiChu: text(body.GhiChu, 500, true), TrangThai: body.TrangThai };
}
module.exports = { positiveId, resourcePayload, sessionPayload, dateTime };
