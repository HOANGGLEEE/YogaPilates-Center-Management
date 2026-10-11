const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/app/check-in-pass.tsx', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
let now = 1_000_000, cursor = 0, calls = 0, focus, effect, pending;
const states = [], refs = [], timers = new Set();
const react = {
  useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }];
  },
  useRef(initial) {
    const index = cursor++;
    return refs[index] ??= { current: initial };
  },
  useCallback: fn => fn,
  useEffect: fn => { effect = fn; },
};
class ApiError extends Error {}
const modules = {
  react,
  'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
  'expo-router': { useFocusEffect: fn => { focus = fn; } },
  'react-native': { StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: 400 }) },
  '@/constants/package-detail': { homeClubs: [{}] },
  '@/context/AuthContext': { useAuth: () => ({ user: { accountId: 1, name: 'Test' } }) },
  '@/lib/check-in-api': {
    CheckInApiError: ApiError,
    createCheckInToken: () => {
      calls++;
      return new Promise((resolve, reject) => { pending = { resolve, reject }; });
    },
  },
};
const context = {
  exports: {}, require: name => modules[name] ?? {},
  Date: { now: () => now },
  setInterval: fn => { timers.add(fn); return fn; },
  clearInterval: fn => timers.delete(fn),
};
vm.runInNewContext(compiled, context);
const render = () => { cursor = 0; context.exports.default(); };
const flush = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  render();
  focus();
  focus();
  assert.equal(calls, 1, 'Concurrent requests must be suppressed');
  pending.resolve({ token: 'qr', expiresIn: 45, expiresAt: '1970-01-01T00:00:00Z' });
  await flush();
  render();
  effect();
  assert.equal(states[1], 45, 'Server clock skew must not expire a fresh token');
  now += 45_000;
  for (const tick of [...timers]) tick();
  assert.equal(calls, 2);
  assert.equal(timers.size, 0, 'Expired token must refresh only once');
  assert.equal(states[0].token, 'qr', 'Keep the card mounted while refreshing');
  assert.equal(states[1], 0, 'Expired QR must be hidden');
  pending.reject(new ApiError('No active membership'));
  await flush();
  render();
  effect();
  assert.equal(states[0], null);
  assert.equal(states[2], 'No active membership');
  assert.equal(calls, 2, 'Membership errors must not trigger a retry loop');
  console.log('QR refresh regression checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
