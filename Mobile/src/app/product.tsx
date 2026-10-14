import { Palette } from '@/constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import BackendImage from '@/components/backend-image';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/shop-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/app/Common/header';
import { useAuth } from '@/context/AuthContext';
import {
  formatPrice,
  getCatalog,
  searchKey,
  updateCart,
  type ShopProduct,
  type ShopCategory,
} from '@/lib/shop-api';

export default function ProductsScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [categoryId, setCategoryId] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adding, setAdding] = useState<number | null>(null);
  const busy = useRef(false);
  const [reload, setReload] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');
      getCatalog()
        .then((data) => {
          if (!active) return;
          setProducts(data.products);
          setCategories(data.categories);
          setCategoryId((id) =>
            data.categories.some((c) => c.DanhMucID === id) ? id : 0
          );
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
      // reload intentionally invalidates the focus callback for pull-to-refresh/retry.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload])
  );
  const visible = useMemo(() => {
    const result = products.filter(
      (p) =>
        (!categoryId || p.DanhMucID === categoryId) &&
        (!availableOnly || p.TrangThai === 'ACTIVE') &&
        searchKey(`${p.TenSanPham} ${p.MoTa || ''}`).includes(
          searchKey(search.trim())
        )
    );
    return result.sort((a, b) =>
      sort === 1
        ? a.GiaBan - b.GiaBan
        : sort === 2
          ? b.GiaBan - a.GiaBan
          : b.SanPhamID - a.SanPhamID
    );
  }, [products, categoryId, availableOnly, search, sort]);
  async function add(p: ShopProduct) {
    if (!user?.accountId) {
      router.push('/login');
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setAdding(p.SanPhamID);
    setNotice('');
    try {
      await updateCart(user.accountId, p.SanPhamID, 1);
      setNotice(`Đã thêm ${p.TenSanPham} vào giỏ hàng.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Không thêm được sản phẩm.');
    } finally {
      busy.current = false;
      setAdding(null);
    }
  }
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => setReload((n) => n + 1)}
              tintColor={Palette.accentInk}
            />
          }
        >
          <Header />
          <View style={styles.intro}>
            <Text style={styles.kicker}>YOGA & PILATES STUDIO SHOP</Text>
            <Text style={styles.title}>Cửa hàng & Dinh dưỡng</Text>
            <Text style={styles.subtitle}>
              Thực phẩm bổ sung và phụ kiện tập luyện
            </Text>
          </View>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <FontAwesome name="search" size={15} color={Palette.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm sản phẩm..."
                placeholderTextColor={Palette.muted}
                style={styles.searchInput}
                accessibilityLabel="Tìm sản phẩm"
              />
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {[
              { DanhMucID: 0, TenDanhMuc: `Tất cả (${products.length})` },
              ...categories,
            ].map((c) => (
              <Pressable
                key={c.DanhMucID}
                onPress={() => setCategoryId(c.DanhMucID)}
                style={[
                  styles.categoryChip,
                  categoryId === c.DanhMucID && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    categoryId === c.DanhMucID && styles.categoryTextActive,
                  ]}
                >
                  {c.TenDanhMuc}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.sectionHeader}>
            <Pressable onPress={() => setAvailableOnly((v) => !v)}>
              <Text style={styles.sortText}>
                {availableOnly ? '☑' : '☐'} Chỉ còn hàng
              </Text>
            </Pressable>
            <Pressable onPress={() => setSort((v) => (v + 1) % 3)}>
              <Text style={styles.sortText}>
                ↕ {['Mới nhất', 'Giá tăng dần', 'Giá giảm dần'][sort]}
              </Text>
            </Pressable>
          </View>
          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={styles.subtitle}>
              {notice}
            </Text>
          )}
          {loading ? (
            <ActivityIndicator color={Palette.accentInk} />
          ) : error ? (
            <View>
              <Text style={styles.subtitle}>{error}</Text>
              <Pressable onPress={() => setReload((n) => n + 1)}>
                <Text style={styles.sortText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>{visible.length} sản phẩm</Text>
              {!visible.length && (
                <Text style={styles.subtitle}>
                  Không tìm thấy sản phẩm phù hợp.
                </Text>
              )}
              <View style={styles.productGrid}>
                {visible.map((p) => (
                  <View key={p.SanPhamID} style={styles.productCard}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/product-detail',
                          params: { productId: p.SanPhamID },
                        })
                      }
                      accessibilityLabel={`Xem chi tiết ${p.TenSanPham}`}
                    >
                      <View style={styles.productImageWrap}>
                        <BackendImage
                          value={p.HinhAnh}
                          fallback={DEFAULT_PRODUCT_IMAGE}
                          style={styles.productImage}
                          contentFit="contain"
                        />
                        {p.TrangThai === 'OUT_OF_STOCK' && (
                          <Text style={styles.productBadge}>HẾT HÀNG</Text>
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {p.TenSanPham}
                        </Text>
                        <Text style={styles.productDetail} numberOfLines={1}>
                          {p.MoTa || p.DonViTinh}
                        </Text>
                      </View>
                    </Pressable>
                    <View style={[styles.priceRow, { padding: 10 }]}>
                      <Text style={styles.productPrice}>
                        {formatPrice(p.GiaBan)}
                      </Text>
                      <Pressable
                        disabled={adding !== null || p.TrangThai !== 'ACTIVE'}
                        onPress={() => void add(p)}
                        style={[
                          styles.addButton,
                          (adding !== null || p.TrangThai !== 'ACTIVE') && {
                            opacity: 0.4,
                          },
                        ]}
                        accessibilityLabel={`Thêm ${p.TenSanPham} vào giỏ`}
                      >
                        <Text style={styles.addButtonText}>
                          {adding === p.SanPhamID ? '…' : '+'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  safeArea: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  intro: { marginBottom: 14 },
  kicker: {
    color: Palette.accentInk,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: Palette.accentInk,
    fontSize: 24,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: { color: Palette.muted, fontSize: 11, marginTop: 6 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.surface,
    borderRadius: 9,
    paddingHorizontal: 11,
  },
  searchInput: { flex: 1, color: Palette.text, fontSize: 12, paddingVertical: 0 },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.accent,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: Palette.accent,
    color: Palette.text,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    paddingTop: 3,
  },
  categoryList: { gap: 7, paddingBottom: 18 },
  categoryChip: {
    backgroundColor: Palette.soft,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  categoryChipActive: { backgroundColor: Palette.accent },
  categoryText: { color: Palette.muted, fontSize: 10, fontWeight: '800' },
  categoryTextActive: { color: Palette.text },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 9,
    padding: 11,
    marginBottom: 22,
  },
  promoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  promoCopy: { flex: 1 },
  promoTitle: { color: Palette.accentInk, fontSize: 9, fontWeight: '900' },
  promoDiscount: {
    color: Palette.accentInk,
    backgroundColor: Palette.surface,
    fontSize: 8,
    paddingHorizontal: 3,
  },
  promoText: { color: Palette.muted, fontSize: 10, lineHeight: 13, marginTop: 5 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 11,
  },
  sectionTitle: { color: Palette.text, fontSize: 16, fontWeight: '900' },
  countBadge: {
    color: Palette.muted,
    backgroundColor: Palette.soft,
    fontSize: 10,
    paddingHorizontal: 5,
    borderRadius: 7,
  },
  sortText: { color: Palette.muted, fontSize: 10 },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  productCard: {
    width: '48.6%',
    backgroundColor: Palette.surface,
    borderRadius: 10,
    overflow: 'hidden',
  },
  productImageWrap: {
    height: 142,
    backgroundColor: Palette.surface,
    position: 'relative',
  },
  productImage: { width: '100%', height: '100%' },
  productBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    color: Palette.text,
    backgroundColor: Palette.accent,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: '900',
  },
  favorite: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteText: { color: Palette.text, fontSize: 21, lineHeight: 22 },
  productInfo: { padding: 9 },
  rating: { color: Palette.accentInk, fontSize: 10, fontWeight: '800' },
  reviewCount: { color: Palette.muted, fontWeight: '400' },
  productName: {
    color: Palette.text,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
    marginTop: 7,
    minHeight: 28,
  },
  productDetail: { color: Palette.muted, fontSize: 9, marginTop: 4 },
  oldPrice: {
    color: Palette.muted,
    fontSize: 9,
    textDecorationLine: 'line-through',
    marginTop: 5,
  },
  priceRow: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  productPrice: { color: Palette.accentInk, fontSize: 16, fontWeight: '900' },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  addButtonText: {
    color: Palette.text,
    fontSize: 24,
    lineHeight: 25,
    fontWeight: '500',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 10,
    padding: 12,
    marginTop: 22,
  },
  helpIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  helpCopy: { flex: 1 },
  helpTitle: { color: Palette.text, fontSize: 12, fontWeight: '800' },
  helpText: { color: Palette.muted, fontSize: 9, marginTop: 4 },
  helpButton: {
    backgroundColor: Palette.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  helpButtonText: {
    color: Palette.text,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
});
