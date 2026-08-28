// Centralized phone-number normalization for the OTP auth flow.
// Every screen that collects a phone number (PhoneScreen, LoginScreen,
// ForgotPasswordScreen) must go through normalizePhoneNumber() rather than
// building the E.164 string by hand — see the OTP delivery investigation
// for why: a hand-rolled `${country.code}${digits}` concatenation silently
// produced invalid numbers like +4407911123456 for UK users who type their
// number in local format (07911 123456).

// Accepts:
//   "07911123456"      (local, with trunk 0)
//   "7911123456"       (local, no trunk 0)
//   "+447911123456"    (already E.164)
//   "447911123456"     (dial code typed without a leading +)
// and produces a single canonical E.164 string, or a typed failure reason.
export function normalizePhoneNumber(rawInput, country) {
  if (!country || !country.code || !country.nsn) {
    return { e164: null, national: null, valid: false, reason: 'invalid_country' };
  }
  if (rawInput === null || rawInput === undefined || String(rawInput).trim() === '') {
    return { e164: null, national: null, valid: false, reason: 'empty' };
  }

  const text = String(rawInput).trim();

  // Reject a duplicated leading plus, e.g. "++447911123456"
  if (/^\+{2,}/.test(text)) {
    return { e164: null, national: null, valid: false, reason: 'duplicate_plus' };
  }

  const hadPlus = text.startsWith('+');
  const digits = text.replace(/\D/g, '');
  const dial = country.code.replace('+', '');
  const expected = country.nsn;

  if (digits.length === 0) {
    return { e164: null, national: null, valid: false, reason: 'empty' };
  }

  let national;

  if (hadPlus) {
    // Explicit international input — it must carry this country's dial code.
    if (!digits.startsWith(dial)) {
      return { e164: null, national: null, valid: false, reason: 'country_mismatch' };
    }
    national = digits.slice(dial.length);
  } else if (digits.length === dial.length + expected && digits.startsWith(dial)) {
    // Dial code typed without a leading "+", e.g. "447911123456"
    national = digits.slice(dial.length);
  } else {
    // Local format — drop a single leading trunk prefix "0" if present
    // (common for UK: 07911 123456; harmless no-op for countries whose
    // mobile numbers are never given with a leading 0, e.g. India/UAE).
    national = digits.replace(/^0+/, '');
  }

  if (national.length !== expected || !/^\d+$/.test(national)) {
    return { e164: null, national: null, valid: false, reason: 'invalid_length' };
  }

  // A national significant number never starts with "0" once embedded in
  // E.164 — "0" is only ever a local trunk-dialing prefix. Guards against
  // exactly the bug this function replaces: "+44" + "0791112345" (leading
  // 0 preserved from an international-looking input) => "+440791112345".
  if (national.startsWith('0')) {
    return { e164: null, national: null, valid: false, reason: 'invalid_leading_zero' };
  }

  const e164 = `${country.code}${national}`;

  // Matches the backend's E.164 validation (send-otp/route.ts) so a number
  // that passes here will not be rejected there for format reasons.
  if (!/^\+[1-9]\d{6,14}$/.test(e164)) {
    return { e164: null, national: null, valid: false, reason: 'invalid_e164' };
  }

  return { e164, national, valid: true, reason: null };
}

// Formats a validation `reason` into a user-facing message consistent with
// the existing toast copy used across the auth screens.
export function phoneErrorMessage(reason, country) {
  switch (reason) {
    case 'empty':
      return 'Please enter your phone number.';
    case 'country_mismatch':
      return `That number doesn't match ${country?.name || 'the selected country'} (${country?.code || ''}).`;
    case 'duplicate_plus':
      return 'Please enter a valid phone number.';
    case 'invalid_length':
    case 'invalid_e164':
    default:
      return `Please enter a valid ${country?.nsn || ''}-digit phone number.`;
  }
}
