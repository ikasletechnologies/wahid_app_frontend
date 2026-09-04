import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar, Dimensions, Image } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useAndroidOtpAutofill } from '../utils/otpAutofill';

const { width, height } = Dimensions.get('window');

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 30;

const OTPScreen = ({ navigation, route }) => {
  const { phone } = route.params || { phone: '' };
  const { sendOTP, verifyOTP } = useAuth();
  const { isDark, colors } = useAppTheme();

  const [otpValue, setOtpValue]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [focused, setFocused]     = useState(false);
  const [timer, setTimer]         = useState(RESEND_TIMEOUT);

  const inputRef = useRef(null);

  useEffect(() => {
    if (timer > 0) {
      const intervalId = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [timer]);

  const verifyAndNavigate = async (code) => {
    setLoading(true);
    const result = await verifyOTP(phone, code);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Wrong Code', text2: result.message });
      return;
    }
    if (result.isNewUser) {
      navigation.replace('Register', { verificationToken: result.verificationToken, phone });
      Toast.show({ type: 'success', text1: 'Phone Verified!', text2: 'Please set your account details.' });
    } else {
      navigation.replace('Login', { identifier: phone });
      Toast.show({ type: 'info', text1: 'Welcome Back!', text2: 'Logged in successfully.' });
    }
  };

  const handleOtpChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpValue(digits);
    if (digits.length === OTP_LENGTH) {
      verifyAndNavigate(digits);
    }
  };

  // Android SMS Retriever autofill — reuses the same manual-entry path above,
  // so verification (and its existing error handling) triggers identically
  // whether the code was typed or auto-detected. No-op on iOS (handled by the
  // keyboard via TextInput's textContentType="oneTimeCode" below).
  useAndroidOtpAutofill(OTP_LENGTH, useCallback((code) => {
    handleOtpChange(code);
  }, []));

  const handleVerify = async () => {
    if (otpValue.length < OTP_LENGTH) {
      Toast.show({ type: 'error', text1: 'Incomplete', text2: `Please enter all ${OTP_LENGTH} digits.` });
      return;
    }
    await verifyAndNavigate(otpValue);
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    const result = await sendOTP(phone);
    setResending(false);
    if (result.success) {
      Toast.show({ type: 'success', text1: 'Code Sent', text2: 'OTP has been resent.' });
      setTimer(RESEND_TIMEOUT);
    }
  };

  const formattedTimer = `00:${timer < 10 ? `0${timer}` : timer}`;

  return (
    <LinearGradient
      colors={isDark ? ['#041012', '#080E10', '#050505'] : ['#EBF8FA', '#F4FDFE', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.topSection}>
            <TouchableOpacity
              style={[
                styles.backButton,
                isDark && { backgroundColor: '#111111', shadowColor: '#000', shadowOpacity: 0.1 }
              ]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={22} color={isDark ? '#FFFFFF' : '#0F203C'} />
            </TouchableOpacity>
          </View>

          <View style={styles.illustrationContainer}>
            <Image 
              source={require('../../assets/verify.png')} 
              style={styles.illustrationImage} 
              resizeMode="contain" 
            />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>
              Verify <Text style={{ color: '#03B7CE' }}>OTP</Text>
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={{ color: '#03B7CE', fontWeight: '700' }}>{phone || '+91 98765 43210'}</Text>
            </Text>
          </View>

          <View style={styles.formSection}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              style={styles.otpRow}
            >
              {Array(OTP_LENGTH).fill(0).map((_, i) => {
                const isCursor = focused && otpValue.length === i;
                const isFilled = i < otpValue.length;
                return (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: isDark ? '#111111' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                      },
                      isCursor && { borderColor: '#03B7CE', borderWidth: 2 },
                      isFilled && { borderColor: isDark ? '#03B7CE' : '#E2E8F0' }
                    ]}
                  >
                    {isCursor ? (
                      <Text style={[styles.otpDigit, { color: '#03B7CE' }]}>|</Text>
                    ) : (
                      <Text style={[
                        styles.otpDigit,
                        { color: isDark ? '#FFFFFF' : '#0F203C' },
                        otpValue[i] === undefined && { color: isDark ? '#4A5568' : '#718096', fontSize: 28, marginTop: -4 }
                      ]}>
                        {otpValue[i] !== undefined ? otpValue[i] : '•'}
                      </Text>
                    )}
                  </View>
                );
              })}

              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={otpValue}
                onChangeText={handleOtpChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={OTP_LENGTH}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                autoFocus={true}
                caretHidden
              />
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              {timer > 0 ? (
                <Text style={[styles.resendText, { color: isDark ? '#A0AEC0' : '#718096' }]}>
                  Resend OTP in <Text style={styles.timerText}>{formattedTimer}</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
                  <Text style={[styles.resendText, styles.resendActive]}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.verifyButton} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerWrap}>
            <Ionicons name="lock-closed-outline" size={14} color={isDark ? '#64748B' : '#A0AEC0'} />
            <Text style={[styles.footerText, isDark && { color: '#A0AEC0' }]}>Your information is secure and encrypted</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav:  { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    paddingBottom: 24,
  },
  topSection: {
    alignItems: 'flex-start',
    marginBottom: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 0,
    zIndex: 5,
  },
  illustrationImage: {
    width: Math.min(320, width - 48),
    height: Math.min(320, width - 48),
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F203C',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#718096',
    textAlign: 'center',
    marginBottom: 16,
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAFB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
  },
  phonePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F203C',
  },
  formSection: {
    marginBottom: 32,
    zIndex: 10,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  otpBoxActive: {
    borderColor: '#03B7CE',
    backgroundColor: '#FAFDFF',
    shadowOpacity: 0.05,
  },
  otpDigit: {
    color: '#0F203C',
    fontSize: 24,
    fontWeight: '800',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  resendPrompt: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  resendText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  timerText: {
    color: '#03B7CE',
    fontWeight: '700',
  },
  resendActive: {
    color: '#03B7CE',
    fontWeight: '700',
  },
  verifyButton: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#01A7C2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerWrap: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
});

export default OTPScreen;
