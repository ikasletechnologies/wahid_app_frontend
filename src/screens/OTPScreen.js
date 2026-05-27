import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
// No extra OTP library needed – using native OS autofill
import { FONTS } from '../theme';

const { height } = Dimensions.get('window');

// Keep OTP_LENGTH dynamic. Screenshots show 5, but logic previously was 6. 
// We use flex layout to let them sit nicely regardless.
const OTP_LENGTH = 6;

const OTPScreen = ({ navigation, route }) => {
  const { phone } = route.params; 
  const { sendOTP, verifyOTP } = useAuth();
  
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputs = useRef([]);

  const handleChange = (text, index) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const next = [...otp];
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
        navigation.navigate('Register', { 
          verificationToken: result.verificationToken,
          phone 
        });
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
      // Start listening for the incoming OTP SMS (Android). iOS will auto‑fill via oneTimeCode.
      // No native OTP autofill needed – OS autofill will handle the code automatically
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Premium Dark Teal Background */}
      <LinearGradient
        colors={['#0A3B40', '#03080A', '#000000']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your journey with <Text style={styles.brand}>WAHID</Text></Text>
          </View>

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
                    // For Android, the SMS Retriever listener will set the OTP directly.
                    // The TextInput remains a single‑character field for manual entry.
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.footerWrap}>
            <View style={styles.resendPrompt}>
              <Text style={styles.promptText}>Didn't Receive an OTP? </Text>
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00ADC1', '#00DFE0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
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
  kav: { flex: 1 },
  scroll: { 
    flexGrow: 1, 
    paddingHorizontal: 24,
    paddingTop: height * 0.15,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#8A9A9D',
    textAlign: 'center',
  },
  brand: {
    color: '#00ADC1',
    fontFamily: FONTS.bold,
  },
  formSection: {
    marginBottom: 40,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 15,
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
    height: 52,
    backgroundColor: '#0F1214',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 20,
  },
  otpBoxActive: {
    borderColor: '#00ADC1',
    backgroundColor: '#0A1C20',
  },
  footerWrap: {
    marginTop: 'auto',
  },
  resendPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  promptText: {
    color: '#8A9A9D',
    fontSize: 13,
  },
  resendText: {
    color: '#00ADC1',
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  button: {
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ADC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default OTPScreen;
