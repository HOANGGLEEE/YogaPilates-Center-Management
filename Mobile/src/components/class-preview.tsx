import { Palette } from '@/constants/theme';
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { classDate, classTime, getClasses, type YogaClass } from '@/lib/classes-api';
export default function ClassPreview() {
    const [rows, setRows] = useState<YogaClass[]>([]);
    const [message, setMessage] = useState('Đang tải lịch lớp…');
    useFocusEffect(useCallback(() => {
        const controller = new AbortController();
        getClasses(controller.signal).then(data => { if (!controller.signal.aborted) {
            setRows(data.slice(0, 3));
            setMessage(data.length ? '' : 'Chưa có lịch lớp được công bố.');
        } }, () => { if (!controller.signal.aborted)
            setMessage('Không tải được lịch lớp. Mở lịch để thử lại.'); });
        return () => controller.abort();
    }, []));
    return <View style={s.card}><Text style={s.title}>Lớp Yoga & Pilates</Text>{message ? <Text style={s.muted}>{message}</Text> : null}{rows.map(row => <View style={s.row} key={row.BuoiHocID}><Text style={s.date}>{classDate(row.BatDau)}{'\n'}{classTime(row)}</Text><View style={s.grow}><Text style={s.name}>{row.TenBuoi}</Text><Text style={s.muted}>{row.TenPhong} · Còn {Math.max(0, row.SucChua - row.DaDangKy)} chỗ</Text></View></View>)}<Pressable accessibilityRole="button" style={s.button} onPress={() => router.push('/classes')}><Text style={s.buttonText}>Khám phá lớp & lịch của tôi →</Text></Pressable></View>;
}
const s = StyleSheet.create({ card: { backgroundColor: Palette.surface, padding: 20, borderRadius: 22, gap: 14 }, title: { fontSize: 20, fontWeight: '700', color: Palette.text }, row: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: 14, alignItems: 'center' }, date: { color: Palette.accentInk, fontSize: 12, lineHeight: 20 }, grow: { flex: 1 }, name: { color: Palette.text, fontSize: 15, fontWeight: '600' }, muted: { color: Palette.muted, fontSize: 12, lineHeight: 20 }, button: { padding: 14, backgroundColor: Palette.accent, borderRadius: 14, alignItems: 'center' }, buttonText: { color: Palette.text, fontSize: 14, fontWeight: '600' } });
