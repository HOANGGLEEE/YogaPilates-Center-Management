import { Palette } from '@/constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import BackendImage from '@/components/backend-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

import Header from '@/app/Common/header';
import { useAuth } from '@/context/AuthContext';
import { getCheckInHistory } from '@/lib/check-in-api';
import { isCompleted } from '@/lib/check-in-summary';
import {
  getCurrentMembership,
  type CurrentMembership,
} from '@/lib/membership-api';
import {
  getActivePackageDetail,
  packageFromApiDetail,
} from '@/lib/package-api';
import type { GymPackage } from '@/lib/packages';
import {
  getMemberProfile,
  updateMemberProfile,
  type MemberProfile,
} from '@/lib/profile-api';

const menuItems = [
  ['user', 'Hồ sơ cá nhân'],
  ['bell-o', 'Thông báo'],
  ['credit-card', 'Lịch sử giao dịch'],
  ['history', 'Đổi mật khẩu tài khoản'],
  ['info-circle', 'Chính sách bảo lưu thẻ tập'],
  ['bell-o', 'Cài đặt thông báo & Nhắc lịch tập'],
];

function Field({
  label,
  value,
  onChangeText,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        style={styles.fieldInput}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { logout, user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [form, setForm] = useState({
    HoTen: '',
    SoDienThoai: '',
    NgaySinh: '',
    GioiTinh: '',
    DiaChi: '',
    ChieuCao: '',
    CanNang: '',
    MucTieuTheHinh: '',
  });
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const setField = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const loadProfile = useCallback(async () => {
    if (!user?.accountId) return;
    try {
      const row = await getMemberProfile(user.accountId);
      setProfile(row);
      setForm({
        HoTen: row.HoTen || '',
        SoDienThoai: row.SoDienThoai || '',
        NgaySinh: row.NgaySinh || '',
        GioiTinh: row.GioiTinh || '',
        DiaChi: row.DiaChi || '',
        ChieuCao: row.ChieuCao == null ? '' : String(row.ChieuCao),
        CanNang: row.CanNang == null ? '' : String(row.CanNang),
        MucTieuTheHinh: row.MucTieuTheHinh || '',
      });
      setProfileError('');
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : 'Không tải được hồ sơ'
      );
    }
  }, [user?.accountId]);
  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );
  async function saveProfile() {
    if (!user?.accountId || saving) return;
    if (
      !form.HoTen.trim() ||
      (form.SoDienThoai && !/^0\d{9,10}$/.test(form.SoDienThoai)) ||
      (form.NgaySinh && !/^\d{4}-\d{2}-\d{2}$/.test(form.NgaySinh)) ||
      (form.GioiTinh && !['NAM', 'NU', 'KHAC'].includes(form.GioiTinh)) ||
      [form.ChieuCao, form.CanNang].some(
        (v) =>
          v &&
          (!Number.isFinite(Number(v)) || Number(v) <= 0 || Number(v) > 999)
      )
    ) {
      Alert.alert(
        'Thông tin không hợp lệ',
        'Kiểm tra họ tên, số điện thoại, ngày sinh (YYYY-MM-DD), giới tính (NAM/NU/KHAC), chiều cao và cân nặng.'
      );
      return;
    }
    setSaving(true);
    try {
      await updateMemberProfile(user.accountId, {
        HoTen: form.HoTen.trim(),
        SoDienThoai: form.SoDienThoai || null,
        NgaySinh: form.NgaySinh || null,
        GioiTinh: form.GioiTinh || null,
        DiaChi: form.DiaChi || null,
        ChieuCao: form.ChieuCao ? Number(form.ChieuCao) : null,
        CanNang: form.CanNang ? Number(form.CanNang) : null,
        MucTieuTheHinh: form.MucTieuTheHinh || null,
      });
      await loadProfile();
      await refreshUser();
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật.');
    } catch (error) {
      Alert.alert(
        'Không thể lưu',
        error instanceof Error ? error.message : 'Vui lòng thử lại'
      );
    } finally {
      setSaving(false);
    }
  }
  const [today] = useState(() => new Date());
  const [activeMembership, setActiveMembership] =
    useState<CurrentMembership | null>(null);
  const [activePackage, setActivePackage] = useState<GymPackage | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (user?.accountId)
        Promise.all([
          getCurrentMembership(user.accountId).catch(() => null),
          getCheckInHistory(user.accountId).catch(() => []),
        ])
          .then(async ([membership, history]) => {
            const gymPackage = membership
              ? await getActivePackageDetail(membership.GoiTapID)
                  .then(packageFromApiDetail)
                  .catch(() => null)
              : null;
            if (active) {
              setActiveMembership(membership);
              setActivePackage(gymPackage);
              const completedSessions = history.filter(isCompleted);
              setCheckInCount(completedSessions.length);
            }
          })
          .catch(() => {
            if (active) {
              setActiveMembership(null);
              setActivePackage(null);
              setCheckInCount(0);
            }
          });
      return () => {
        active = false;
      };
    }, [user])
  );
  const remainingDays = activeMembership
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${activeMembership.NgayKetThuc}T00:00:00`).getTime() -
            today.getTime()) /
            86400000
        )
      )
    : 0;
  const startsInDays = activeMembership
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${activeMembership.NgayBatDau}T00:00:00`).getTime() -
            today.getTime()) /
            86400000
        )
      )
    : 0;
  async function handleLogout() {
    await logout();
    router.replace('/login');
  }
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Header />
          <View style={styles.personalDivider}>
            <Text style={styles.kicker}>♙ HỒ SƠ HỘI VIÊN</Text>
          </View>
          <>
            <View style={styles.memberHero}>
              <View style={styles.memberAvatar}>
                <BackendImage
                  value={profile ? profile.AnhDaiDien : user?.avatar}
                  fallback={require('../../assets/images/icon.png')}
                  style={styles.memberImage}
                  contentFit="cover"
                />
                <View style={styles.camera}>
                  <FontAwesome name="camera" size={11} color={Palette.text} />
                </View>
              </View>
              <Text style={styles.memberName}>
                {user?.name ?? 'Hội viên Yoga & Pilates'}
              </Text>
              <Text style={styles.memberTier}>
                ✦ {activePackage?.tier ?? 'HỘI VIÊN YOGA & PILATES'}
              </Text>
              <Text style={styles.contact}>
                ✉ {user?.email} ☎ {user?.phone}
              </Text>
              <View style={styles.memberStats}>
                <View>
                  <Text style={styles.statNumber}>{checkInCount}</Text>
                  <Text style={styles.statLabel}>BUỔI TẬP</Text>
                </View>
                <View>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>BUỔI 1-1</Text>
                </View>
                <View>
                  <Text style={styles.statNumber}>
                    {activeMembership?.TinhTrangSuDung === 'UPCOMING'
                      ? startsInDays
                      : activeMembership
                        ? remainingDays
                        : 0}
                  </Text>
                  <Text style={styles.statLabel}>
                    {activeMembership?.TinhTrangSuDung === 'UPCOMING'
                      ? 'NGÀY ĐẾN KHI BẮT ĐẦU'
                      : 'NGÀY CÒN LẠI'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>THẺ THÀNH VIÊN HIỆN HÀNH</Text>
              <Text style={styles.sectionAction}>
                {activeMembership?.TinhTrangSuDung === 'ACTIVE'
                  ? 'ĐANG HOẠT ĐỘNG'
                  : activeMembership
                    ? 'CHỜ KÍCH HOẠT'
                    : 'CHƯA CÓ THẺ'}
              </Text>
            </View>
            <View style={styles.passCard}>
              <Text style={styles.passKicker}>
                {activePackage?.tier ?? 'YOGA & PILATES MEMBERSHIP'}
              </Text>
              <Text style={styles.passName}>
                {activeMembership?.TenGoi.toUpperCase() ??
                  'CHƯA CÓ GÓI TẬP HOẠT ĐỘNG'}
              </Text>
              {activeMembership ? (
                <>
                  <View style={styles.passInfo}>
                    <Text style={styles.passLabel}>
                      MÃ THẺ{`\n`}
                      QA-{activeMembership.DangKyID}
                    </Text>
                    <Text style={styles.passLabel}>
                      {activeMembership.TinhTrangSuDung === 'UPCOMING'
                        ? 'BẮT ĐẦU NGÀY'
                        : 'THỜI HẠN'}
                      {`\n`}
                      {new Date(
                        `${activeMembership.NgayBatDau}T00:00:00`
                      ).toLocaleDateString('vi-VN')}
                      {activeMembership.TinhTrangSuDung === 'ACTIVE'
                        ? ' → '
                        : ''}
                      {activeMembership.TinhTrangSuDung === 'ACTIVE'
                        ? new Date(
                            `${activeMembership.NgayKetThuc}T00:00:00`
                          ).toLocaleDateString('vi-VN')
                        : ''}{' '}
                      <Text style={styles.passGreen}>
                        {activeMembership.TinhTrangSuDung === 'ACTIVE'
                          ? `(Còn ${remainingDays} ngày)`
                          : ''}
                      </Text>
                    </Text>
                  </View>
                  <Text style={styles.passBenefits}>ĐẶC QUYỀN BAO GỒM:</Text>
                  <View style={styles.benefitPills}>
                    {activePackage?.privileges.slice(0, 4).map((item) => (
                      <Text style={styles.benefitPill} key={item.id}>
                        ◉ {item.title}
                      </Text>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.passMutedText}>
                  Đơn chờ thanh toán không tạo mã vào cửa.
                </Text>
              )}
              <View style={styles.passActions}>
                <Pressable
                  style={styles.darkButton}
                  onPress={() => router.push('/check-in-pass')}
                >
                  <Text style={styles.darkButtonText}>▧ MÃ QR CHECK-IN</Text>
                </Pressable>
                <Pressable
                  style={styles.primaryButtonSmall}
                  onPress={() => router.push('/membership-detail')}
                >
                  <Text style={styles.primaryButtonSmallText}>
                    GÓI TẬP CỦA TÔI
                  </Text>
                </Pressable>
              </View>
            </View>
            <Pressable
              style={styles.ordersButton}
              onPress={() => router.push('/check-in-history')}
              accessibilityLabel="Xem lịch sử check-in"
            >
              <FontAwesome name="history" size={12} color={Palette.text} />
              <Text style={styles.ordersButtonText}>LỊCH SỬ CHECK-IN</Text>
              <FontAwesome name="arrow-right" size={11} color={Palette.text} />
            </Pressable>
            <Pressable
              style={styles.ptBookingButton}
              onPress={() => router.push('/pt-schedule')}
              accessibilityLabel="Xem lịch hướng dẫn 1-1"
            >
              <FontAwesome name="calendar" size={12} color={Palette.text} />
              <Text style={styles.ptBookingButtonText}>LỊCH HƯỚNG DẪN 1-1</Text>
              <FontAwesome name="arrow-right" size={11} color={Palette.text} />
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable
              style={styles.ordersButton}
              onPress={() => router.push('/orders')}
              accessibilityLabel="Xem đơn hàng của tôi"
            >
              <FontAwesome name="shopping-bag" size={12} color={Palette.text} />
              <Text style={styles.ordersButtonText}>ĐƠN HÀNG CỦA TÔI</Text>
              <FontAwesome name="arrow-right" size={11} color={Palette.text} />
            </Pressable>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                ▣ LỊCH SỬ GIAO DỊCH GẦN ĐÂY
              </Text>
            </View>
            <Pressable
              style={styles.viewAllOrdersButton}
              onPress={() => router.push('/transaction-history')}
              accessibilityLabel="Xem tất cả giao dịch"
            >
              <Text style={styles.viewAllOrdersText}>XEM TẤT CẢ</Text>
              <FontAwesome name="arrow-right" size={11} color={Palette.accentInk} />
            </Pressable>
          </>
          <View style={styles.pageIntro}>
            <Text style={styles.kicker}>♧ CÀI ĐẶT THÔNG TIN CÁ NHÂN</Text>
          </View>
          <View style={styles.formCard}>
            {profileError ? (
              <Text style={styles.fieldLabel}>{profileError}</Text>
            ) : null}
            <Field
              label="HỌ VÀ TÊN"
              value={form.HoTen}
              onChangeText={setField('HoTen')}
            />
            <Field
              label="EMAIL ĐĂNG NHẬP"
              value={profile?.EmailDangNhap || user?.email || ''}
              editable={false}
            />
            <Field
              label="SỐ ĐIỆN THOẠI"
              value={form.SoDienThoai}
              onChangeText={setField('SoDienThoai')}
            />
            <Field
              label="GIỚI TÍNH (NAM/NU/KHAC)"
              value={form.GioiTinh}
              onChangeText={setField('GioiTinh')}
            />
            <Field
              label="ĐỊA CHỈ"
              value={form.DiaChi}
              onChangeText={setField('DiaChi')}
            />
            <View style={styles.tripleRow}>
              <Field
                label="CHIỀU CAO (CM)"
                value={form.ChieuCao}
                onChangeText={setField('ChieuCao')}
              />
              <Field
                label="CÂN NẶNG (KG)"
                value={form.CanNang}
                onChangeText={setField('CanNang')}
              />
              <Field
                label="NGÀY SINH"
                value={form.NgaySinh}
                onChangeText={setField('NgaySinh')}
              />
            </View>
            <Field
              label="MỤC TIÊU LUYỆN TẬP"
              value={form.MucTieuTheHinh}
              onChangeText={setField('MucTieuTheHinh')}
            />
            <Pressable
              style={styles.primaryButton}
              onPress={saveProfile}
              disabled={saving || !profile}
            >
              <FontAwesome name="save" size={12} color={Palette.text} />
              <Text style={styles.primaryText}>
                {saving ? 'ĐANG LƯU...' : 'CẬP NHẬT THÔNG TIN'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.menuCard}>
            {menuItems.map(([icon, label]) => (
              <Pressable
                style={styles.menuRow}
                key={label}
                onPress={
                  label === 'Hồ sơ cá nhân'
                    ? () => loadProfile()
                    : label === 'Thông báo'
                      ? () => router.push('/notifications')
                      : label === 'Lịch sử giao dịch'
                        ? () => router.push('/transaction-history')
                        : label === 'Đổi mật khẩu tài khoản'
                          ? () => router.push('/password-change')
                          : label === 'Cài đặt thông báo & Nhắc lịch tập'
                            ? () => router.push('/notifications' as never)
                            : undefined
                }
                accessibilityRole={
                  label === 'Đổi mật khẩu tài khoản' ||
                  label === 'Cài đặt thông báo & Nhắc lịch tập'
                    ? 'button'
                    : undefined
                }
              >
                <FontAwesome name={icon as never} size={14} color={Palette.accentInk} />
                <Text style={styles.menuText}>{label}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.logout}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất tài khoản"
          >
            <FontAwesome name="sign-out" size={13} color={Palette.muted} />
            <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
          </Pressable>
          <Text style={styles.version}>
            YOGA & PILATES APP V2.4.0 • MOVE WITH BALANCE
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  pageIntro: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    marginTop: 30,
    paddingVertical: 12,
  },
  personalDivider: { marginTop: 0, paddingTop: 0, marginBottom: 2 },
  kicker: { color: Palette.accentInk, fontSize: 11, fontWeight: '900' },
  formCard: { backgroundColor: Palette.surface, borderRadius: 10, padding: 11 },
  field: { flex: 1, marginBottom: 10 },
  fieldLabel: {
    color: Palette.muted,
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 5,
  },
  fieldInput: {
    color: Palette.text,
    backgroundColor: Palette.background,
    borderRadius: 6,
    minHeight: 34,
    paddingHorizontal: 9,
    fontSize: 11,
  },
  tripleRow: { flexDirection: 'row', gap: 7 },
  selectBox: {
    minHeight: 36,
    backgroundColor: Palette.background,
    borderRadius: 6,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { color: Palette.text, fontSize: 10 },
  chevron: { color: Palette.accentInk, fontSize: 19 },
  primaryButton: {
    minHeight: 34,
    backgroundColor: Palette.accent,
    borderRadius: 7,
    marginTop: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  primaryText: { color: Palette.text, fontSize: 10, fontWeight: '900' },
  menuCard: {
    backgroundColor: Palette.surface,
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 11,
  },
  menuRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    gap: 10,
  },
  menuText: { color: Palette.text, fontSize: 10, flex: 1 },
  menuArrow: { color: Palette.accentInk, fontSize: 21 },
  logout: {
    minHeight: 34,
    borderRadius: 7,
    backgroundColor: Palette.surface,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  logoutText: { color: Palette.muted, fontSize: 10, fontWeight: '800' },
  version: {
    color: Palette.muted,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 12,
  },
  memberHero: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: 10,
    padding: 13,
  },
  memberAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Palette.accentInk,
    padding: 2,
    position: 'relative',
  },
  memberImage: { width: '100%', height: '100%', borderRadius: 36 },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    color: Palette.accentInk,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 7,
  },
  verified: { color: Palette.accentInk, fontSize: 11 },
  memberTier: {
    color: Palette.accentInk,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 3,
  },
  contact: { color: Palette.muted, fontSize: 9, marginTop: 8 },
  memberStats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    backgroundColor: Palette.surface,
    borderRadius: 8,
    marginTop: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  statNumber: {
    color: Palette.accentInk,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    color: Palette.muted,
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: { color: Palette.text, fontSize: 10, fontWeight: '900' },
  sectionAction: { color: Palette.accentInk, fontSize: 8, fontWeight: '900' },
  ptBookingButton: {
    minHeight: 34,
    borderRadius: 7,
    backgroundColor: Palette.accent,
    marginTop: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  ptBookingButtonText: { color: Palette.text, fontSize: 9, fontWeight: '900' },
  actionDivider: { height: 1, backgroundColor: Palette.surface, marginTop: 7 },
  ordersButton: {
    minHeight: 34,
    borderRadius: 7,
    backgroundColor: Palette.accent,
    marginTop: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  ordersButtonText: { color: Palette.text, fontSize: 9, fontWeight: '900' },
  passCard: { backgroundColor: Palette.surface, borderRadius: 9, padding: 12 },
  passKicker: { color: Palette.accentInk, fontSize: 8, fontWeight: '900' },
  passName: { color: Palette.accentInk, fontSize: 15, fontWeight: '900', marginTop: 3 },
  passInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  passLabel: { color: Palette.muted, fontSize: 9, lineHeight: 13 },
  passGreen: { color: Palette.accentInk },
  passMutedText: { color: Palette.muted, fontSize: 8 },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.background,
    marginTop: 5,
  },
  progress: {
    width: '68%',
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.accent,
  },
  passBenefits: {
    color: Palette.muted,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 13,
  },
  benefitPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  benefitPill: {
    color: Palette.text,
    fontSize: 8,
    backgroundColor: Palette.soft,
    padding: 4,
    borderRadius: 4,
  },
  passActions: { flexDirection: 'row', gap: 7, marginTop: 13 },
  darkButton: {
    flex: 1,
    backgroundColor: Palette.background,
    borderRadius: 7,
    minHeight: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkButtonText: { color: Palette.text, fontSize: 9, fontWeight: '800' },
  primaryButtonSmall: {
    flex: 1,
    backgroundColor: Palette.accent,
    borderRadius: 7,
    minHeight: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonSmallText: { color: Palette.text, fontSize: 9, fontWeight: '900' },
  transactions: { gap: 7 },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 8,
    padding: 9,
  },
  transactionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    color: Palette.accentInk,
    textAlign: 'center',
    paddingTop: 6,
    marginRight: 8,
  },
  transactionCopy: { flex: 1 },
  transactionTitle: { color: Palette.text, fontSize: 9, fontWeight: '900' },
  success: {
    color: Palette.text,
    backgroundColor: Palette.accent,
    fontSize: 7,
    paddingHorizontal: 3,
  },
  transactionName: { color: Palette.muted, fontSize: 9, marginTop: 3 },
  viewAllOrdersButton: {
    minHeight: 32,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surface,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  viewAllOrdersText: { color: Palette.accentInk, fontSize: 9, fontWeight: '900' },
  transactionDate: { color: Palette.muted, fontSize: 8, marginTop: 3 },
  transactionAmount: { alignItems: 'flex-end' },
  transactionAmountText: { color: Palette.accentInk, fontSize: 9, fontWeight: '900' },
  transactionDetail: { color: Palette.muted, fontSize: 8, marginTop: 4 },
});
