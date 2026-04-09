/**
 * OTPScreen — Step 2 of OTP login
 * 
 * 6rd digit input boxes with auto-read hints.
 * Design updated to use ArchedHeader (curved design).
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import ArchedHeader from '../components/ArchedHeader';

const OTP_LENGTH = 6;

const OTPScreen = ({ navigation, route }) => {
  const { phone } = route.params; 
  const { sendOTP, verifyOTP } = useAuth();
  const { colors, isDark } = useAppTheme();

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
      Toast.show({ type: 'error', text1: 'Incomplete', text2: 'Please enter all 6 digits.' });
      return;
    }
    
    setLoading(true);
    const result = await verifyOTP(phone, code);
    setLoading(false);

    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Wrong Code', text2: result.message });
      return;
    }

    // Logic for new vs existing user
    if (result.isNewUser) {
        navigation.replace('RegisterProfile');
    } else {
        // AuthNavigator will automatically switch to MainApp because user is set in state
        Toast.show({ type: 'success', text1: 'Welcome Back!' });
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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ArchedHeader 
        title="Sign Up !" 
        subtitle="Verification code sent to your phone" 
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : '#fff' }, SHADOW.card]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Enter OTP</Text>
            
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={el => { inputs.current[i] = el; }}
                  style={[styles.otpBox, { color: colors.text, borderColor: digit ? colors.primary : 'rgba(0,0,0,0.1)' }]}
                  value={digit}
                  onChangeText={text => handleChange(text, i)}
                  onKeyPress={e => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  textContentType="oneTimeCode" // Auto-read hint for iOS
                  autoFocus={i === 0}
                />
              ))}
            </View>

            <View style={styles.footerRow}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>Didn't Receive an OTP? </Text>
                <TouchableOpacity onPress={handleResend} disabled={resending}>
                    <Text style={{ color: colors.primary, fontFamily: FONTS.bold, fontSize: 13 }}>Resend OTP</Text>
                </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleVerify} 
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.9}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Register</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav:  { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACE.xl, paddingTop: 200 },
  
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    paddingVertical: 32,
    marginBottom: SPACE.xxl,
  },
  label: {
     fontFamily: FONTS.regular,
     fontSize: 12,
     textAlign: 'center',
     marginBottom: SPACE.md,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    fontFamily: FONTS.bold,
    fontSize: 22,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACE.xl,
  },
  
  submitBtn: {
    height: 56,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: SPACE.xl,
  },
  submitText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    color: '#fff',
    letterSpacing: 1,
  },
});

export default OTPScreen;
