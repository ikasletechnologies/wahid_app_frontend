// src/utils/autoFillOtp.ts
import { Platform } from 'react-native';

/**
 * OTP auto-fill helper.
 *
 * On **iOS** the native one-time-code autofill works automatically when
 * the TextInput has `textContentType="oneTimeCode"`.
 *
 * On **Android** the SMS is surfaced by the OS keyboard when
 * `autoComplete="sms-otp"` is set on the TextInput.
 *
 * This function is a lightweight no-op stub kept so that any existing
 * call-sites (e.g. OTPScreen) don't break. No third-party native module
 * is required.
 */
export const startAutoFill = async (
  _onCodeReceived: (code: string) => void,
) => {
  // Nothing to do — autofill is handled by the OS via TextInput props:
  //   iOS  → textContentType="oneTimeCode"
  //   Android → autoComplete="sms-otp"
  if (Platform.OS === 'android') {
    console.log('[OTP] Android SMS autofill is handled by autoComplete="sms-otp" on TextInput');
  }
};
