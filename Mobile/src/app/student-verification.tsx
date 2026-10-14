import { Palette } from '@/constants/theme';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { requestStudentVerification } from '@/lib/student-verification';

export default function StudentVerificationScreen() {
  const { user } = useAuth();
  const { packageId, durationId, duration } = useLocalSearchParams<{
    packageId?: string;
    durationId?: string;
    duration?: string;
  }>();
  const [schoolName, setSchoolName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [message, setMessage] = useState('');
  async function submit() {
    if (!user) return setMessage('Vui lòng đăng nhập.');
    try {
      await requestStudentVerification({
        userId: user.email,
        schoolName,
        studentId,
        expiryDate,
      });
      setMessage(
        'Đã lưu yêu cầu chờ xác minh. Gói HSSV chỉ đăng ký được sau khi được duyệt.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Không thể lưu yêu cầu.'
      );
    }
  }
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Xác minh HSSV</Text>
        <Text style={s.note}>
          Thông tin được lưu trên thiết bị ở trạng thái chờ duyệt; ứng dụng
          không tự xác minh thẻ.
        </Text>
        <TextInput
          style={s.input}
          placeholder="Tên trường"
          placeholderTextColor={Palette.muted}
          value={schoolName}
          onChangeText={setSchoolName}
        />
        <TextInput
          style={s.input}
          placeholder="Mã học sinh/sinh viên"
          placeholderTextColor={Palette.muted}
          value={studentId}
          onChangeText={setStudentId}
        />
        <TextInput
          style={s.input}
          placeholder="Ngày hết hạn thẻ (YYYY-MM-DD)"
          placeholderTextColor={Palette.muted}
          value={expiryDate}
          onChangeText={setExpiryDate}
        />
        <Pressable style={s.button} onPress={submit}>
          <Text style={s.buttonText}>GỬI YÊU CẦU XÁC MINH</Text>
        </Pressable>
        {message ? <Text style={s.note}>{message}</Text> : null}
        <Pressable
          onPress={() =>
            router.replace({
              pathname: '/package-detail',
              params: { id: packageId, durationId, duration },
            })
          }
        >
          <Text style={s.link}>QUAY LẠI GÓI HSSV</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  content: { padding: 20, gap: 14 },
  title: { color: Palette.text, fontSize: 25, fontWeight: '900' },
  note: { color: Palette.muted, fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: Palette.surface,
    color: Palette.text,
    borderRadius: 9,
    padding: 14,
  },
  button: {
    backgroundColor: Palette.accent,
    borderRadius: 9,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: { color: Palette.text, fontWeight: '900' },
  link: { color: Palette.accentInk, textAlign: 'center', marginTop: 12 },
});
