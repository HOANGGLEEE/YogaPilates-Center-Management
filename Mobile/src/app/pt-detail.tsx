import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackendImage from '@/components/backend-image';
import { Palette as P, trainerPlaceholder } from '@/constants/theme';
import { getPTDetail, type ApiPT } from '@/lib/pt-api';

const money = (value: string | number) => `${Number(value).toLocaleString('vi-VN')} ₫`;

export default function PTDetailScreen() {
  const { trainerId } = useLocalSearchParams<{ trainerId?: string }>();
  const ptId = Number(trainerId);
  const validId = Number.isInteger(ptId) && ptId > 0;
  const [trainer, setTrainer] = useState<ApiPT | null>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!validId) return;
    getPTDetail(ptId).then(row => {
      if (active) { setTrainer(row); setError(''); }
    }).catch(loadError => {
      if (active) { setTrainer(null); setError(loadError instanceof Error ? loadError.message : 'Không tải được hồ sơ PT.'); }
    });
    return () => { active = false; };
  }, [ptId, validId]);
  const displayError = validId ? error : 'Vui lòng chọn lại hướng dẫn viên.';
  const back = () => router.canGoBack() ? router.back() : router.replace('/pt');
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
    <View style={s.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" style={s.back} onPress={back}><Ionicons name="arrow-back" size={22} color={P.text} /></Pressable>
      <Text style={s.headerTitle}>Chi tiết PT</Text><View style={s.headerSpacer} />
    </View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
      {validId && trainer === undefined ? <View style={s.state}><ActivityIndicator color={P.accentInk} /><Text style={s.muted}>Đang tải hồ sơ hướng dẫn viên…</Text></View> : null}
      {displayError ? <View style={s.state}><Ionicons name="alert-circle-outline" color={P.error} size={30} /><Text accessibilityRole="alert" style={s.error}>{displayError}</Text></View> : null}
      {trainer ? <>
        <View style={s.profile}>
          <BackendImage value={trainer.AnhDaiDien} fallback={trainerPlaceholder} style={s.photo} contentFit="cover" />
          <View style={s.identity}>
            <View style={s.pill}><Ionicons name="person-outline" size={14} color={P.accentInk} /><Text style={s.pillText}>HƯỚNG DẪN CÁ NHÂN · 1–1</Text></View>
            <Text style={s.name}>{trainer.HoTen}</Text>
            <Text style={s.intro}>Đồng hành cùng bạn trong từng buổi tập.</Text>
          </View>
        </View>
        <View style={s.card}>
          <View style={s.sectionHeading}><View style={s.sectionIcon}><Ionicons name="body-outline" size={21} color={P.accentInk} /></View><Text style={s.sectionTitle}>Chuyên môn</Text></View>
          <Text style={s.body}>{trainer.ChuyenMon || 'Hướng dẫn viên chưa cập nhật chuyên môn.'}</Text>
        </View>
        <View style={s.card}>
          <View style={s.sectionHeading}><View style={s.sectionIcon}><Ionicons name="briefcase-outline" size={21} color={P.accentInk} /></View><Text style={s.sectionTitle}>Kinh nghiệm</Text></View>
          <Text style={s.body}>{trainer.KinhNghiem || 'Hướng dẫn viên chưa cập nhật thông tin kinh nghiệm.'}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.sectionTitle}>Thông tin liên hệ</Text>
          <View style={s.contact}><Ionicons name="mail-outline" size={20} color={P.accentInk} /><View style={s.grow}><Text style={s.contactLabel}>Email</Text><Text selectable style={s.contactValue}>{trainer.Email || 'Chưa cập nhật'}</Text></View></View>
          <View style={[s.contact, s.contactLast]}><Ionicons name="call-outline" size={20} color={P.accentInk} /><View style={s.grow}><Text style={s.contactLabel}>Số điện thoại</Text><Text selectable style={s.contactValue}>{trainer.SoDienThoai || 'Chưa cập nhật'}</Text></View></View>
        </View>
      </> : null}
    </ScrollView>
    {trainer ? <View style={s.footer}>
      <View style={s.priceRow}><View><Text style={s.muted}>Giá hướng dẫn</Text><Text style={s.price}>{money(trainer.GiaThue)} <Text style={s.unit}>/ buổi</Text></Text></View><View style={s.priceBadge}><Text style={s.pillText}>TẬP RIÊNG 1–1</Text></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Chọn lịch tập với PT" style={s.primary} onPress={() => router.push({ pathname: '/pt-booking', params: { trainerId: String(trainer.PTID) } })}><Ionicons name="calendar-outline" size={20} color={P.text} /><Text style={s.primaryText}>Chọn lịch tập với PT</Text><Ionicons name="arrow-forward" size={18} color={P.text} /></Pressable>
    </View> : null}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.background },
  header: { width: '100%', maxWidth: 560, alignSelf: 'center', height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: P.border, alignItems: 'center', justifyContent: 'center', backgroundColor: P.surface },
  headerSpacer: { width: 44 }, headerTitle: { color: P.text, fontSize: 17, fontWeight: '600' },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, paddingBottom: 28, gap: 16 },
  profile: { borderRadius: 26, backgroundColor: P.surface, borderWidth: 1, borderColor: P.border, overflow: 'hidden' },
  photo: { width: '100%', height: 235, backgroundColor: P.soft },
  identity: { padding: 22, gap: 12 }, pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: P.soft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 },
  pillText: { color: P.accentInk, fontSize: 10, fontWeight: '700', letterSpacing: .4 },
  name: { color: P.text, fontSize: 28, lineHeight: 35, fontWeight: '700' }, intro: { color: P.muted, fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: P.surface, borderWidth: 1, borderColor: P.border, borderRadius: 22, padding: 20, gap: 14 },
  sectionHeading: { flexDirection: 'row', gap: 10, alignItems: 'center' }, sectionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: P.soft, alignItems: 'center', justifyContent: 'center' }, sectionTitle: { color: P.text, fontSize: 17, fontWeight: '600' },
  body: { color: P.text, fontSize: 15, lineHeight: 24 },
  contact: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10 }, contactLast: { borderTopWidth: 1, borderTopColor: P.border, paddingTop: 18 }, grow: { flex: 1 }, contactLabel: { color: P.muted, fontSize: 12, marginBottom: 5 }, contactValue: { color: P.text, fontSize: 14, lineHeight: 21 },
  footer: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, backgroundColor: P.surface, borderTopWidth: 1, borderTopColor: P.border, gap: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, priceBadge: { padding: 8, borderRadius: 9, backgroundColor: P.soft }, price: { color: P.text, fontSize: 24, fontWeight: '700', marginTop: 4 }, unit: { color: P.muted, fontSize: 12, fontWeight: '400' },
  primary: { minHeight: 54, borderRadius: 16, backgroundColor: P.accent, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' }, primaryText: { color: P.text, fontSize: 15, fontWeight: '700' },
  state: { padding: 30, alignItems: 'center', gap: 14 }, muted: { color: P.muted, fontSize: 12 }, error: { color: P.error, fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
