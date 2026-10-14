import Ionicons from '@expo/vector-icons/Ionicons';
import BackendImage from '@/components/backend-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPTDetail, type ApiPT } from '@/lib/pt-api';

const fallback = require('../../assets/brand/icon.png');
const money = (value: string | number) =>
  `${Number(value).toLocaleString('vi-VN')}đ`;

export default function PTDetailScreen() {
  const { trainerId } = useLocalSearchParams<{ trainerId?: string }>();
  const ptId = Number(trainerId);
  const validId = Number.isInteger(ptId) && ptId > 0;
  const [trainer, setTrainer] = useState<ApiPT | null>();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!validId) {
      return;
    }
    getPTDetail(ptId)
      .then((row) => {
        if (active) {
          setTrainer(row);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setTrainer(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Không tải được PT.'
          );
        }
      });
    return () => {
      active = false;
    };
  }, [ptId, validId]);
  const displayError = validId ? error : 'PTID không hợp lệ.';

  const back = () =>
    router.canGoBack() ? router.back() : router.replace('/pt');
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" style={s.icon} onPress={back}>
          <Ionicons name="arrow-back" color="#315d4c" size={21} />
        </Pressable>
        <Text style={s.headerTitle}>Hồ sơ hướng dẫn viên</Text>
        <View style={s.icon} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {validId && trainer === undefined ? (
          <Text style={s.center}>Đang tải thông tin PT...</Text>
        ) : null}
        {!trainer && displayError ? (
          <Text style={s.error}>{displayError}</Text>
        ) : null}
        {trainer ? (
          <>
            <BackendImage
              value={trainer.AnhDaiDien}
              fallback={fallback}
              style={s.hero}
              contentFit="cover"
            />
            <View style={s.card}>
              <Text style={s.eyebrow}>YOGA & PILATES · 1–1</Text>
              <Text style={s.name}>{trainer.HoTen}</Text>
              <Text style={s.specialty}>
                {trainer.ChuyenMon || 'Chưa cập nhật chuyên môn'}
              </Text>
              <Info
                label="KINH NGHIỆM"
                value={trainer.KinhNghiem || 'Chưa cập nhật'}
              />
              <Info
                label="GIÁ THUÊ"
                value={`${money(trainer.GiaThue)} / buổi`}
                accent
              />
              <Info label="EMAIL" value={trainer.Email || 'Chưa cập nhật'} />
              <Info
                label="SỐ ĐIỆN THOẠI"
                value={trainer.SoDienThoai || 'Chưa cập nhật'}
              />

            </View>
          </>
        ) : null}
      </ScrollView>
      {trainer ? <View style={s.footer}>
        <Text style={s.footerLabel}>Yoga & Pilates · 1–1</Text>
        <Text style={s.footerPrice}>{money(trainer.GiaThue)}</Text>
              <Pressable
                accessibilityRole="button" style={s.primary}
                onPress={() =>
                  router.push({
                    pathname: '/pt-booking',
                    params: { trainerId: String(trainer.PTID) },
                  })
                }
              >
                <Text style={s.primaryText}>Chọn lịch tập 1–1</Text>
                <Ionicons name="calendar-outline" color="#ffffff" size={18} />
              </Pressable>
      </View> : null}
    </SafeAreaView>
  );
}

function Info({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={s.info}>
      <Text style={s.label}>{label}</Text>
      <Text style={[s.value, accent && s.accent]}>{value}</Text>
    </View>
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
  error: { color: '#a93e38', textAlign: 'center', padding: 35 },
  hero: {
    width: '100%',
    height: 280,
    borderRadius: 24,
    backgroundColor: '#eaece3',
  },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 22, gap: 16 },
  name: { color: '#203c32', fontSize: 25, fontWeight: '700' },
  specialty: { color: '#315d4c', fontSize: 12, fontWeight: '700' },
  info: {
    borderTopWidth: 1,
    borderTopColor: '#e7eae3',
    paddingTop: 11,
    gap: 5,
  },
  label: { color: '#69766e', fontSize: 12, fontWeight: '700' },
  value: { color: '#203c32', fontSize: 13, lineHeight: 19 },
  accent: { color: '#315d4c', fontSize: 17, fontWeight: '700' },
  primary: {
    minHeight: 50,
    backgroundColor: '#315d4c',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
