import { Palette } from '@/constants/theme';
import ClassPreview from '@/components/class-preview';
import { Image } from 'expo-image';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Header from '@/app/Common/header';
import PendingPackageNotice from '@/components/pending-package-notice';
import GymCrowdingCard from '@/components/gym-crowding';

const images = {
  hero: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&q=85',
  strength:
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=700&q=85',
  hiit: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=85',
  yoga: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=700&q=85',
};

const workouts = [
  {
    icon: <MaterialCommunityIcons name="check-circle" />,
    value: 'Yoga',
    label: 'Hơi thở & chuyển động',
    color: Palette.accentInk,
  },
  {
    icon: <MaterialCommunityIcons name="hot-tub" />,
    value: 'Pilates',
    label: 'Sức mạnh cốt lõi',
    color: Palette.accentInk,
  },
  {
    icon: <Ionicons name="body" />,
    value: 'Mindfulness',
    label: 'Chú tâm từng khoảnh khắc',
    color: Palette.accentInk,
  },
  {
    icon: <Ionicons name="fast-food" />,
    value: 'Balance',
    label: 'Cân bằng & linh hoạt',
    color: Palette.accentInk,
  },
];

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {action && <Text style={styles.sectionAction}>{action}</Text>}
    </View>
  );
}

function StatCard({ icon, value, label, color }: (typeof workouts)[number]) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function WorkoutCard({
  image,
  title,
  detail,
  tag,
}: {
  image: string;
  title: string;
  detail: string;
  tag: string;
}) {
  return (
    <View style={styles.workoutCard}>
      <Image
        source={{ uri: image }}
        style={styles.workoutImage}
        contentFit="cover"
      />
      <View style={styles.workoutOverlay} />
      <View style={styles.workoutTag}>
        <Text style={styles.workoutTagText}>{tag}</Text>
      </View>
      <View style={styles.workoutCopy}>
        <Text style={styles.workoutTitle}>{title}</Text>
        <Text style={styles.workoutDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const packages = () => {
  router.replace('/packages');
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Header />
          <PendingPackageNotice />

          <View style={styles.greeting}>
            <Text style={styles.kicker}>Chào mừng</Text>
            <Text style={styles.greetingTitle}>Sẵn sàng tìm lại cân bằng?</Text>
            <Text style={styles.greetingCopy}>
              Hôm nay là một ngày tuyệt vời để chăm sóc cơ thể.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <Image
              source={{ uri: images.hero }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <View style={styles.heroShade} />
            <View style={styles.heroCopy}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>✦ ƯU ĐÃI ĐẶC BIỆT</Text>
              </View>
              <Text style={styles.heroTitle}>
                Tập luyện{`\n`}không giới hạn
              </Text>
              <Text style={styles.heroDetail}>
                Khám phá gói Yoga & Pilates phù hợp với bạn
              </Text>
              <TouchableOpacity onPress={packages} style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Xem gói hội viên →</Text>
              </TouchableOpacity>
            </View>
          </View>

          <GymCrowdingCard />
          <SectionTitle title="Khám phá tiện ích" />
          <View style={styles.statsGrid}>
            {workouts.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </View>

          <SectionTitle title="Khu vực luyện tập" action="3 khu vực" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            <WorkoutCard
              image={images.hiit}
              title="Pilates Studio"
              detail="Thực hành sức mạnh cốt lõi và kiểm soát chuyển động"
              tag="PILATES"
            />
            <WorkoutCard
              image={images.strength}
              title="Yoga Flow"
              detail="Kết nối hơi thở cùng chuyển động"
              tag="YOGA"
            />
            <WorkoutCard
              image={images.yoga}
              title="Mind & Body"
              detail="Yoga, stretching và thiền"
              tag="YÊN TĨNH"
            />
          </ScrollView>

          <ClassPreview />

          <View style={styles.ctaCard}>
            <Text style={styles.ctaIcon}>♨</Text>
            <Text style={styles.ctaKicker}>TRẢI NGHIỆM KHÁC BIỆT MỖI NGÀY</Text>
            <Text style={styles.ctaTitle}>Đăng ký trải nghiệm</Text>
            <Text style={styles.ctaCopy}>
              Tận hưởng đầy đủ tiện ích cao cấp và cảm nhận sự thay đổi.
            </Text>
            <TouchableOpacity onPress={packages} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>ĐĂNG KÝ TẬP NGAY →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerNote}>
            ⌁ Áp dụng cho hội viên mới • Điều kiện áp dụng
          </Text>
        </ScrollView>
      </SafeAreaView>
      <TouchableOpacity
        style={[styles.checkInShortcut, { bottom: Math.max(insets.bottom, 16) + 12 }]}
        onPress={() => router.push('/check-in-pass')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Mở mã QR check-in"
        accessibilityHint="Mở màn hình mã QR để vào phòng tập"
      >
        <View style={styles.checkInBot}>
          <MaterialCommunityIcons name="robot-outline" size={30} color={Palette.text} />
          <View style={styles.checkInQrBadge}>
            <Ionicons name="qr-code" size={13} color={Palette.text} />
          </View>
        </View>
        <Text style={styles.checkInShortcutLabel}>QR check-in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  checkInShortcut: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.accentInk,
    backgroundColor: Palette.surface,
    elevation: 6,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  checkInBot: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: Palette.accent,
  },
  checkInQrBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 21,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Palette.border,
    backgroundColor: Palette.accent,
  },
  checkInShortcutLabel: { color: Palette.muted, fontSize: 11, fontWeight: '700' },
  greeting: { marginBottom: 18 },
  kicker: {
    color: Palette.accentInk,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  greetingTitle: {
    color: Palette.accentInk,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  greetingCopy: { color: Palette.muted, fontSize: 13, marginTop: 6 },
  heroCard: {
    height: 204,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 26,
  },
  heroImage: { ...StyleSheet.absoluteFill },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.imageScrim,
  },
  heroCopy: { flex: 1, padding: 18, justifyContent: 'center' },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accent,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
  },
  pillText: { color: Palette.text, fontSize: 10, fontWeight: '900' },
  heroTitle: { color: Palette.white, fontSize: 25, fontWeight: '900', lineHeight: 26 },
  heroDetail: { color: Palette.white, fontSize: 12, marginTop: 7 },
  heroButton: {
    backgroundColor: Palette.accent,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 13,
  },
  heroButtonText: { color: Palette.text, fontSize: 11, fontWeight: '900' },
  sectionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: { color: Palette.accentInk, fontSize: 16, fontWeight: '800' },
  sectionAction: { color: Palette.accentInk, fontSize: 10, fontWeight: '900' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 26,
  },
  statCard: {
    backgroundColor: Palette.surface,
    borderRadius: 8,
    padding: 11,
    width: '48.8%',
    minHeight: 82,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  statIcon: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  statValue: { color: Palette.accentInk, fontSize: 13, fontWeight: '800' },
  statLabel: { color: Palette.muted, fontSize: 10, marginTop: 3 },
  horizontalList: { gap: 10, paddingBottom: 26 },
  workoutCard: {
    width: 180,
    height: 174,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
  },
  workoutImage: { ...StyleSheet.absoluteFill },
  workoutOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.imageScrim,
  },
  workoutTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Palette.accent,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 3,
  },
  workoutTagText: { color: Palette.text, fontSize: 8, fontWeight: '900' },
  workoutCopy: { position: 'absolute', left: 12, right: 10, bottom: 11 },
  workoutTitle: { color: Palette.white, fontSize: 15, fontWeight: '900' },
  workoutDetail: {
    color: Palette.white,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 13,
  },
  schedule: {
    backgroundColor: Palette.surface,
    borderRadius: 9,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  scheduleRow: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    gap: 11,
  },
  scheduleTime: {
    color: Palette.accentInk,
    fontSize: 12,
    fontWeight: '900',
    width: 39,
  },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { color: Palette.text, fontSize: 12, fontWeight: '800' },
  scheduleRoom: { color: Palette.muted, fontSize: 10, marginTop: 4 },
  seatPill: {
    backgroundColor: Palette.soft,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  seatText: { color: Palette.accentInk, fontSize: 9, fontWeight: '800' },
  reviewCard: {
    backgroundColor: Palette.surface,
    borderRadius: 9,
    padding: 14,
    marginBottom: 24,
  },
  stars: { color: Palette.accentInk, fontSize: 14, letterSpacing: 1 },
  rating: { color: Palette.text, fontSize: 12, letterSpacing: 0 },
  reviewQuote: { color: Palette.text, fontSize: 12, lineHeight: 17, marginTop: 8 },
  reviewAuthor: { color: Palette.muted, fontSize: 10, marginTop: 7 },
  ctaCard: {
    backgroundColor: Palette.surface,
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  ctaIcon: { color: Palette.accentInk, fontSize: 23, marginBottom: 8 },
  ctaKicker: {
    color: Palette.accentInk,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  ctaTitle: {
    color: Palette.accentInk,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 7,
  },
  ctaCopy: {
    color: Palette.muted,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
  },
  ctaButton: {
    backgroundColor: Palette.accent,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 5,
    marginTop: 15,
  },
  ctaButtonText: { color: Palette.text, fontSize: 10, fontWeight: '900' },
  footerNote: {
    color: Palette.muted,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 10,
  },
});
