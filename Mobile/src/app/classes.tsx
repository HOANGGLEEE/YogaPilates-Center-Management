import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackendImage from '@/components/backend-image';
import { bookClass, cancelClassBooking, classDate, classTime, getClasses, getMyClasses, type YogaClass } from '@/lib/classes-api';
export default function ClassesScreen() {
    const [classes, setClasses] = useState<YogaClass[]>([]);
    const [mine, setMine] = useState<YogaClass[]>([]);
    const [tab, setTab] = useState<'discover' | 'mine'>('discover');
    const [kind, setKind] = useState('ALL');
    const [date, setDate] = useState('');
    const [detail, setDetail] = useState<YogaClass | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const load = useCallback(async (signal?: AbortSignal) => {
        try {
            const [available, booked] = await Promise.all([getClasses(signal), getMyClasses(signal)]);
            if (signal?.aborted)
                return;
            setClasses(available);
            setMine(booked);
            setDate(current => available.some(row => row.BatDau.startsWith(current)) ? current : '');
            setError('');
        }
        catch (e) {
            if (!signal?.aborted)
                setError(e instanceof Error ? e.message : 'Không tải được lịch lớp.');
        }
        finally {
            if (!signal?.aborted)
                setLoading(false);
        }
    }, []);
    useFocusEffect(useCallback(() => { const c = new AbortController(); void load(c.signal); return () => c.abort(); }, [load]));
    const dates = useMemo(() => [...new Set(classes.map(c => c.BatDau.slice(0, 10)))].sort(), [classes]);
    const visible = (tab === 'mine' ? mine : classes).filter(c => (kind === 'ALL' || c.LoaiHinh === kind) && (tab === 'mine' || !date || c.BatDau.startsWith(date)));
    const registration = detail && mine.find(c => c.BuoiHocID === detail.BuoiHocID && c.DangKyTrangThai === 'BOOKED');
    async function submit() {
        if (!detail || saving)
            return;
        setSaving(true);
        setError('');
        let failure = '';
        try {
            if (registration?.DangKyLopID)
                await cancelClassBooking(registration.DangKyLopID);
            else
                await bookClass(detail.BuoiHocID);
            setMessage(registration ? 'Đã hủy đăng ký lớp.' : 'Đã đăng ký lớp. Xem trong Lịch của tôi.');
            setDetail(null);
        }
        catch (e) {
            failure = e instanceof Error ? e.message : 'Không thể cập nhật đăng ký.';
        }
        finally {
            await load();
            if (failure)
                setError(failure);
            setSaving(false);
        }
    }
    const canAct = detail && detail.TrangThai === 'PUBLISHED' && !!detail.IsFuture && !registration?.DiemDanhLuc;
    return <SafeAreaView style={s.safe}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Ionicons name="arrow-back" size={22} color="#315d4c"/></Pressable><Text style={s.headerTitle}>Lớp Yoga & Pilates</Text><Pressable accessibilityRole="button" accessibilityLabel="Làm mới lịch" onPress={() => void load()} style={s.back}><Ionicons name="refresh-outline" size={22} color="#315d4c"/></Pressable></View>
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>CHUYỂN ĐỘNG CÙNG NHAU</Text><Text style={s.title}>Một lớp học phù hợp.{'\n'}Một nhịp tập của riêng bạn.</Text>
      <Text style={s.muted}>Chọn lớp, kiểm tra chỗ trống và đăng ký bằng quyền lợi gói hội viên.</Text>
      <View style={s.tabs}>{([['discover', 'Khám phá lớp'], ['mine', 'Lịch của tôi']] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={[s.tab, tab === key && s.active]}><Text style={[s.tabText, tab === key && s.activeText]}>{label}</Text></Pressable>)}</View>
      <View style={s.filters}>{[['ALL', 'Tất cả'], ['YOGA', 'Yoga'], ['PILATES', 'Pilates']].map(([key, label]) => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: kind === key }} style={[s.chip, kind === key && s.active]} onPress={() => setKind(key)}><Text style={[s.tabText, kind === key && s.activeText]}>{label}</Text></Pressable>)}</View>
      {tab === 'discover' && dates.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}><Pressable style={[s.chip, !date && s.active]} onPress={() => setDate('')}><Text style={[s.tabText, !date && s.activeText]}>Mọi ngày</Text></Pressable>{dates.map(d => <Pressable key={d} accessibilityRole="button" accessibilityState={{ selected: date === d }} onPress={() => setDate(d)} style={[s.chip, date === d && s.active]}><Text style={[s.tabText, date === d && s.activeText]}>{classDate(d + ' 00:00:00')}</Text></Pressable>)}</ScrollView> : null}
      {loading ? <ActivityIndicator color="#315d4c"/> : null}
      {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
      {message ? <Text style={s.success}>{message}</Text> : null}
      {!loading && !visible.length && !error ? <View style={s.empty}><Ionicons name="calendar-outline" size={36} color="#315d4c"/><Text style={s.section}>{tab === 'mine' ? 'Bạn chưa đăng ký lớp nào' : 'Chưa có lớp phù hợp'}</Text><Text style={s.muted}>{tab === 'mine' ? 'Khám phá lịch và chọn buổi học phù hợp với bạn.' : 'Trung tâm sẽ cập nhật lịch lớp tại đây.'}</Text></View> : null}
      {visible.map(c => <Pressable key={c.BuoiHocID} accessibilityRole="button" accessibilityLabel={`Xem lớp ${c.TenBuoi}`} style={s.card} onPress={() => { setDetail(c); setError(''); }}>
        <View style={s.cardTop}><Text style={s.badge}>{c.LoaiHinh}</Text><Text style={s.muted}>{classDate(c.BatDau)}</Text></View>
        <Text style={s.className}>{c.TenBuoi}</Text><Text style={s.time}>{classTime(c)}</Text>
        <View style={s.trainer}><BackendImage value={c.AnhDaiDien} fallback={require('../../assets/brand/icon.png')} contentFit="cover" style={s.avatar}/><View style={s.grow}><Text style={s.trainerName}>{c.HoTenPT}</Text><Text style={s.muted}>{c.TenPhong}</Text></View><Ionicons name="arrow-forward" size={20} color="#315d4c"/></View>
        <View style={s.cardBottom}><Text style={s.seats}>{tab === 'mine' ? c.DiemDanhLuc ? 'Đã điểm danh' : c.DangKyTrangThai === 'CANCELLED' ? 'Đã hủy' : 'Đã đăng ký' : `Còn ${Math.max(0, c.SucChua - c.DaDangKy)} / ${c.SucChua} chỗ`}</Text><Text style={s.muted}>{c.TrangThai === 'CANCELLED' ? 'Buổi đã hủy' : c.TrangThai === 'COMPLETED' ? 'Buổi đã kết thúc' : c.TenLoai}</Text></View>
      </Pressable>)}
    </ScrollView>
    <Modal visible={!!detail} animationType="slide" onRequestClose={() => !saving && setDetail(null)}>
      <SafeAreaView style={s.safe}>{detail ? <><View style={s.header}><Text style={s.headerTitle}>Thông tin buổi học</Text><Pressable disabled={saving} accessibilityRole="button" accessibilityLabel="Đóng" style={s.back} onPress={() => setDetail(null)}><Ionicons name="close" size={24} color="#315d4c"/></Pressable></View>
        <ScrollView contentContainerStyle={s.content}><Text style={s.eyebrow}>{detail.LoaiHinh} · LỚP NHÓM</Text><Text style={s.title}>{detail.TenBuoi}</Text><View style={s.card}><Text style={s.section}>{classDate(detail.BatDau)} · {classTime(detail)}</Text><Text style={s.muted}>{detail.TenPhong} · Tối đa {detail.SucChua} hội viên</Text><View style={s.trainer}><BackendImage value={detail.AnhDaiDien} fallback={require('../../assets/brand/icon.png')} style={s.avatar} contentFit="cover"/><View><Text style={s.trainerName}>{detail.HoTenPT}</Text><Text style={s.muted}>Hướng dẫn viên</Text></View></View></View>
        <Text style={s.section}>Về lớp học</Text><Text style={s.body}>{detail.MoTa || 'Trung tâm chưa cập nhật mô tả lớp.'}</Text>{detail.GhiChu ? <><Text style={s.section}>Lưu ý từ trung tâm</Text><Text style={s.body}>{detail.GhiChu}</Text></> : null}
        <View style={s.card}><Text style={s.section}>Đăng ký bằng gói hội viên</Text><Text style={s.body}>Gói tập cần có quyền lợi {detail.LoaiHinh === 'YOGA' ? 'Yoga' : 'Pilates nhóm'}, đã thanh toán và còn hiệu lực vào ngày học. Có thể hủy trước giờ bắt đầu nếu chưa điểm danh.</Text></View>
        {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
        </ScrollView><View style={s.footer}><Text style={s.muted}>{registration ? 'Bạn đã đăng ký buổi học này' : `Còn ${Math.max(0, detail.SucChua - detail.DaDangKy)} chỗ`}</Text><Pressable accessibilityRole="button" disabled={saving || !canAct || (!registration && detail.DaDangKy >= detail.SucChua)} onPress={() => void submit()} style={[s.primary, (!canAct || saving || (!registration && detail.DaDangKy >= detail.SucChua)) && s.disabled]}><Text style={s.primaryText}>{saving ? 'Đang cập nhật…' : registration ? 'Hủy đăng ký lớp' : 'Đăng ký buổi học'}</Text></Pressable></View></> : null}</SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f6f4ee' }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaece3', borderRadius: 14 }, headerTitle: { fontSize: 16, fontWeight: '700', color: '#203c32' }, content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, gap: 18, paddingBottom: 32 }, eyebrow: { color: '#69766e', fontSize: 11, letterSpacing: 1.5, fontWeight: '700' }, title: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: '#203c32' }, muted: { color: '#69766e', fontSize: 13, lineHeight: 20 }, body: { color: '#40594e', fontSize: 15, lineHeight: 25 }, section: { color: '#203c32', fontSize: 17, fontWeight: '700' }, tabs: { flexDirection: 'row', padding: 4, backgroundColor: '#eaece3', borderRadius: 18, gap: 4 }, tab: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' }, tabText: { fontSize: 14, color: '#315d4c', fontWeight: '600' }, active: { backgroundColor: '#315d4c' }, activeText: { color: '#fff' }, filters: { flexDirection: 'row', gap: 8 }, chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: '#eaece3' }, card: { backgroundColor: '#fff', padding: 22, borderRadius: 24, gap: 14, borderWidth: 1, borderColor: '#e7eae3' }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, badge: { color: '#315d4c', fontSize: 11, fontWeight: '700', letterSpacing: 1, backgroundColor: '#edf2e8', padding: 8, borderRadius: 8 }, className: { fontSize: 23, fontWeight: '700', color: '#203c32' }, time: { fontSize: 18, color: '#315d4c', fontWeight: '600' }, trainer: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#eaece3' }, trainerName: { color: '#203c32', fontSize: 14, fontWeight: '600' }, grow: { flex: 1 }, cardBottom: { borderTopWidth: 1, borderTopColor: '#e7eae3', paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }, seats: { color: '#315d4c', fontSize: 13, fontWeight: '600' }, empty: { alignItems: 'center', gap: 12, padding: 30 }, error: { color: '#a93e38', fontSize: 14, lineHeight: 22 }, success: { color: '#315d4c', fontSize: 14, lineHeight: 22 }, footer: { padding: 20, gap: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e7eae3' }, primary: { backgroundColor: '#315d4c', padding: 18, borderRadius: 16, alignItems: 'center' }, primaryText: { color: '#fff', fontSize: 15, fontWeight: '700' }, disabled: { opacity: 0.45 },
});
