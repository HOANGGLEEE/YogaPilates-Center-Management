import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackendImage from '@/components/backend-image';
import { Palette as P, trainerPlaceholder } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { bookPT, getAvailablePTSchedules, getPTDetail, PTApiError, type ApiPT, type ApiPTSchedule } from '@/lib/pt-api';

const money = (value: string | number) => `${Number(value).toLocaleString('vi-VN')} ₫`;
const dateLabel = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });

export default function PTBookingScreen() {
  const { user } = useAuth();
  const { trainerId } = useLocalSearchParams<{ trainerId?: string }>();
  const ptId = Number(trainerId);
  const [trainer, setTrainer] = useState<ApiPT | null>();
  const [schedules, setSchedules] = useState<ApiPTSchedule[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!Number.isInteger(ptId) || ptId <= 0) { setTrainer(null); setError('Vui lòng chọn lại hướng dẫn viên.'); return; }
    try {
      const [pt, slots] = await Promise.all([getPTDetail(ptId), getAvailablePTSchedules(ptId)]);
      setTrainer(pt); setSchedules(slots);
      setSelected(current => slots.some(slot => slot.LichPTID === current) ? current : null);
      setSelectedDate(current => current && slots.some(slot => slot.NgayLam === current) ? current : slots[0]?.NgayLam ?? '');
      setError('');
    } catch (e) { setTrainer(null); setSchedules([]); setError(e instanceof Error ? e.message : 'Không tải được lịch trống của PT.'); }
  }, [ptId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const dates = useMemo(() => [...new Set(schedules.map(slot => slot.NgayLam))], [schedules]);
  const selectedSlot = schedules.find(slot => slot.LichPTID === selected);
  const visibleSlots = schedules.filter(slot => slot.NgayLam === selectedDate);
  const disabled = !selected || loading || !user?.accountId;
  async function submit() {
    if (!user?.accountId || !selected || loading) return;
    setLoading(true);
    try {
      await bookPT({ accountId: user.accountId, scheduleId: selected, note });
      Alert.alert('Đặt lịch thành công', 'Buổi hướng dẫn của bạn đã được đăng ký.', [{ text: 'Xem lịch của tôi', onPress: () => router.replace('/pt-schedule') }]);
    } catch (e) {
      const apiError = e instanceof PTApiError ? e : null;
      if (apiError?.code === 'SLOT_NOT_AVAILABLE') {
        Alert.alert('Khung giờ vừa được đặt', 'Vui lòng chọn khung giờ khác.'); await load();
      } else Alert.alert('Không thể đặt lịch', apiError?.code === 'BOOKING_EXISTS' ? 'Bạn đã đăng ký khung giờ này.' : apiError?.message || 'Vui lòng thử lại.');
    } finally { setLoading(false); }
  }
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/pt')}><Ionicons name="arrow-back" size={22} color={P.text} /></Pressable><Text style={s.headerTitle}>Đặt lịch PT</Text><View style={s.headerSpacer} /></View>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {trainer === undefined ? <View style={s.state}><ActivityIndicator color={P.accentInk} /><Text style={s.muted}>Đang tải lịch trống…</Text></View> : null}
        {error ? <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()}><Text style={s.retry}>Thử lại</Text></Pressable></View> : null}
        {trainer ? <>
          <Text style={s.eyebrow}>BUỔI TẬP CÁ NHÂN · 1–1</Text>
          <Text style={s.pageTitle}>Chọn thời gian phù hợp{ '\n' }với nhịp sống của bạn.</Text>
          <View style={s.trainerCard}><BackendImage value={trainer.AnhDaiDien} fallback={trainerPlaceholder} contentFit="cover" style={s.avatar} /><View style={s.grow}><Text style={s.trainerLabel}>HƯỚNG DẪN VIÊN</Text><Text style={s.trainerName}>{trainer.HoTen}</Text><Text numberOfLines={2} style={s.specialty}>{trainer.ChuyenMon || 'Chưa cập nhật chuyên môn'}</Text></View></View>
          <View style={s.card}>
            <Step number="01" title="Chọn ngày tập" subtitle="Những ngày PT đang có lịch trống." />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dates}>
              {dates.map(date => <Pressable key={date} accessibilityRole="button" accessibilityLabel={dateLabel(date)} accessibilityState={{ selected: selectedDate === date }} onPress={() => { setSelectedDate(date); setSelected(null); }} style={[s.date, selectedDate === date && s.selectedDate]}>
                <Text style={s.dateWeek}>{new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' })}</Text><Text style={s.dateDay}>{date.slice(8, 10)}</Text><Text style={s.dateMonth}>Tháng {Number(date.slice(5, 7))}</Text>
              </Pressable>)}
            </ScrollView>
            {!dates.length ? <Text style={s.muted}>PT chưa có lịch trống. Vui lòng quay lại sau.</Text> : null}
          </View>
          <View style={s.card}>
            <Step number="02" title="Chọn khung giờ" subtitle={selectedDate ? dateLabel(selectedDate) : 'Chọn ngày tập trước khi chọn giờ.'} />
            <View style={s.slots}>{visibleSlots.map(slot => <Pressable key={slot.LichPTID} accessibilityRole="button" accessibilityState={{ selected: selected === slot.LichPTID }} onPress={() => setSelected(slot.LichPTID)} style={[s.slot, selected === slot.LichPTID && s.selectedSlot]}><Ionicons name={selected === slot.LichPTID ? 'checkmark-circle' : 'time-outline'} size={18} color={P.accentInk} /><Text style={s.slotText}>{slot.GioBatDau.slice(0, 5)}–{slot.GioKetThuc.slice(0, 5)}</Text></Pressable>)}</View>
            {selectedDate && !visibleSlots.length ? <Text style={s.muted}>Ngày này chưa có khung giờ trống.</Text> : null}
          </View>
          <View style={s.card}>
            <Step number="03" title="Ghi chú cho PT" subtitle="Không bắt buộc · chia sẻ mục tiêu của buổi tập." />
            <TextInput accessibilityLabel="Ghi chú cho PT" value={note} onChangeText={setNote} multiline maxLength={500} placeholder="Ví dụ: Tôi muốn cải thiện tư thế và độ linh hoạt…" placeholderTextColor={P.muted} style={s.input} />
            <Text style={s.counter}>{note.length}/500 ký tự</Text>
          </View>
        </> : null}
      </ScrollView>
      {trainer ? <View style={s.footer}>
        <View style={s.summary}><Ionicons name="calendar-outline" size={18} color={P.accentInk} /><Text style={s.summaryText}>{selectedSlot ? `${dateLabel(selectedSlot.NgayLam)} · ${selectedSlot.GioBatDau.slice(0, 5)}–${selectedSlot.GioKetThuc.slice(0, 5)}` : 'Chọn khung giờ để tiếp tục'}</Text></View>
        <View style={s.footerRow}><View><Text style={s.muted}>Giá một buổi</Text><Text style={s.price}>{money(trainer.GiaThue)}</Text></View><Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={!!disabled} onPress={() => void submit()} style={[s.primary, disabled && s.disabled]}>{loading ? <ActivityIndicator color={P.text} /> : <><Text style={s.primaryText}>Xác nhận đặt lịch</Text><Ionicons name="arrow-forward" color={P.text} size={18} /></>}</Pressable></View>
      </View> : null}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
function Step({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return <View style={s.step}><View style={s.stepNumber}><Text style={s.stepNumberText}>{number}</Text></View><View style={s.grow}><Text style={s.sectionTitle}>{title}</Text><Text style={s.stepSubtitle}>{subtitle}</Text></View></View>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.background }, flex: { flex: 1 }, header: { width: '100%', maxWidth: 560, alignSelf: 'center', height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: P.border, alignItems: 'center', justifyContent: 'center', backgroundColor: P.surface }, headerSpacer: { width: 44 }, headerTitle: { color: P.text, fontSize: 17, fontWeight: '600' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, paddingBottom: 28, gap: 16 },
  eyebrow: { color: P.accentInk, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }, pageTitle: { color: P.text, fontSize: 26, lineHeight: 34, fontWeight: '600', marginBottom: 4 },
  trainerCard: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 18, backgroundColor: P.surface, borderWidth: 1, borderColor: P.border, borderRadius: 22 }, avatar: { width: 76, height: 86, borderRadius: 17, backgroundColor: P.soft }, grow: { flex: 1 }, trainerLabel: { color: P.muted, fontSize: 10, fontWeight: '600', letterSpacing: .7, marginBottom: 6 }, trainerName: { color: P.text, fontSize: 19, fontWeight: '700', lineHeight: 26 }, specialty: { color: P.accentInk, fontSize: 13, lineHeight: 19, marginTop: 5 },
  card: { backgroundColor: P.surface, borderWidth: 1, borderColor: P.border, borderRadius: 22, padding: 18, gap: 18 }, step: { flexDirection: 'row', gap: 12, alignItems: 'center' }, stepNumber: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: P.soft }, stepNumberText: { color: P.accentInk, fontSize: 13, fontWeight: '700' }, sectionTitle: { color: P.text, fontSize: 16, fontWeight: '600' }, stepSubtitle: { color: P.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  dates: { gap: 10 }, date: { minWidth: 80, minHeight: 100, padding: 12, gap: 6, alignItems: 'center', borderWidth: 1, borderColor: P.border, borderRadius: 16, backgroundColor: P.background }, selectedDate: { backgroundColor: P.accent, borderColor: P.accentInk }, dateWeek: { color: P.text, fontSize: 12 }, dateDay: { color: P.text, fontSize: 24, fontWeight: '700' }, dateMonth: { color: P.text, fontSize: 11 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, slot: { flexBasis: '46%', flexGrow: 1, minHeight: 52, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: P.background, borderWidth: 1, borderColor: P.border, borderRadius: 14 }, selectedSlot: { backgroundColor: P.accent, borderColor: P.accentInk }, slotText: { color: P.text, fontSize: 13, fontWeight: '600' },
  input: { minHeight: 110, borderWidth: 1, borderColor: P.border, borderRadius: 14, backgroundColor: P.background, color: P.text, fontSize: 14, lineHeight: 22, padding: 14, textAlignVertical: 'top' }, counter: { color: P.muted, fontSize: 11, textAlign: 'right', marginTop: -8 },
  footer: { width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: P.surface, borderTopWidth: 1, borderTopColor: P.border, padding: 18, gap: 14 }, summary: { flexDirection: 'row', alignItems: 'center', gap: 8 }, summaryText: { color: P.muted, fontSize: 12, lineHeight: 19, flex: 1 }, footerRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }, price: { color: P.text, fontSize: 23, fontWeight: '700', marginTop: 4 }, primary: { minHeight: 52, backgroundColor: P.accent, borderRadius: 15, paddingHorizontal: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }, primaryText: { color: P.text, fontSize: 13, fontWeight: '700' }, disabled: { opacity: .45 }, muted: { color: P.muted, fontSize: 12, lineHeight: 19 }, state: { alignItems: 'center', padding: 30, gap: 14 }, errorBox: { backgroundColor: P.errorSurface, padding: 18, gap: 10, borderRadius: 16 }, error: { color: P.error, fontSize: 14, lineHeight: 22 }, retry: { color: P.accentInk, fontSize: 14, fontWeight: '600' },
});
