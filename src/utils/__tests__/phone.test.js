// Plain Node test for normalizePhoneNumber — no test framework is
// currently installed in this project (no jest/vitest in package.json),
// so this runs standalone via: node src/utils/__tests__/phone.test.js
// It exits 0 on success and 1 with a printed diff on first failure.
const assert = require('assert');

// CommonJS require of an ES module file: transpile-free minimal shim.
// The source file only uses `export function`, so a tiny loader is enough.
const fs = require('fs');
const path = require('path');
const Module = require('module');

function loadEsmAsCjs(relPath) {
  const filePath = path.join(__dirname, relPath);
  const src = fs.readFileSync(filePath, 'utf8').replace(/^export function/gm, 'function');
  const mod = new Module(filePath, module);
  mod.filename = filePath;
  mod.paths = Module._nodeModulePaths(path.dirname(filePath));
  mod._compile(src + '\nmodule.exports = { normalizePhoneNumber, phoneErrorMessage };', filePath);
  return mod.exports;
}

const { normalizePhoneNumber } = loadEsmAsCjs('../phone.js');

const UK = { code: '+44', name: 'UK', nsn: 10 };
const UAE = { code: '+971', name: 'UAE', nsn: 9 };
const INDIA = { code: '+91', name: 'India', nsn: 10 };

let passed = 0;
let failed = 0;

function check(label, input, country, expectedE164) {
  const result = normalizePhoneNumber(input, country);
  const ok = expectedE164 === null ? !result.valid : (result.valid && result.e164 === expectedE164);
  if (ok) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${label}\n  input: ${JSON.stringify(input)}\n  expected: ${expectedE164}\n  got: ${JSON.stringify(result)}`);
  }
}

// ── UK ──────────────────────────────────────────────────────────────────
check('UK local with trunk 0', '07911123456', UK, '+447911123456');
check('UK already E.164', '+447911123456', UK, '+447911123456');
check('UK dial code, no plus', '447911123456', UK, '+447911123456');
check('UK local, no trunk 0', '7911123456', UK, '+447911123456');
check('UK with spaces/hyphens', '0791 112-3456', UK, '+447911123456');
check('UK with space then hyphen (task-specified)', '07911-123456', UK, '+447911123456');
check('UK with leading whitespace', ' 07911123456', UK, '+447911123456');
check('UK with trailing whitespace', '07911123456 ', UK, '+447911123456');
check('UK with parentheses', '(07911) 123456', UK, '+447911123456');

// ── UAE ─────────────────────────────────────────────────────────────────
check('UAE local with trunk 0', '0501234567', UAE, '+971501234567');
check('UAE already E.164', '+971501234567', UAE, '+971501234567');
check('UAE dial code, no plus', '971501234567', UAE, '+971501234567');
check('UAE local, no trunk 0', '501234567', UAE, '+971501234567');

// ── India (sanity: unaffected by the leading-0 strip since Indian mobile
//    numbers are never locally given with a trunk 0) ──────────────────────
check('India local', '9876543210', INDIA, '+919876543210');
check('India already E.164', '+919876543210', INDIA, '+919876543210');
check('India dial code, no plus', '919876543210', INDIA, '+919876543210');

// ── Invalid cases ──────────────────────────────────────────────────────
check('empty string', '', UK, null);
check('just a plus sign', '+', UK, null);
check('letters only', 'abcdefghij', UK, null);
check('too short', '07911', UK, null);
check('too long', '079111234567890', UK, null);
check('duplicate plus', '++447911123456', UK, null);
check('duplicate plus, longer', '++447911123456', UK, null);
check('all zeros, UK length', '0000000000', UK, null);
check('all zeros, UAE length', '00000000000', UAE, null);
check('wrong country code for selected country', '+971501234567', UK, null);
check('India number given while UK selected', '+919876543210', UK, null);

// ── Regression guards: the exact broken representations from the original
//    bug report must never be produced OR accepted as valid input. ────────
check('regression: UK leading 0 kept after dial code', '+440791112345', UK, null);
check('regression: UAE leading 0 kept after dial code', '+9710501234567', UAE, null);

// ── Explicit reject/accept pairs called out in the task ────────────────
check('accept: 07911123456 -> +447911123456', '07911123456', UK, '+447911123456');
check('accept: 0501234567 -> +971501234567', '0501234567', UAE, '+971501234567');
check('accept: +447911123456 -> +447911123456 (idempotent)', '+447911123456', UK, '+447911123456');
check('accept: +971501234567 -> +971501234567 (idempotent)', '+971501234567', UAE, '+971501234567');
check('reject: +440791112345 must not be produced/accepted', '+440791112345', UK, null);
check('reject: +9710501234567 must not be produced/accepted', '+9710501234567', UAE, null);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
