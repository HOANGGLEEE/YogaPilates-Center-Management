import BackendImage from '@/components/backend-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import {
  bookPT,
  getAvailablePTSchedules,
  getPTDetail,
  PTApiError,
  type ApiPT,
  type ApiPTSchedule,
} from '@/lib/pt-api';

const money = (value: string | number) =>
  `${Number(value).toLocaleString('vi-VN')}đ`;

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
    if (!Number.isInteger(ptId) || ptId <= 0) {
      setTrainer(null);
      setError('PTID không hợp lệ.');
      return;
    }
    try {
      const [pt, slots] = await Promise.all([
        getPTDetail(ptId),
        getAvailablePTSchedules(ptId),
      ]);
      setTrainer(pt);
      setSchedules(slots);
      setSelected((current) =>
        slots.some((slot) => slot.LichPTID === current) ? current : null
      );
      setSelectedDate((current) =>
        current && slots.some((slot) => slot.NgayLam === current)
          ? current
          : (slots[0]?.NgayLam ?? '')
      );
      setError('');
    } catch (loadError) {
      setTrainer(null);
      setSchedules([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không tải được lịch hướng dẫn 1-1.'
      );
    }
  }, [ptId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  const dates = useMemo(
    () => [...new Set(schedules.map((slot) => slot.NgayLam))],
    [schedules]
  );
  const selectedSlot = schedules.find((slot) => slot.LichPTID === selected);
  const visibleSlots = schedules.filter(
    (slot) => slot.NgayLam === selectedDate
  );

  async function submit() {
    if (!user?.accountId || !selected || loading) return;
    setLoading(true);
    try {
      await bookPT({ accountId: user.accountId, scheduleId: selected, note });
      Alert.alert('Thành công', 'Đăng ký lịch hướng dẫn 1-1 thành công', [
        { text: 'Xem lịch', onPress: () => router.replace('/pt-schedule') },
      ]);
    } catch (submitError) {
      const apiError = submitError instanceof PTApiError ? submitError : null;
      if (apiError?.code === 'SLOT_NOT_AVAILABLE') {
        Alert.alert(
          'Lịch vừa được đặt',
          'Lịch này vừa được người khác đặt. Vui lòng chọn khung giờ khác.'
        );
        await load();
      } else {
        Alert.alert(
          'Không thể đăng ký',
          apiError?.code === 'BOOKING_EXISTS'
            ? 'Bạn đã đăng ký khung giờ này.'
            : apiError?.message || 'Vui lòng thử lại.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" style={s.icon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" color="#315d4c" size={21} />
        </Pressable>
        <Text style={s.headerTitle}>Đặt lịch hướng dẫn 1–1</Text>
        <View style={s.icon} />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {trainer === undefined ? (
          <Text style={s.center}>Đang tải lịch trống...</Text>
        ) : null}
        {error ? <Text style={s.error}>{error}</Text> : null}
        {trainer ? (
          <>
            <View style={s.card}>
              <BackendImage value={trainer.AnhDaiDien} fallback={require("../../assets/brand/icon.png")} style={s.avatar} contentFit="cover" />
              <Text style={s.label}>HƯỚNG DẪN VIÊN</Text>
              <Text style={s.name}>{trainer.HoTen}</Text>
              <Text style={s.specialty}>
                {trainer.ChuyenMon || 'Chưa cập nhật chuyên môn'}
              </Text>
              <Text style={s.price}>{money(trainer.GiaThue)} / buổi</Text>
            </View>

            <Text style={s.section}>01 · Chọn ngày tập</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.row}
            >
              {dates.map((date) => (
                <Pressable
                  key={date}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelected(null);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedDate === date }}
                  style={[s.choice, selectedDate === date && s.choiceActive]}
                >
                  <Text
                    style={[
                      s.choiceText,
                      selectedDate === date && s.choiceTextActive,
                    ]}
                  >
                    {new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>


            <Text style={s.section}>02 · Chọn khung giờ</Text>
            <View style={s.slots}>
              {visibleSlots.map((slot) => (
                <Pressable
                  key={slot.LichPTID}
                  onPress={() => setSelected(slot.LichPTID)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected === slot.LichPTID }}
                  style={[s.slot, selected === slot.LichPTID && s.choiceActive]}
                >
                  <Text
                    style={[
                      s.slotText,
                      selected === slot.LichPTID && s.choiceTextActive,
                    ]}
                  >
                    {slot.GioBatDau.slice(0, 5)} - {slot.GioKetThuc.slice(0, 5)}
                  </Text>
                </Pressable>
              ))}
              {!visibleSlots.length ? (
                <Text style={s.muted}>
                  Chưa có khung giờ trống trong ngày này.
                </Text>
              ) : null}
            </View>

            <Text style={s.section}>03 · Ghi chú cho hướng dẫn viên</Text>
            <TextInput
              accessibilityLabel="Ghi chú cho hướng dẫn viên"
              value={note}
              onChangeText={setNote}
              maxLength={500}
              multiline
              placeholder="Ví dụ: Muốn cải thiện tư thế và độ linh hoạt"
              placeholderTextColor="#727d73"
              style={s.input}
            />

          </>
        ) : null}
      </ScrollView>
      {trainer ? <View style={s.footer}>
        <Text style={s.footerLabel}>{selectedSlot ? `${new Date(`${selectedSlot.NgayLam}T00:00:00`).toLocaleDateString("vi-VN")} · ${selectedSlot.GioBatDau.slice(0, 5)}–${selectedSlot.GioKetThuc.slice(0, 5)}` : "Chọn giờ để tiếp tục"}</Text>
        <Text style={s.footerPrice}>{money(trainer.GiaThue)}</Text>
            <Pressable accessibilityRole="button"
              disabled={!selected || loading || !user?.accountId}
              onPress={submit}
              style={[
                s.primary,
                (!selected || loading || !user?.accountId) && s.disabled,
              ]}
            >
              <Text style={s.primaryText}>
                {loading ? 'Đang đăng ký…' : 'Xác nhận đặt lịch'}
              </Text>
            </Pressable>
      </View> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  eyebrow: { color: '#69766e', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#eaece3' },
  footer: { padding: 18, gap: 8, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e7eae3', width: '100%', maxWidth: 540, alignSelf: 'center' },
  footerLabel: { color: '#69766e', fontSize: 13 },
  footerPrice: { color: '#203c32', fontSize: 22, fontWeight: '700' },
  safe: { flex: 1, backgroundColor: '#f6f4ee' },
  header: {
    height: 54,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eaece3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#315d4c', fontSize: 16, fontWeight: '700' },
  content: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    padding: 20,
    gap: 18,
    paddingBottom: 35,
  },
  center: { color: '#69766e', textAlign: 'center', padding: 35 },
  error: { color: '#a93e38', textAlign: 'center', padding: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, gap: 8 },
  label: { color: '#69766e', fontSize: 12, fontWeight: '700' },
  name: { color: '#203c32', fontSize: 21, fontWeight: '700' },
  specialty: { color: '#315d4c', fontSize: 13, fontWeight: '800' },
  price: { color: '#315d4c', fontSize: 15, fontWeight: '700', marginTop: 5 },
  section: { color: '#203c32', fontSize: 14, fontWeight: '700', marginTop: 6 },
  row: { gap: 8 },
  choice: {
    backgroundColor: '#eaece3',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  choiceActive: { backgroundColor: '#315d4c', borderColor: '#315d4c' },
  choiceText: { color: '#69766e', fontSize: 13, fontWeight: '700' },
  choiceTextActive: { color: '#ffffff' },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#dfe5dc', minWidth: '45%', alignItems: 'center' },
  slotText: { color: '#315d4c', fontSize: 14, fontWeight: '800' },
  muted: { color: '#69766e', fontSize: 14 },
  input: {
    minHeight: 90,
    backgroundColor: '#ffffff',
    color: '#315d4c',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
  },
  primary: {
    minHeight: 52,
    backgroundColor: '#315d4c',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
