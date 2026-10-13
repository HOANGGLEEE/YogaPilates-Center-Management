import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

const sidebar = read('../src/components/Navigation.tsx')
const navigationDefinition = sidebar.split('const navigation:')[1]?.split('export default function Navigation')[0] || ''
const destinations = [...navigationDefinition.matchAll(/label: '([^']+)'/g)].map((match) => match[1])
assert.deepEqual(destinations, [
  'Dashboard', 'Hướng dẫn viên', 'Gói tập', 'Check-In', 'Hội viên',
  'Báo cáo thống kê', 'Hóa đơn', 'Khuyến mãi', 'Nhân viên',
  'Đơn hàng', 'Sản phẩm', 'Danh mục', 'Kho hàng',
])
assert.match(sidebar, /aria-current=\{activeItem === label \? 'page'/)

const dashboard = read('../src/pages/DashboardPage.tsx')
const heroActions = dashboard.split('<div className="hero-actions">')[1]?.split('</div>')[0] || ''
assert.deepEqual([...heroActions.matchAll(/onNavigate\('([^']+)'(?:,\s*(\d+))?\)/g)]
  .map((match) => [match[1], match[2] || '0']), [
    ['Hướng dẫn viên', '1'], ['Gói tập', '0'], ['Check-In', '0'], ['Hội viên', '0'],
  ])
assert.match(read('../src/App.tsx'), /'Hướng dẫn viên':\s*\{\s*tabs: \['Danh sách HLV', 'Lịch hướng dẫn 1-1', 'Phân ca'\]/)

const tabs = read('../../Mobile/src/components/app-tabs.tsx')
assert.deepEqual([...tabs.matchAll(/NativeTabs.Trigger name="([^"]+)"/g)].map((match) => match[1]),
  ['index', 'pt', 'packages', 'product', 'profile'])
for (const route of ['index', 'pt', 'packages', 'product', 'profile']) {
  assert.ok(existsSync(new URL(`../../Mobile/src/app/${route}.tsx`, import.meta.url)),
    `Mobile destination ${route} must remain present`)
}

const home = read('../../Mobile/src/app/index.tsx')
const quickActions = home.split('const quickActions = [')[1]?.split('] as const')[0] || ''
assert.deepEqual([...quickActions.matchAll(/route: '([^']+)'/g)].map((match) => match[1]),
  ['/pt', '/packages', '/check-in-pass', '/product'])
assert.ok(home.indexOf('Lối tắt của bạn') < home.indexOf('style={styles.heroCard}'))
assert.match(home, /onPress=\{\(\) => router.push\(item.route\)\}/)

const profile = read('../../Mobile/src/app/profile.tsx')
assert.ok(profile.indexOf("router.push('/pt-schedule')") < profile.indexOf("router.push('/check-in-history')"))
assert.ok(profile.indexOf("router.push('/membership-detail')") < profile.indexOf("router.push('/check-in-pass')"))
assert.match(read('../src/App.css'), /\.sidebar \.nav-group:first-child/)

console.log('Yoga & Pilates button order and destinations are consistent.')
