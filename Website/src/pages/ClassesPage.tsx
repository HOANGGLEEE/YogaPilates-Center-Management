import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../components/AdminLayout';
import { catalogRequest } from '../services/catalog';
import './ClassesPage.css';
type Room = {
    PhongTapID: number;
    TenPhong: string;
    SucChua: number;
    MoTa: string | null;
    TrangThai: string;
};
type ClassType = {
    LoaiLopID: number;
    TenLoai: string;
    LoaiHinh: string;
    MoTa: string | null;
    TrangThai: string;
};
type Session = {
    BuoiHocID: number;
    TenBuoi: string;
    LoaiLopID: number;
    PhongTapID: number;
    PTID: number;
    BatDau: string;
    KetThuc: string;
    SucChua: number;
    DaDangKy: number;
    GhiChu: string | null;
    TrangThai: string;
    TenPhong: string;
    HoTenPT: string;
    TenLoai: string;
};
type Resources = {
    rooms: Room[];
    types: ClassType[];
    trainers: {
        PTID: number;
        HoTen: string;
    }[];
};
type Attendee = {
    DangKyLopID: number;
    HoiVienID: number;
    HoTen: string;
    SoDienThoai: string | null;
    TrangThai: string;
    DiemDanhLuc: string | null;
};
type Editing = {
    kind: 'rooms';
    row?: Room;
} | {
    kind: 'types';
    row?: ClassType;
} | {
    kind: 'session';
    row?: Session;
};
const statusLabel = (value: string) => ({ ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động', DRAFT: 'Bản nháp', PUBLISHED: 'Đã công bố', CANCELLED: 'Đã hủy', COMPLETED: 'Đã kết thúc', BOOKED: 'Đã đăng ký' })[value] || value;
const localDate = (value: string) => new Date(value.replace(' ', 'T')).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export default function ClassesPage() {
    const [resources, setResources] = useState<Resources>({ rooms: [], types: [], trainers: [] });
    const [rows, setRows] = useState<Session[]>([]);
    const [tab, setTab] = useState('sessions');
    const [editing, setEditing] = useState<Editing | null>(null);
    const [roster, setRoster] = useState<{
        session: Session;
        rows: Attendee[];
    } | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('ALL');
    async function load(signal?: AbortSignal) {
        try {
            const [r, s] = await Promise.all([catalogRequest<Resources>('classes/resources', { signal }), catalogRequest<Session[]>('classes', { signal })]);
            if (signal?.aborted)
                return;
            setResources(r);
            setRows(s);
        }
        catch (e) {
            if (!signal?.aborted)
                setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
        }
        finally {
            if (!signal?.aborted)
                setLoading(false);
        }
    }
    useEffect(() => { const c = new AbortController(); void load(c.signal); return () => c.abort(); }, []);
    async function mutate(path: string, body?: unknown, method = 'POST') {
        setSaving(true);
        setError('');
        setNotice('');
        try {
            await catalogRequest(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
            await load();
            setNotice('Đã lưu thay đổi.');
            return true;
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Không lưu được thay đổi.');
            return false;
        }
        finally {
            setSaving(false);
        }
    }
    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editing || saving)
            return;
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const id = editing.row ? editing.kind === 'rooms' ? editing.row.PhongTapID : editing.kind === 'types' ? editing.row.LoaiLopID : editing.row.BuoiHocID : null;
        const path = editing.kind === 'session' ? 'classes' : `classes/${editing.kind}`;
        if (await mutate(`${path}${id ? `/${id}` : ''}`, data, id ? 'PUT' : 'POST'))
            setEditing(null);
    }
    async function openRoster(session: Session) {
        setError('');
        try {
            setRoster({ session, rows: await catalogRequest<Attendee[]>(`classes/${session.BuoiHocID}/roster`) });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Không tải được danh sách hội viên.');
        }
    }
    async function attend(body: unknown) {
        if (!roster || saving)
            return;
        if (await mutate(`classes/${roster.session.BuoiHocID}/attendance`, body))
            await openRoster(roster.session);
    }
    const filtered = rows.filter(r => filter === 'ALL' || r.TrangThai === filter);
    return <div className="classes-page">
    <header className="classes-heading"><div><small>YOGA & PILATES · VẬN HÀNH LỚP NHÓM</small><h1>Lớp học & lịch tập</h1><p>Quản lý phòng, hướng dẫn viên, chỗ trống và điểm danh trên cùng một lịch.</p></div><button disabled={saving} onClick={() => { setError(''); void load(); }}>Làm mới</button></header>
    <div className="classes-tabs">{[['sessions', 'Buổi học'], ['rooms', 'Phòng tập'], ['types', 'Loại lớp']].map(([key, label]) => <button key={key} aria-pressed={tab === key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</div>
    {error ? <p className="classes-error" role="alert">{error}</p> : null}{notice ? <p className="classes-notice" role="status">{notice}</p> : null}
    {loading ? <p>Đang tải dữ liệu…</p> : <>
      <div className="classes-toolbar"><h2>{tab === 'sessions' ? 'Lịch buổi học' : tab === 'rooms' ? 'Danh sách phòng' : 'Các loại lớp học'}</h2>{tab === 'sessions' ? <select aria-label="Lọc trạng thái" value={filter} onChange={e => setFilter(e.target.value)}>{['ALL', 'DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'].map(k => <option key={k} value={k}>{k === 'ALL' ? 'Tất cả trạng thái' : statusLabel(k)}</option>)}</select> : null}<button className="classes-primary" onClick={() => { setError(''); setEditing({ kind: tab === 'sessions' ? 'session' : tab === 'rooms' ? 'rooms' : 'types' }); }}>+ {tab === 'sessions' ? 'Tạo buổi học' : tab === 'rooms' ? 'Thêm phòng' : 'Thêm loại lớp'}</button></div>
      {tab === 'sessions' ? <div className="classes-table"><table><thead><tr><th>Buổi học</th><th>Thời gian</th><th>Phòng / Hướng dẫn viên</th><th>Đăng ký</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filtered.map(r => <tr key={r.BuoiHocID}><td><strong>{r.TenBuoi}</strong><small>{r.TenLoai}</small></td><td>{localDate(r.BatDau)}<small>Đến {localDate(r.KetThuc)}</small></td><td>{r.TenPhong}<small>{r.HoTenPT}</small></td><td>{r.DaDangKy} / {r.SucChua}</td><td><span className="classes-badge">{statusLabel(r.TrangThai)}</span></td><td><div className="classes-actions"><button onClick={() => void openRoster(r)}>Danh sách / Điểm danh</button>{['DRAFT', 'PUBLISHED'].includes(r.TrangThai) ? <>{r.TrangThai === 'PUBLISHED' ? <button disabled={saving} onClick={() => void mutate(`classes/${r.BuoiHocID}/complete`)}>Hoàn thành</button> : null}<button disabled={saving} onClick={() => { setError(''); setEditing({ kind: 'session', row: r }); }}>Sửa</button><button disabled={saving} onClick={() => { if (window.confirm(`Hủy buổi ${r.TenBuoi}? Các đăng ký sẽ được hủy và hội viên nhận thông báo.`))
            void mutate(`classes/${r.BuoiHocID}/cancel`); }}>Hủy buổi</button></> : null}</div></td></tr>)}</tbody></table>{!filtered.length ? <p className="classes-empty">Chưa có buổi học. Tạo phòng, loại lớp rồi lập lịch và công bố cho hội viên.</p> : null}</div> : <div className="classes-grid">{tab === 'rooms' ? resources.rooms.map(r => <article key={r.PhongTapID}><h3>{r.TenPhong}</h3><p>Tối đa {r.SucChua} hội viên</p><p>{r.MoTa || 'Chưa có mô tả'}</p><span className="classes-badge">{statusLabel(r.TrangThai)}</span><button disabled={saving} onClick={() => setEditing({ kind: 'rooms', row: r })}>Chỉnh sửa</button></article>) : resources.types.map(r => <article key={r.LoaiLopID}><small>{r.LoaiHinh}</small><h3>{r.TenLoai}</h3><p>{r.MoTa || 'Chưa có mô tả'}</p><span className="classes-badge">{statusLabel(r.TrangThai)}</span><button disabled={saving} onClick={() => setEditing({ kind: 'types', row: r })}>Chỉnh sửa</button></article>)}{!(tab === 'rooms' ? resources.rooms.length : resources.types.length) ? <p className="classes-empty">Chưa có dữ liệu. Thêm thông tin thực tế của trung tâm để bắt đầu.</p> : null}</div>}
    </>}
    {editing ? <Modal title={editing.kind === 'session' ? 'Thông tin buổi học' : editing.kind === 'rooms' ? 'Thông tin phòng' : 'Thông tin loại lớp'} onClose={() => !saving && setEditing(null)}><form className="classes-form" onSubmit={e => void save(e)}>
      {editing.kind === 'session' ? <>
        <label>Tên buổi học<input name="TenBuoi" required maxLength={150} defaultValue={editing.row?.TenBuoi}/></label>
        <label>Loại lớp<select name="LoaiLopID" required defaultValue={editing.row?.LoaiLopID || ''}><option value="" disabled>Chọn loại lớp</option>{resources.types.filter(r => r.TrangThai === 'ACTIVE').map(r => <option key={r.LoaiLopID} value={r.LoaiLopID}>{r.TenLoai}</option>)}</select></label>
        <label>Phòng tập<select name="PhongTapID" required defaultValue={editing.row?.PhongTapID || ''}><option value="" disabled>Chọn phòng</option>{resources.rooms.filter(r => r.TrangThai === 'ACTIVE').map(r => <option key={r.PhongTapID} value={r.PhongTapID}>{r.TenPhong} · {r.SucChua} chỗ</option>)}</select></label>
        <label>Hướng dẫn viên<select name="PTID" required defaultValue={editing.row?.PTID || ''}><option value="" disabled>Chọn hướng dẫn viên</option>{resources.trainers.map(r => <option key={r.PTID} value={r.PTID}>{r.HoTen}</option>)}</select></label>
        <label>Bắt đầu<input type="datetime-local" name="BatDau" required defaultValue={editing.row?.BatDau.replace(' ', 'T').slice(0, 16)}/></label><label>Kết thúc<input type="datetime-local" name="KetThuc" required defaultValue={editing.row?.KetThuc.replace(' ', 'T').slice(0, 16)}/></label>
        <label>Sức chứa<input type="number" min={1} step={1} name="SucChua" required defaultValue={editing.row?.SucChua}/></label>
        <label>Trạng thái<select name="TrangThai" defaultValue={editing.row?.TrangThai || 'DRAFT'}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Công bố cho hội viên</option></select></label>
        <label className="classes-wide">Ghi chú<textarea name="GhiChu" maxLength={500} defaultValue={editing.row?.GhiChu || ''}/></label>
        <p className="classes-wide">Thời gian theo giờ trung tâm. Lịch công bố không được trùng phòng, hướng dẫn viên hoặc lịch 1–1. Buổi đã có đăng ký không được đổi thời gian, phòng, loại lớp và hướng dẫn viên.</p>
      </> : <>
        {editing.kind === 'rooms' ? <><label>Tên phòng<input name="TenPhong" required maxLength={100} defaultValue={editing.row?.TenPhong}/></label><label>Sức chứa<input name="SucChua" type="number" min={1} step={1} required defaultValue={editing.row?.SucChua}/></label></> : <><label>Tên loại lớp<input name="TenLoai" required maxLength={100} defaultValue={editing.row?.TenLoai}/></label><label>Bộ môn<select name="LoaiHinh" defaultValue={editing.row?.LoaiHinh || 'YOGA'}><option value="YOGA">Yoga</option><option value="PILATES">Pilates</option></select></label></>}
        <label className="classes-wide">Mô tả<textarea name="MoTa" maxLength={500} defaultValue={editing.row?.MoTa || ''}/></label><label>Trạng thái<select name="TrangThai" defaultValue={editing.row?.TrangThai || 'ACTIVE'}><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Ngừng hoạt động</option></select></label>
      </>}
      {error ? <p className="classes-error classes-wide" role="alert">{error}</p> : null}<button className="classes-primary classes-wide" disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu thông tin'}</button>
    </form></Modal> : null}
    {roster ? <Modal title={`Hội viên · ${roster.session.TenBuoi}`} onClose={() => !saving && setRoster(null)}><div className="classes-roster"><p>{localDate(roster.session.BatDau)} · {roster.session.TenPhong}</p><p>Điểm danh từ 30 phút trước giờ bắt đầu đến khi buổi học kết thúc.</p><form onSubmit={e => { e.preventDefault(); const form = e.currentTarget; void attend({ code: String(new FormData(form).get('code')) }); }}><label>Mã QR / mã ngắn<input name="code" required maxLength={255} placeholder="Dán mã QR hoặc nhập mã ngắn của hội viên"/></label><button disabled={saving} type="submit">Điểm danh bằng mã</button></form>{error ? <p role="alert" className="classes-error">{error}</p> : null}{roster.rows.map(r => <div className="classes-attendee" key={r.DangKyLopID}><div><strong>{r.HoTen}</strong><small>{r.SoDienThoai || `Hội viên #${r.HoiVienID}`}</small></div>{r.DiemDanhLuc ? <span>Đã điểm danh · {localDate(r.DiemDanhLuc)}</span> : r.TrangThai === 'CANCELLED' ? <span>Đã hủy</span> : <button disabled={saving} onClick={() => void attend({ DangKyLopID: r.DangKyLopID })}>Điểm danh</button>}</div>)}{!roster.rows.length ? <p>Chưa có hội viên đăng ký.</p> : null}</div></Modal> : null}
  </div>;
}
