import { Palette } from '@/constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import BackendImage from '@/components/backend-image';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/shop-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, getShopProduct, updateCart } from '@/lib/shop-api';

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Awaited<
    ReturnType<typeof getShopProduct>
  > | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adding, setAdding] = useState(false);
  const busy = useRef(false);
  const [reload, setReload] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');
      setProduct(null);
      setQuantity(1);
      setNotice('');
      getShopProduct(Number(productId))
        .then((p) => {
          if (active) setProduct(p);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
      // reload intentionally invalidates the focus callback when retrying.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, reload])
  );
  async function add(openCart: boolean) {
    if (!user?.accountId) {
      router.push('/login');
      return;
    }
    if (!product || busy.current) return;
    busy.current = true;
    setAdding(true);
    setNotice('');
    try {
      await updateCart(user.accountId, product.SanPhamID, quantity);
      setNotice(`Đã thêm ${quantity} sản phẩm vào giỏ hàng.`);
      if (openCart) router.push('/cart');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Không thêm được sản phẩm.');
    } finally {
      busy.current = false;
      setAdding(false);
    }
  }
  const canBuy = product?.TrangThai === 'ACTIVE' && !adding;
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topBar}>
            <Pressable
              style={styles.iconButton}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/product')
              }
              accessibilityLabel="Quay lại"
            >
              <FontAwesome name="arrow-left" size={17} color={Palette.text} />
            </Pressable>
            <Text style={styles.topBarTitle}>CHI TIẾT SẢN PHẨM</Text>
            <Pressable
              style={styles.iconButton}
              onPress={() => router.push('/cart')}
              accessibilityLabel="Mở giỏ hàng"
            >
              <FontAwesome name="shopping-cart" size={17} color={Palette.accentInk} />
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator color={Palette.accentInk} />
          ) : error ? (
            <View>
              <Text style={styles.productDetail}>{error}</Text>
              <Pressable onPress={() => setReload((n) => n + 1)}>
                <Text style={styles.stock}>Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            product && (
              <>
                <View style={styles.hero}>
                  <BackendImage
                    value={product.HinhAnh}
                    fallback={DEFAULT_PRODUCT_IMAGE}
                    style={styles.heroImage}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.productHeader}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.productDetail}>
                      {product.TenDanhMuc}
                    </Text>
                    <Text style={styles.stock}>
                      {product.TrangThai === 'ACTIVE' ? 'CÒN HÀNG' : 'HẾT HÀNG'}
                    </Text>
                  </View>
                  <Text style={styles.productName}>{product.TenSanPham}</Text>
                  <Text style={styles.productDetail}>
                    Đơn vị: {product.DonViTinh}
                  </Text>
                  <View style={styles.priceLine}>
                    <Text style={styles.price}>
                      {formatPrice(product.GiaBan)}
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>MÔ TẢ SẢN PHẨM</Text>
                </View>
                <View style={styles.reviewCard}>
                  <Text
                    style={[
                      styles.reviewText,
                      { fontSize: 14, lineHeight: 22 },
                    ]}
                  >
                    {product.MoTa || 'Thông tin sản phẩm đang được cập nhật.'}
                  </Text>
                </View>
                <Text style={styles.productDetail}>
                  Thành tiền ({quantity} {product.DonViTinh}):{' '}
                  {formatPrice(product.GiaBan * quantity)}
                </Text>
                {!!notice && (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.productDetail,
                      { color: Palette.accentInk, marginTop: 16 },
                    ]}
                  >
                    {notice}
                  </Text>
                )}
              </>
            )
          )}
        </ScrollView>
        {!loading && product && (
          <View style={styles.bottomBar}>
            <Pressable
              disabled={!canBuy}
              onPress={() => void add(false)}
              style={[styles.cartButton, !canBuy && { opacity: 0.4 }]}
              accessibilityLabel="Thêm vào giỏ hàng"
            >
              <FontAwesome name="cart-plus" size={19} color={Palette.accentInk} />
            </Pressable>
            <View style={styles.quantityControl}>
              <Pressable
                disabled={!canBuy || quantity <= 1}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                accessibilityLabel="Giảm số lượng"
              >
                <Text style={styles.quantityAction}>−</Text>
              </Pressable>
              <Text style={styles.quantity}>{quantity}</Text>
              <Pressable
                disabled={!canBuy || quantity >= 99}
                onPress={() => setQuantity((q) => Math.min(99, q + 1))}
                accessibilityLabel="Tăng số lượng"
              >
                <Text style={styles.quantityAction}>+</Text>
              </Pressable>
            </View>
            <Pressable
              disabled={!canBuy}
              onPress={() => void add(true)}
              style={[styles.buyButton, !canBuy && { opacity: 0.4 }]}
            >
              <Text style={styles.buyButtonText}>
                {adding
                  ? 'ĐANG THÊM...'
                  : product.TrangThai !== 'ACTIVE'
                    ? 'HẾT HÀNG'
                    : 'THÊM & XEM GIỎ HÀNG'}
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center' },
  content: { paddingHorizontal: 10, paddingBottom: 26 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  topBarActions: { flexDirection: 'row', gap: 7 },
  iconButton: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: Palette.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  hero: {
    height: 210,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Palette.imageScrim,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    color: Palette.text,
    backgroundColor: Palette.accent,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: '900',
  },
  heroCopy: { position: 'absolute', left: 12, bottom: 11 },
  heroKicker: {
    color: Palette.accentInk,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: Palette.accentInk,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  thumbnailList: { gap: 6, paddingVertical: 8 },
  thumbnail: {
    width: 54,
    height: 42,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  thumbnailActive: { borderColor: Palette.accentInk },
  thumbnailImage: { width: '100%', height: '100%' },
  productHeader: { paddingHorizontal: 4, paddingTop: 4 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rating: { color: Palette.accentInk, fontSize: 10, fontWeight: '900' },
  reviewCount: { color: Palette.muted, fontWeight: '400' },
  stock: { color: Palette.accentInk, fontSize: 8, fontWeight: '900' },
  productName: {
    color: Palette.text,
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: 7,
  },
  productDetail: { color: Palette.muted, fontSize: 10, marginTop: 5 },
  priceLine: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  price: { color: Palette.accentInk, fontSize: 22, fontWeight: '900' },
  oldPrice: {
    color: Palette.muted,
    fontSize: 10,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discount: {
    color: Palette.text,
    backgroundColor: Palette.accent,
    fontSize: 8,
    fontWeight: '900',
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 3,
    marginLeft: 8,
  },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 12 },
  factCard: {
    width: '49%',
    minHeight: 59,
    backgroundColor: Palette.surface,
    borderRadius: 6,
    padding: 8,
  },
  factLabel: { color: Palette.muted, fontSize: 7, fontWeight: '900' },
  factValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  factValue: { color: Palette.accentInk, fontSize: 17, fontWeight: '900' },
  factDetail: { color: Palette.muted, fontSize: 8, marginTop: 2 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 17,
    marginBottom: 7,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  sectionKicker: { color: Palette.accentInk, fontSize: 8, fontWeight: '900' },
  memberCard: {
    backgroundColor: Palette.surface,
    borderRadius: 7,
    paddingHorizontal: 9,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  benefitIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  benefitCopy: { flex: 1 },
  benefitTitle: { color: Palette.text, fontSize: 10, fontWeight: '900' },
  benefitDetail: {
    color: Palette.muted,
    fontSize: 8,
    marginTop: 3,
    lineHeight: 10,
  },
  nutritionCard: {
    backgroundColor: Palette.surface,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  nutritionRow: {
    minHeight: 23,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  nutritionLastRow: { borderBottomWidth: 0 },
  nutritionLabel: { color: Palette.muted, fontSize: 8 },
  nutritionValue: { color: Palette.accentInk, fontSize: 8, fontWeight: '900' },
  proteinLabel: { color: Palette.muted, fontWeight: '900' },
  proteinValue: { color: Palette.accentInk },
  featurePills: { flexDirection: 'row', gap: 4, marginTop: 5 },
  featurePill: {
    flex: 1,
    minHeight: 31,
    backgroundColor: Palette.soft,
    borderRadius: 5,
    color: Palette.muted,
    fontSize: 7,
    textAlign: 'center',
    paddingHorizontal: 3,
    paddingVertical: 7,
  },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 7,
    padding: 9,
    gap: 8,
  },
  reviewScore: { color: Palette.accentInk, fontSize: 13, fontWeight: '900' },
  reviewStars: { color: Palette.accentInk, fontSize: 11, letterSpacing: 1 },
  reviewCaption: { color: Palette.muted, fontSize: 8, marginLeft: 'auto' },
  reviewCard: {
    backgroundColor: Palette.surface,
    borderRadius: 7,
    padding: 10,
    marginTop: 6,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Palette.accentInk, fontSize: 12, fontWeight: '900' },
  reviewIdentity: { flex: 1, marginLeft: 8 },
  reviewer: { color: Palette.text, fontSize: 9, fontWeight: '900' },
  reviewDate: { color: Palette.muted, fontSize: 8, marginTop: 2 },
  reviewText: { color: Palette.muted, fontSize: 9, lineHeight: 12, marginTop: 8 },
  footerNote: {
    color: Palette.muted,
    fontSize: 8,
    textAlign: 'center',
    marginTop: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.background,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  cartButton: {
    width: 39,
    height: 40,
    borderRadius: 7,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControl: {
    height: 40,
    width: 71,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.surface,
    borderRadius: 7,
  },
  quantityAction: {
    color: Palette.accentInk,
    fontSize: 19,
    lineHeight: 22,
    paddingHorizontal: 5,
  },
  quantity: { color: Palette.text, fontSize: 13, fontWeight: '900' },
  buyButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Palette.accent,
    borderRadius: 7,
  },
  buyButtonText: { color: Palette.text, fontSize: 9, fontWeight: '900' },
});
