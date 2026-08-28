// Supported countries for phone-based auth (signup / login / password reset).
// `nsn` = National Significant Number length — the number of digits in a
// local subscriber number, excluding the country's calling code and any
// trunk prefix (e.g. the UK's local "0"). This varies legitimately by
// country (it is not a per-country "hack") and is the single source of
// truth for phone validation/formatting — see src/utils/phone.js.
export const COUNTRIES = [
  { code: '+91', name: 'India', nsn: 10 },
  { code: '+971', name: 'UAE', nsn: 9 },
  { code: '+44', name: 'UK', nsn: 10 },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export const findCountryByPrefix = (text, countries = COUNTRIES) =>
  countries.find((c) => text.startsWith(c.code));

// The TextInput's maxLength must fit the longest valid input any *supported*
// country can produce (local w/ trunk 0, or the dial code typed without a
// leading "+"), not just the currently-selected country's — a user can paste
// an already-international number for a different country, which
// handlePhoneChange auto-detects and switches `country` to. Sizing this off
// only the selected country would risk truncating that paste if some future
// country's (code.length + nsn) is larger. Computed from data, not a magic
// number.
export const MAX_PHONE_INPUT_LENGTH = Math.max(...COUNTRIES.map((c) => c.code.length + c.nsn));
