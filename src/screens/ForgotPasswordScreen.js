import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

const COUNTRIES = [
  { code: '+91',  name: 'India' },
  { code: '+1',   name: 'USA/CA' },
  { code: '+44',  name: 'UK' },
  { code: '+971', name: 'UAE' },
  { code: '+92',  name: 'Pakistan' },
  { code: '+60',  name: 'Malaysia' },
  { code: '+966', name: 'Saudi Arabia' },
];

const OTP_LENGTH = 6;

const ForgotPasswordScreen = ({ navigation }) => {
  const { checkPhone, sendOTP, verifyOTP, resetPassword } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'newPassword'

  // Phone step
  const [country, setCountry]     = useState(COUNTRIES[0]);
  const [phone, setPhone]         = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [fullPhone, setFullPhone] = useState('');

  // OTP step
  const [otpValue, setOtpValue]   = useState('');
  const [otpFocused, setOtpFocused] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const otpRef = useRef(null);

  // New password step
  const [newPassword, setNewPassword]             = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [showNewPassword, setShowNewPassword]     = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwFocused, setPwFocused]                 = useState(null);
  const confirmRef = useRef(null);

  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);

  const handleBack = () => {
    if (step === 'otp')         return setStep('phone');
    if (step === 'newPassword') return setStep('otp');
    navigation.goBack();
  };

  // ── Step 1: send OTP ─────────────────────────────────────────────────────

  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      Toast.show({ type: 'error', text1: 'Invalid Number', text2: 'Please enter a valid phone number.' });
      return;
    }
    const fp = `${country.code}${digits}`;

    setLoading(true);
    const check = await checkPhone(fp);
    if (!check.success) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Error', text2: check.message });
      return;
    }
    if (!check.exists) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Not Registered', text2: 'This number is not registered. Please sign up first.' });
      return;
    }

    const result = await sendOTP(fp);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Could Not Send OTP', text2: result.message });
      return;
    }
    setFullPhone(fp);
    setOtpValue('');
    setStep('otp');
    Toast.show({ type: 'success', text1: 'OTP Sent', text2: `Code sent to ${fp}` });
  };

  // ── Step 2: verify OTP ───────────────────────────────────────────────────

  const handleVerifyOTP = async (code) => {
    setLoading(true);
    const result = await verifyOTP(fullPhone, code);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Wrong Code', text2: result.message });
      return;
    }
    setVerificationToken(result.verificationToken);
    setStep('newPassword');
  };

  const handleOtpChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpValue(digits);
    if (digits.length === OTP_LENGTH) handleVerifyOTP(digits);
  };

  const handleResend = async () => {
    setResending(true);
    const result = await sendOTP(fullPhone);
    setResending(false);
    if (result.success) {
      Toast.show({ type: 'success', text1: 'Code Sent', text2: 'OTP has been resent.' });
    }
  };

  // ── Step 3: reset password ────────────────────────────────────────────────

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Incomplete', text2: 'Please fill in both password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mismatch', text2: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Too Short', text2: 'Password must be at least 6 characters.' });
      return;
    }
    setLoading(true);
    const result = await resetPassword(verificationToken, newPassword);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Reset Failed', text2: result.message });
      return;
    }
    Toast.show({ type: 'success', text1: 'Password Reset!', text2: 'You can now sign in with your new password.' });
    navigation.navigate('Login', { identifier: fullPhone });
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderPhone = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your phone number to receive an OTP</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={[styles.inputRow, phoneFocused && styles.inputRowFocused]}>
          <TouchableOpacity style={styles.countryBtn} onPress={() => setShowPicker(v => !v)} activeOpacity={0.7}>
            <Text style={styles.countryCode}>{country.code}</Text>
            <Ionicons name="chevron-down" size={13} color="#aaa" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TextInput
            style={styles.input}
            placeholder="Enter a phone number"
            placeholderTextColor="#4A5568"
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={handleSendOTP}
            selectionColor="#03B7CE"
          />
        </View>

        {showPicker && (
          <View style={styles.picker}>
            {COUNTRIES.map(c => (
              <TouchableOpacity key={c.code} style={styles.pickerItem} onPress={() => { setCountry(c); setShowPicker(false); }}>
                <Text style={styles.pickerCode}>{c.code}</Text>
                <Text style={styles.pickerName}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSendOTP} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={['#02889D', '#03B7CE', '#4BD5E8']}
            locations={[0, 0.5048, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.button}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderOTP = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {fullPhone}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Enter OTP</Text>
        <TouchableOpacity activeOpacity={1} onPress={() => otpRef.current?.focus()} style={styles.otpRow}>
          {Array(OTP_LENGTH).fill(0).map((_, i) => {
            const isCursor = otpFocused && otpValue.length === i;
            const isFilled = i < otpValue.length;
            return (
              <View key={i} style={[styles.otpBox, (isFilled || isCursor) && styles.otpBoxActive]}>
                <Text style={styles.otpDigit}>{otpValue[i] || ''}</Text>
              </View>
            );
          })}
          <TextInput
            ref={otpRef}
            style={styles.hiddenInput}
            value={otpValue}
            onChangeText={handleOtpChange}
            onFocus={() => setOtpFocused(true)}
            onBlur={() => setOtpFocused(false)}
            maxLength={OTP_LENGTH}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoFocus
            caretHidden
          />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.resendPrompt}>
          <Text style={styles.promptText}>Didn't receive an OTP? </Text>
          <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
            {resending
              ? <ActivityIndicator size="small" color="#03B7CE" />
              : <Text style={styles.resendText}>Resend OTP</Text>
            }
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => handleVerifyOTP(otpValue)}
          disabled={loading || otpValue.length < OTP_LENGTH}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#02889D', '#03B7CE', '#4BD5E8']}
            locations={[0, 0.5048, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.button}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderNewPassword = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>Create a strong new password</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>New Password</Text>
        <View style={[styles.inputRow, pwFocused === 'new' && styles.inputRowFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#4A5568"
            value={newPassword}
            onChangeText={setNewPassword}
            onFocus={() => setPwFocused('new')}
            onBlur={() => setPwFocused(null)}
            secureTextEntry={!showNewPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            selectionColor="#03B7CE"
          />
          <TouchableOpacity onPress={() => setShowNewPassword(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
            <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#7A8FA6" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: 22 }]}>Confirm Password</Text>
        <View style={[styles.inputRow, pwFocused === 'confirm' && styles.inputRowFocused]}>
          <TextInput
            ref={confirmRef}
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#4A5568"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setPwFocused('confirm')}
            onBlur={() => setPwFocused(null)}
            secureTextEntry={!showConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleResetPassword}
            selectionColor="#03B7CE"
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
            <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#7A8FA6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleResetPassword} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={['#02889D', '#03B7CE', '#4BD5E8']}
            locations={[0, 0.5048, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={styles.button}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#02889D', '#041518', '#000000']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {step === 'phone'       && renderPhone()}
          {step === 'otp'         && renderOTP()}
          {step === 'newPassword' && renderNewPassword()}
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
    paddingTop: height * 0.08,
    paddingBottom: 36,
  },

  backBtn: {
    alignSelf: 'flex-start',
    padding: 4,
    marginBottom: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8A9A9D',
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1517',
    borderWidth: 1.5,
    borderColor: 'rgba(3,183,206,0.3)',
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 16,
  },
  inputRowFocused: {
    borderColor: '#03B7CE',
    backgroundColor: '#091A1E',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  countryCode: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#2A3540',
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },

  picker: {
    backgroundColor: '#141E22',
    borderRadius: 14,
    marginTop: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(3,183,206,0.2)',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
    gap: 10,
  },
  pickerCode: { color: '#fff', fontSize: 13, fontWeight: '600', width: 44 },
  pickerName: { color: '#8A9A9D', fontSize: 13 },

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: '#03B7CE',
    backgroundColor: '#091A1E',
  },
  otpDigit: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 1,
    color: 'transparent',
    backgroundColor: 'transparent',
  },

  footer: {
    marginTop: 'auto',
  },
  resendPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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

export default ForgotPasswordScreen;
