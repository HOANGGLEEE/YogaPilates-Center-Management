import { Palette } from '@/constants/theme';
import { FontAwesome } from '@expo/vector-icons';
import BackendImage from '@/components/backend-image';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/shop-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { checkoutStorageKey, getShopOrders, latestPendingOrder } from '@/lib/checkout-api';
import { readLocal } from '@/lib/local-store';
import {
  getCart,
  updateCart,
  formatPrice,
  type CartItem,
} from '@/lib/shop-api';

export default function CartScreen() {
  const { user } = useAuth();
  const accountId = user?.accountId;
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  // 0 means a persisted request needs recovery; positive IDs reopen existing orders.
  const [resumeOrder, setResumeOrder] = useState<number | null>(null);
  const [resumeError, setResumeError] = useState('');
  const busy = useRef(false);
  const generation = useRef(0);
  const [reload, setReload] = useState(0);
  useFocusEffect(
    useCallback(() => {
      const version = ++generation.current;
      setItems([]);
      setError('');
      setNotice('');
      setResumeOrder(null);
      setResumeError('');
      setLoading(!!accountId);
      if (accountId) {
        void (async () => {
          const saved = await readLocal(checkoutStorageKey(accountId));
          if (version !== generation.current) return;
          if (saved) { setResumeOrder(0); return; }
          const orders = await getShopOrders(accountId);
          if (version === generation.current) setResumeOrder(latestPendingOrder(orders));
        })().catch(e => {
          if (version === generation.current) setResumeError(e instanceof Error ? e.message : 'Không kiểm tra được đơn đang chờ thanh toán.');
        });
      }
      if (accountId)
        getCart(accountId)
          .then((data) => {
            if (version === generation.current) setItems(data);
          })
          .catch((e) => {
            if (version === generation.current) setError(e.message);
          })
          .finally(() => {
            if (version === generation.current) setLoading(false);
          });
      return () => {
        generation.current++;
      };
      // reload intentionally invalidates the focus callback for pull-to-refresh/retry.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId, reload])
  );
  async function change(item: CartItem, quantity: number) {
    if (!accountId || busy.current) return;
    const version = generation.current;
    busy.current = true;
    setSaving(true);
    setNotice('');
    try {
      const data = await updateCart(accountId, item.SanPhamID, quantity, 'PUT');
      if (version === generation.current) setItems(data);
    } catch (e) {
      if (version === generation.current)
        setNotice(
          e instanceof Error ? e.message : 'Không cập nhật được giỏ hàng.'
        );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  const total = items.reduce(
    (sum, item) => sum + item.GiaBan * item.SoLuong,
    0
  );
  const count = items.reduce((sum, item) => sum + item.SoLuong, 0);
  const canCheckout =
    !!accountId &&
    !loading &&
    !saving &&
    !error &&
    items.length > 0 &&
    items.every(
      (item) =>
        item.TrangThai === 'ACTIVE' && item.DanhMucTrangThai === 'ACTIVE'
    );
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                if (!saving) setReload((n) => n + 1);
              }}
              tintColor={Palette.accentInk}
            />
          }
        >
          <View style={styles.topBar}>
            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace('/product')
              }
              accessibilityLabel="Quay lại"
            >
              <FontAwesome name="angle-left" size={22} color={Palette.accentInk} />
            </Pressable>
            <Text style={styles.topBarTitle}>GIỎ HÀNG ({count})</Text>
          </View>
          {resumeOrder !== null && (
            <Pressable accessibilityRole="button" disabled={saving}
              style={styles.resumePayment}
              onPress={() => resumeOrder === 0 ? router.push('/checkout') : router.push({ pathname: '/order-payment', params: { orderId: resumeOrder } })}>
              <FontAwesome name="credit-card" size={18} color={Palette.accentInk} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeTitle}>Tiếp tục thanh toán{resumeOrder > 0 ? ` đơn #${resumeOrder}` : ''}</Text>
                <Text style={styles.resumeSubtitle}>Mở lại thanh toán đang dang dở</Text>
              </View>
              <FontAwesome name="angle-right" size={22} color={Palette.accentInk} />
            </Pressable>
          )}
          {!!resumeError && <Pressable disabled={saving} onPress={() => setReload(n => n + 1)}>
            <Text style={styles.resumeSubtitle}>{resumeError} Bấm để kiểm tra lại.</Text>
          </Pressable>}
          {!accountId ? (
            <Pressable onPress={() => router.push('/login')}>
              <Text style={styles.itemName}>Đăng nhập để xem giỏ hàng</Text>
            </Pressable>
          ) : loading ? (
            <ActivityIndicator color={Palette.accentInk} />
          ) : error ? (
            <View>
              <Text style={styles.itemName}>{error}</Text>
              <Pressable onPress={() => setReload((n) => n + 1)}>
                <Text style={styles.stock}>Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {!items.length && (
                <Text style={styles.itemName}>
                  Giỏ hàng của bạn đang trống.
                </Text>
              )}
              {!!notice && (
                <Text accessibilityLiveRegion="polite" style={styles.itemName}>
                  {notice}
                </Text>
              )}
              {items.map((item) => (
                <View key={item.SanPhamID} style={styles.itemCard}>
                  <View style={styles.itemTop}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/product-detail',
                          params: { productId: item.SanPhamID },
                        })
                      }
                      accessibilityLabel={`Xem ${item.TenSanPham}`}
                    >
                      <BackendImage
                        value={item.HinhAnh}
                        fallback={DEFAULT_PRODUCT_IMAGE}
                        style={styles.itemImage}
                        contentFit="contain"
                      />
                    </Pressable>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemName}>{item.TenSanPham}</Text>
                      <Text style={styles.itemDetail}>{item.DonViTinh}</Text>
                      <Text style={styles.itemPrice}>
                        {formatPrice(item.GiaBan)}
                      </Text>
                    </View>
                    <Pressable
                      disabled={saving}
                      onPress={() => void change(item, 0)}
                      accessibilityLabel={`Xóa ${item.TenSanPham}`}
                    >
                      <Text style={styles.remove}>×</Text>
                    </Pressable>
                  </View>
                  <View style={styles.itemBottom}>
                    <Text style={styles.stock}>
                      {item.TrangThai === 'ACTIVE' &&
                      item.DanhMucTrangThai === 'ACTIVE'
                        ? formatPrice(item.GiaBan * item.SoLuong)
                        : 'Sản phẩm không còn bán'}
                    </Text>
                    <View style={styles.quantity}>
                      <Pressable
                        disabled={saving || item.SoLuong <= 1}
                        onPress={() => void change(item, item.SoLuong - 1)}
                        accessibilityLabel="Giảm số lượng"
                      >
                        <Text style={styles.quantityAction}>−</Text>
                      </Pressable>
                      <Text style={styles.quantityValue}>{item.SoLuong}</Text>
                      <Pressable
                        disabled={
                          saving ||
                          item.SoLuong >= 99 ||
                          item.TrangThai !== 'ACTIVE' ||
                          item.DanhMucTrangThai !== 'ACTIVE'
                        }
                        onPress={() => void change(item, item.SoLuong + 1)}
                        accessibilityLabel="Tăng số lượng"
                      >
                        <Text style={styles.quantityAction}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
              {!!items.length && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>
                    TỔNG TIỀN ĐƠN HÀNG ({count} sản phẩm)
                  </Text>
                  <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                  <Text style={styles.tax}>
                    Phí vận chuyển được tính tại trang thanh toán.
                  </Text>
                  {!canCheckout && !saving && (
                    <Text style={styles.tax}>
                      Vui lòng xóa sản phẩm hết hàng hoặc ngừng bán trước khi
                      thanh toán.
                    </Text>
                  )}
                </View>
              )}
            </>
          )}
          <Pressable
            style={styles.continueShopping}
            onPress={() => router.push('/product')}
          >
            <Text style={styles.continueShoppingText}>TIẾP TỤC MUA SẮM</Text>
          </Pressable>
        </ScrollView>
        <View style={styles.bottomBar}>
          <View style={styles.bottomSummary}>
            <Text style={styles.bottomLabel}>Tổng tiền đơn hàng</Text>
            <Text style={styles.bottomTotal} accessibilityLiveRegion="polite">
              {loading || error ? '—' : formatPrice(total)}
            </Text>
            <Text style={styles.bottomNote}>Chưa gồm phí vận chuyển</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thanh toán ngay"
            disabled={!canCheckout}
            style={[
              styles.checkoutButton,
              !canCheckout && styles.checkoutDisabled,
            ]}
            onPress={() => router.push('/checkout')}
          >
            <Text style={styles.checkoutText}>THANH TOÁN NGAY</Text>
            <FontAwesome name="arrow-right" size={13} color={Palette.text} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  resumePayment: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 14, borderRadius: 12, backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.border },
  resumeTitle: { color: Palette.accentInk, fontSize: 14, fontWeight: '700' },
  resumeSubtitle: { color: Palette.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  container: { flex: 1, minHeight: 0, backgroundColor: Palette.background },
  safeArea: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  scrollArea: { flex: 1, minHeight: 0 },
  content: { paddingHorizontal: 13, paddingBottom: 18 },
  topBar: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: { color: Palette.text, fontSize: 13, fontWeight: '900' },
  accountButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  heading: { color: Palette.text, fontSize: 13, fontWeight: '900' },
  itemCount: { color: Palette.accentInk, fontSize: 9 },
  clearText: { color: Palette.accentInk, fontSize: 9, fontWeight: '800' },
  shippingCard: {
    backgroundColor: Palette.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  shippingTop: { flexDirection: 'row', alignItems: 'center' },
  shippingIcon: {
    width: 21,
    height: 21,
    borderRadius: 5,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  shippingTitle: { color: Palette.text, fontSize: 10, fontWeight: '900', flex: 1 },
  shippingPercent: { color: Palette.accentInk, fontSize: 9, fontWeight: '900' },
  shippingCopy: { color: Palette.muted, fontSize: 9, marginTop: 7 },
  highlight: { color: Palette.accentInk, fontWeight: '900' },
  progressTrack: {
    height: 5,
    backgroundColor: Palette.surface,
    borderRadius: 3,
    marginTop: 8,
  },
  progressFill: {
    width: '85%',
    height: 5,
    backgroundColor: Palette.accent,
    borderRadius: 3,
  },
  itemCard: {
    backgroundColor: Palette.surface,
    borderRadius: 8,
    padding: 9,
    marginBottom: 9,
  },
  itemTop: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 14,
    height: 14,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: 4,
    backgroundColor: Palette.surface,
  },
  itemCopy: { flex: 1, marginLeft: 9 },
  itemName: { color: Palette.text, fontSize: 11, fontWeight: '900' },
  itemDetail: { color: Palette.muted, fontSize: 8, marginTop: 4 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  itemPrice: { color: Palette.accentInk, fontSize: 12, fontWeight: '900' },
  itemOldPrice: {
    color: Palette.muted,
    fontSize: 8,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  remove: { color: Palette.accentInk, fontSize: 20, lineHeight: 19, marginLeft: 6 },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    paddingLeft: 21,
  },
  stock: { color: Palette.muted, fontSize: 8, fontWeight: '900' },
  quantity: {
    width: 67,
    height: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Palette.surface,
    borderRadius: 6,
  },
  quantityAction: { color: Palette.accentInk, fontSize: 16, paddingHorizontal: 5 },
  quantityValue: { color: Palette.text, fontSize: 10, fontWeight: '900' },
  giftCard: {
    backgroundColor: Palette.surface,
    borderRadius: 8,
    padding: 9,
    marginBottom: 9,
  },
  giftTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  giftTitle: { color: Palette.accentInk, fontSize: 9, fontWeight: '900', flex: 1 },
  giftBadge: {
    color: Palette.text,
    backgroundColor: Palette.accent,
    fontSize: 7,
    fontWeight: '900',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 3,
  },
  giftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 5,
    padding: 6,
    marginTop: 7,
  },
  giftImage: { width: 43, height: 43, borderRadius: 3 },
  giftCopy: { flex: 1, marginLeft: 8 },
  giftName: { color: Palette.text, fontSize: 9, fontWeight: '900' },
  giftDetail: { color: Palette.muted, fontSize: 8, marginTop: 3 },
  giftPrice: { color: Palette.accentInk, fontSize: 8, fontWeight: '900', marginTop: 3 },
  giftOldPrice: {
    color: Palette.muted,
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  couponCard: {
    backgroundColor: Palette.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 9,
  },
  couponTitleRow: { flexDirection: 'row', alignItems: 'center' },
  couponTitle: { color: Palette.text, fontSize: 9, fontWeight: '900' },
  couponForm: { flexDirection: 'row', gap: 6, marginTop: 9 },
  couponCode: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: 7,
    color: Palette.text,
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  applyButton: {
    backgroundColor: Palette.accent,
    borderRadius: 7,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },
  applyText: { color: Palette.text, fontSize: 9, fontWeight: '900' },
  appliedCoupon: {
    backgroundColor: Palette.surface,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 7,
  },
  appliedText: { color: Palette.accentInk, fontSize: 9, fontWeight: '900', flex: 1 },
  appliedDetail: { color: Palette.muted, fontWeight: '400' },
  summaryCard: {
    backgroundColor: Palette.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  summaryTitle: {
    color: Palette.text,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: { color: Palette.muted, fontSize: 9 },
  summaryValue: { color: Palette.text, fontSize: 9, fontWeight: '800' },
  summaryAccent: { color: Palette.accentInk },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 9,
  },
  totalLabel: { color: Palette.muted, fontSize: 10, fontWeight: '900' },
  totalValue: { color: Palette.accentInk, fontSize: 17, fontWeight: '900' },
  tax: { color: Palette.muted, fontSize: 8, textAlign: 'right', marginTop: 2 },
  bottomBar: {
    flexShrink: 0,
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.background,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    paddingHorizontal: 13,
    paddingVertical: 12,
    gap: 10,
  },
  bottomSummary: { flex: 1, gap: 3 },
  bottomLabel: { color: Palette.muted, fontSize: 12 },
  bottomTotal: { color: Palette.accentInk, fontSize: 20, fontWeight: '900' },
  bottomNote: { color: Palette.muted, fontSize: 10 },
  continueShopping: { alignItems: 'center', paddingVertical: 16 },
  continueShoppingText: { color: Palette.accentInk, fontSize: 12, fontWeight: '800' },
  saved: { color: Palette.muted, fontSize: 7 },
  checkoutButton: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.accent,
    borderRadius: 8,
  },
  checkoutText: { color: Palette.text, fontSize: 12, fontWeight: '900' },
  checkoutDisabled: { backgroundColor: Palette.soft },
});
