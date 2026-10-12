import type { ImageSourcePropType } from 'react-native';
import { diamondDurations } from '@/lib/package-logic';

export type PackageClass = {
  id: string;
  name: string;
  minutes: number;
  kcal: number;
  description: string;
  tag: string;
  image: ImageSourcePropType;
};
export const enrollmentGifts = [
  {
    id: 'duffle',
    quantity: 1,
    name: 'Túi trống thể thao Yoga & Pilates Duffle Pro',
    detail: 'Trị giá 850.000₫ · Miễn phí',
    image:
      require('../../assets/packages/diamond/enrollment/duffle-pro.jpg') as ImageSourcePropType,
  },
  {
    id: 'shaker',
    quantity: 1,
    name: 'Bình nước studio 800ml',
    detail: 'Trị giá 320.000₫ · Miễn phí',
    image:
      require('../../assets/packages/diamond/enrollment/shaker-pro.jpg') as ImageSourcePropType,
  },
  {
    id: 'pt-gift',
    quantity: 3,
    name: 'Buổi hướng dẫn Yoga & Pilates 1-1',
    detail: 'Đo InBody & xây dựng lộ trình tập',
    image:
      require('../../assets/packages/diamond/classes/power-yoga.jpg') as ImageSourcePropType,
  },
] as const;
export const homeClubs = [
  { id: 'q1-vincom', name: 'Yoga & Pilates Center - Chi nhánh Quận 1' },
  { id: 'q7-platinum', name: 'Yoga & Pilates Platinum - Chi nhánh Quận 7' },
  { id: 'cau-giay', name: 'Yoga & Pilates Center - Cầu Giấy, Hà Nội' },
  { id: 'binh-thanh', name: 'Yoga & Pilates Express - Bình Thạnh' },
] as const;
export const diamondPackage = {
  id: 'diamond-all-access',
  name: 'Diamond All-Access Pass',
  tier: 'YOGA & PILATES ELITE CLUB',
  description:
    'Trải nghiệm huấn luyện đỉnh cao không giới hạn tại toàn bộ không gian phòng tập hạng sang.',
  hero: require('../../assets/packages/diamond/classes/power-yoga.jpg') as ImageSourcePropType,
  durations: diamondDurations,
  rating: 4.9,
  reviewCount: '850+ Hội viên',
  privileges: [
    {
      id: 'clubs',
      icon: 'infinite-outline',
      title: 'Tập luyện không giới hạn 24/7',
      badge: 'ALL CLUBS',
      description:
        'Tự do check-in bất kỳ lúc nào tại toàn bộ 14 chi nhánh Yoga & Pilates trên toàn quốc.',
      accent: 'lime',
    },
    {
      id: 'pt',
      icon: 'leaf-outline',
      title: '03 Buổi tập chuyên sâu 1-1',
      badge: 'Trị giá 1.500.000₫',
      description:
        'Huấn luyện cá nhân hoá cùng HLV Pro Master định hướng giáo án tư thế, hơi thở và sức mạnh cốt lõi.',
      accent: 'mint',
    },
    {
      id: 'inbody',
      icon: 'pulse-outline',
      title: 'Phân tích InBody 770 miễn phí',
      badge: 'Định kỳ tháng',
      description:
        'Theo dõi tỷ lệ mỡ nội tạng, cơ nạc và khối lượng nước chuẩn y khoa qua hệ thống máy InBody 770 cao cấp.',
      accent: 'cyan',
    },
    {
      id: 'companion',
      icon: 'people-outline',
      title: 'Đi cùng 01 bạn đồng hành',
      badge: 'T7 & CN',
      description:
        'Mang theo 01 người bạn cùng tập luyện và trải nghiệm toàn bộ tiện ích vào mỗi dịp cuối tuần.',
      accent: 'lime',
    },
    {
      id: 'sauna',
      icon: 'flame-outline',
      title: 'Tổ hợp Sauna Đá Muối Himalaya',
      badge: 'Không giới hạn',
      description:
        'Phục hồi cơ bắp và thanh lọc độc tố với phòng xông khô đá muối Himalaya & xông ướt thảo dược tự nhiên.',
      accent: 'mint',
    },
    {
      id: 'daily',
      icon: 'cafe-outline',
      title: 'Nước Detox, Khăn tập & Smart Locker',
      badge: 'Free Daily',
      description:
        'Cung cấp khăn cotton mềm kháng khuẩn, đồ uống detox ion kiềm và tủ locker thông minh bảo mật RFID.',
      accent: 'cyan',
    },
    {
      id: 'shop',
      icon: 'bag-handle-outline',
      title: 'Giảm 15% tại Studio Shop',
      badge: '-15% MỌI ĐƠN',
      description:
        'Ưu đãi giảm giá độc quyền cho các dòng thảm tập, gạch Yoga, dây hỗ trợ và phụ kiện Pilates.',
      accent: 'lime',
    },
  ],
  classes: [
    {
      id: 'bodypump',
      name: 'Mat Pilates',
      minutes: 55,
      kcal: 600,
      tag: 'Core & Control',
      description:
        'Thực hành Pilates trên thảm, tập trung vào kiểm soát và sức mạnh cốt lõi.',
      image: require('../../assets/packages/diamond/classes/power-yoga.jpg'),
    },
    {
      id: 'rpm',
      name: 'Pilates Core',
      minutes: 45,
      kcal: 680,
      tag: 'Alignment',
      description:
        'Kết hợp hơi thở và các bài tập ổn định vùng trung tâm.',
      image: require('../../assets/packages/diamond/classes/power-yoga.jpg'),
    },
    {
      id: 'yoga',
      name: 'Power Yoga',
      minutes: 60,
      kcal: 350,
      tag: 'Mind & Body',
      description:
        'Tăng cường độ dẻo dai cơ bắp, cân bằng và giảm stress hiệu quả.',
      image: require('../../assets/packages/diamond/classes/power-yoga.jpg'),
    },
    {
      id: 'boxing',
      name: 'Hatha Yoga',
      minutes: 50,
      kcal: 720,
      tag: 'Breath & Balance',
      description:
        'Thực hành tư thế nền tảng cùng nhịp thở chậm và có chủ đích.',
      image: require('../../assets/packages/diamond/classes/power-yoga.jpg'),
    },
    {
      id: 'zumba',
      name: 'Yin Yoga',
      minutes: 50,
      kcal: 550,
      tag: 'Restore',
      description:
        'Thả lỏng với chuỗi tư thế nhẹ nhàng và khoảng nghỉ thư giãn.',
      image: require('../../assets/packages/diamond/classes/power-yoga.jpg'),
    },
  ] as PackageClass[],
  reviews: [
    {
      id: 'nam',
      name: 'Trần Quốc Nam',
      detail: 'Hội viên Diamond • 14 tháng tập',
      avatar:
        require('../../assets/packages/diamond/reviews/quoc-nam.jpg') as ImageSourcePropType,
      quote:
        '"Gói Diamond cực kỳ đáng tiền! Cơ sở vật chất chuẩn quốc tế, phòng sauna đá muối sau mỗi buổi thực hành giúp hồi phục cơ siêu nhanh. Mình thường dắt bạn đi tập cùng vào Chủ nhật rất vui."',
    },
    {
      id: 'my',
      name: 'Hoàng Thảo My',
      detail: 'Hội viên Diamond • 8 tháng tập',
      avatar:
        require('../../assets/packages/diamond/reviews/thao-my.jpg') as ImageSourcePropType,
      quote:
        '"3 buổi 1-1 với Pro Master chỉnh lại hoàn toàn tư thế và cách kiểm soát hơi thở cho mình. Lớp Yoga và Pilates phòng studio âm thanh siêu đỉnh, không hề nhàm chán!"',
    },
  ],
  policies: [
    {
      id: 'pause',
      icon: 'pause-circle-outline',
      title: 'Bảo lưu thẻ tập tối đa 60 ngày',
      description:
        'Thoải mái tạm ngưng khi bận công tác hoặc du lịch dài ngày mà không mất số ngày tập.',
    },
    {
      id: 'transfer',
      icon: 'swap-horizontal-outline',
      title: 'Chuyển nhượng hợp đồng dễ dàng',
      description:
        'Hỗ trợ chuyển đổi chủ sở hữu gói tập nhanh gọn tại quầy lễ tân bất kỳ chi nhánh nào.',
    },
    {
      id: 'installment',
      icon: 'card-outline',
      title: 'Trả góp 0% lãi suất qua thẻ tín dụng',
      description:
        'Kỳ hạn linh hoạt 3, 6, 9 hoặc 12 tháng liên kết cùng 25+ ngân hàng nội địa và quốc tế.',
    },
  ],
} as const;
