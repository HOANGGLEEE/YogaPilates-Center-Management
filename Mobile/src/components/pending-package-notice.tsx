import { Palette } from '@/constants/theme';
import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { getPendingRegistration, type PendingRegistration } from '@/lib/membership-api';

export default function PendingPackageNotice() {
  const { user } = useAuth();
  const accountId = user?.accountId;
  const [state, setState] = useState<{ accountId: number; registration: PendingRegistration | null } | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    if (accountId) getPendingRegistration(accountId)
      .then(registration => { if (active) setState({ accountId, registration }); })
      .catch(() => { if (active) setState(null); });
    return () => { active = false; };
  }, [accountId]));
  const pending = state?.accountId === accountId ? state?.registration : null;
  if (!pending) return null;
  return <Pressable style={s.card} accessibilityRole="button"
    accessibilityLabel={`Tiếp tục đăng ký gói ${pending.TenGoi}`}
    onPress={() => router.push({ pathname: '/package-resume', params: { registrationId: String(pending.DangKyID) } })}>
    <View style={s.icon}><Ionicons name="time-outline" size={24} color={Palette.accentInk} /></View>
    <View style={s.copy}><Text style={s.title}>Bạn đang đăng ký {pending.TenGoi}</Text>
      <Text style={s.note}>{pending.SoThang} tháng · Đăng ký đã được lưu</Text>
      <Text style={s.action}>Tiếp tục đăng ký →</Text></View>
  </Pressable>;
}
const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface },
  icon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 }, title: { color: Palette.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  note: { color: Palette.muted, fontSize: 12, marginTop: 5 }, action: { color: Palette.accentInk, fontSize: 12, fontWeight: '700', marginTop: 8 },
});
