import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const navigation = read('../src/components/Navigation.tsx')
const app = read('../src/App.tsx')
assert.match(navigation, /YOGA & PILATES/)
assert.match(navigation, /label: 'Hướng dẫn viên'/)
assert.match(app, /'Hướng dẫn viên':/)
assert.doesNotMatch(read('../src/pages/Login.tsx'), /QA-GYM|FIDO2|biometric/)
assert.match(read('../src/App.css'), /--qa-primary: #c4d5aa/)

const config = JSON.parse(read('../../Mobile/app.json')).expo
assert.equal(config.name, 'Yoga & Pilates')
assert.equal(config.android.package, 'com.hoang.quanlyphonggym')
for (const path of [config.icon, config.ios.icon, config.web.favicon,
  config.android.adaptiveIcon.foregroundImage, config.android.adaptiveIcon.monochromeImage]) {
  assert.ok(existsSync(new URL(`../../Mobile/${path}`, import.meta.url)), path)
}
assert.match(read('../../Mobile/src/app/order-payment.tsx'), /QAGYM DH/)
assert.match(read('../../Mobile/src/lib/account-api.ts'), /qa-gym-api-token-v1/)
assert.match(read('../../Mobile/src/app/index.tsx'), /lịch minh họa/)
assert.match(read('../../Mobile/src/app/package-detail.tsx'), /badge="MINH HỌA"/)
const mobileLogin = read('../../Mobile/src/app/login.tsx')
assert.doesNotMatch(mobileLogin, /SocialButtons|handleBiometricLogin|AuthDivider/)
assert.match(read('../../Mobile/src/components/auth-ui.tsx'), /router\\.replace\\('\\/login'\\)/)
assert.match(read('../../Mobile/src/context/AuthContext.tsx'), /await writeLocal\\(API_TOKEN, null\\)\\.catch/)
assert.match(read('../../Mobile/src/app/notifications.tsx'), /loadedAccountId === user\\?\\.accountId/)
const adminLogin = read('../src/pages/Login.tsx')
assert.match(adminLogin, /admin-support-note/)
assert.doesNotMatch(adminLogin, /tel:19008899|1900 8899/)
assert.match(read('../../BE/app.js'), /NODE_ENV !== 'production' && \\{ message: err\\.message \\}/)
console.log('Yoga branding, navigation, login integrity, notification safety and compatibility checks passed')
