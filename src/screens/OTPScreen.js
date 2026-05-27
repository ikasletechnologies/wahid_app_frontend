import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { FONTS } from '../theme';

const { height } = Dimensions.get('window');

const OTP_LENGTH = 6;

const OTPScreen = ({ navigation, route }) => {
  const { phone } = route.params;
  const { sendOTP, verifyOTP } = useAuth();

  const [otp, setOtp]           = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);

  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Toast.show({ type: 'error', text1: 'Incomplete', text2: `Please enter all ${OTP_LENGTH} digits.` });
      return;
    }
    setLoading(true);
    const result = await verifyOTP(phone, code);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Wrong Code', text2: result.message });
      return;
    }
    if (result.isNewUser) {
      navigation.navigate('Register', { verificationToken: result.verificationToken, phone });
      Toast.show({ type: 'success', text1: 'Phone Verified!', text2: 'Please set your account details.' });
    } else {
      navigation.navigate('Login', { identifier: phone });
      Toast.show({ type: 'info', text1: 'Welcome Back!', text2: 'Please enter your password to login.' });
    }
  };

  const handleResend = async () => {
    setResending(true);
    const result = await sendOTP(phone);
    setResending(false);
    if (result.success) {
        Toast.show({ type: 'success', text1: 'Code Sent', text2: 'OTP has been resent.' });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#02889D', '#041518', '#000000']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Start your journey with <Text style={styles.brand}>WAHID</Text>
            </Text>
          </View>

          {/* ── OTP Boxes ── */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Enter OTP</Text>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => {
                const isActive = digit !== '';
                return (
                  <TextInput
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    style={[
                      styles.otpBox, 
                      isActive && styles.otpBoxActive
                    ]}
                    value={digit}
                    onChangeText={text => handleChange(text, i)}
                    onKeyPress={e => handleKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    textContentType="oneTimeCode"
                    selectionColor="#00ADC1"
                  />
                );
              })}
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footerWrap}>
            <View style={styles.resendPrompt}>
              <Text style={styles.promptText}>Didn't receive an OTP? </Text>
              <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={['#02889D', '#03B7CE', '#4BD5E8']}
                locations={[0, 0.5048, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.button}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Register</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  kav:  { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.13,
    paddingBottom: 36,
  },

  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8A9A9D',
    textAlign: 'center',
  },
  brand: {
    color: '#03B7CE',
    fontWeight: '700',
  },

  formSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    backgroundColor: '#0D1517',
    borderWidth: 1.5,
    borderColor: 'rgba(3,183,206,0.25)',
    borderRadius: 14,
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  otpBoxActive: {
    borderColor: '#03B7CE',
    backgroundColor: '#091A1E',
  },

  footerWrap: {
    marginTop: 'auto',
  },
  resendPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 22,
  },
  promptText: {
    color: '#8A9A9D',
    fontSize: 13,
  },
  resendText: {
    color: '#03B7CE',
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#FDFEFE',
    elevation: 6,
    shadowColor: '#4BD5E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default OTPScreen;
