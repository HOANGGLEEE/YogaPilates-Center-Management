import { authenticatedFetch, baseUrl } from '@/lib/account-api';
export type YogaClass = {
    BuoiHocID: number;
    IsFuture: number;
    TenBuoi: string;
    TenLoai: string;
    LoaiHinh: 'YOGA' | 'PILATES';
    MoTa: string | null;
    TenPhong: string;
    HoTenPT: string;
    AnhDaiDien: string | null;
    BatDau: string;
    KetThuc: string;
    SucChua: number;
    DaDangKy: number;
    GhiChu: string | null;
    TrangThai: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
    DangKyLopID?: number;
    DangKyTrangThai?: 'BOOKED' | 'CANCELLED';
    DiemDanhLuc?: string | null;
};
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await authenticatedFetch(`${baseUrl}/classes${path}`, options);
    const data = await response.json();
    if (!response.ok)
        throw new Error(data?.message || 'Không thể tải lịch lớp học.');
    return data as T;
}
export const getClasses = (signal?: AbortSignal) => request<YogaClass[]>('', { signal });
export const getMyClasses = (signal?: AbortSignal) => request<YogaClass[]>('/mine', { signal });
export const bookClass = (id: number) => request(`/${id}/book`, { method: 'POST' });
export const cancelClassBooking = (id: number) => request(`/bookings/${id}/cancel`, { method: 'POST' });
export const classDate = (value: string) => new Date(value.replace(' ', 'T')).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
export const classTime = (row: YogaClass) => `${row.BatDau.slice(11, 16)}–${row.KetThuc.slice(11, 16)}`;
