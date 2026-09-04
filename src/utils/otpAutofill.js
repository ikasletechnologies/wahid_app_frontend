import { useEffect } from 'react';
import { Platform } from 'react-native';

// Android SMS Retriever API needs no runtime permissions (not RECEIVE_SMS/READ_SMS) —
// it only sees a message if it contains this app's signature hash, appended by the
// backend via Twilio's `appHash` verification param. iOS has no equivalent JS API:
// its autofill is handled entirely by the OS/keyboard via TextInput's
// `textContentType="oneTimeCode"`, so there is nothing to do here on iOS.
//
// react-native-otp-verify's JS wrapper constructs a NativeEventEmitter at
// module-load time and throws synchronously if its native module isn't linked
// yet (e.g. before a fresh `expo prebuild`/native rebuild picks it up). Since
// this file is imported from AuthContext on every app boot, it is required
// lazily and only on Android — never at module scope — with every call site
// wrapped in try/catch, so a not-yet-rebuilt app degrades to manual OTP entry
// instead of crashing on startup.
function loadOtpVerify() {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line global-require
    return require('react-native-otp-verify');
  } catch {
    return null;
  }
}

// Resolves the 11-char app hash to send with the OTP request so Twilio appends it
// to the SMS body. Returns null on iOS, or if the native module isn't linked yet,
// or if the native call fails for any reason — autofill is a nice-to-have, manual
// entry must keep working either way.
export async function getAndroidAppHash() {
  const otpVerify = loadOtpVerify();
  if (!otpVerify) return null;
  try {
    const hashes = await otpVerify.getHash();
    return Array.isArray(hashes) && hashes.length > 0 ? hashes[0] : null;
  } catch {
    return null;
  }
}

// Listens for the incoming OTP SMS on Android and calls onOtpDetected(digits) once
// a code of the expected length is found in the message. No-op on other platforms,
// if the native module isn't linked yet, and while `enabled` is false — e.g. a
// multi-step screen should only listen during its actual OTP step.
export function useAndroidOtpAutofill(otpLength, onOtpDetected, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const otpVerify = loadOtpVerify();
    if (!otpVerify) return undefined;

    const pattern = new RegExp(`\\d{${otpLength}}`);
    let subscribed = true;

    otpVerify
      .startOtpListener((message) => {
        if (!subscribed) return;
        const match = pattern.exec(message || '');
        if (match) onOtpDetected(match[0]);
      })
      .catch(() => {
        // No SMS permission/Play Services issue on this device — manual entry
        // still works, so this is silently ignored rather than surfaced.
      });

    return () => {
      subscribed = false;
      try {
        otpVerify.removeListener();
      } catch {
        // Nothing to clean up if the listener never actually started.
      }
    };
  }, [otpLength, onOtpDetected, enabled]);
}
