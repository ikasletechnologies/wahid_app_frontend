import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const COUNTRIES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'USA/CA' },
  { code: '+44', name: 'UK' },
  { code: '+971', name: 'UAE' },
  { code: '+92', name: 'Pakistan' },
  { code: '+60', name: 'Malaysia' },
  { code: '+966', name: 'Saudi Arabia' },
];

const WahidLogo = () => (
  <View style={styles.logoContainer}>
    <Image
      source={require('../../assets/icon.png')}
      style={{ width: 65, height: 65 }}
      resizeMode="contain"
    />
    <Text style={styles.logoTitle}>WAHID</Text>
    <Text style={styles.logoSubtitle}>Learn • Reflect • Grow</Text>
  </View>
);

const DecorativeBackground = ({ isDark }) => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, right: 0 }}>
      <Circle cx={width * 0.9} cy={height * 0.02} r={width * 0.55} fill={isDark ? "#00ACC1" : "#E1F5F8"} opacity={isDark ? 0.15 : 1} />
      <Circle cx={width * 0.8} cy={-height * 0.05} r={width * 0.35} fill={isDark ? "#00ACC1" : "#CFF0F5"} opacity={isDark ? 0.1 : 0.6} />
    </Svg>
  </View>
);

const PhoneScreen = ({ navigation }) => {
  const { checkPhone, sendOTP } = useAuth();
  const { isDark, colors } = useAppTheme();

  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [focused, setFocused] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [existingPhone, setExistingPhone] = useState('');

  const phoneInput = useRef(null);

  const handlePhoneChange = (text) => {
    if (accountExists) setAccountExists(false);
    if (text.startsWith('+')) {
      const matched = COUNTRIES.find(c => text.startsWith(c.code));
      if (matched) {
        setCountry(matched);
        setPhone(text.slice(matched.code.length));
        return;
      }
    }
    setPhone(text);
  };

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      Toast.show({ type: 'error', text1: 'Invalid Number', text2: 'Please enter a valid phone number.' });
      return;
    }
    const fullPhone = `${country.code}${digits}`;

    setLoading(true);
    const check = await checkPhone(fullPhone);
    setLoading(false);

    if (!check.success) {
      Toast.show({ type: 'error', text1: 'Error', text2: check.message });
      return;
    }

    if (check.exists) {
      setExistingPhone(fullPhone);
      setAccountExists(true);
      Toast.show({
        type: 'error',
        text1: 'Number Already Registered',
        text2: 'This number already has an account. Please sign in.',
      });
      return;
    }

    // New user — send OTP and proceed to verification
    setLoading(true);
    const otpResult = await sendOTP(fullPhone);
    setLoading(false);

    if (!otpResult.success) {
      Toast.show({ type: 'error', text1: 'Could Not Send OTP', text2: otpResult.message });
      return;
    }
    navigation.navigate('OTP', { phone: fullPhone });
  };

  return (
    <LinearGradient
      colors={isDark ? ['#041012', '#080E10', '#050505'] : ['#EBF8FA', '#F4FDFE', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <DecorativeBackground isDark={isDark} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/icon.png')}
                style={{ width: 65, height: 65 }}
                resizeMode="contain"
              />
              <Text style={[styles.logoTitle, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>WAHID</Text>
              <Text style={[styles.logoSubtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Learn • Reflect • Grow</Text>
            </View>
            <Image
              source={require('../../assets/signInBook.png')}
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Continue your learning journey</Text>
          </View>

          <View style={styles.form}>
            {accountExists ? (
              <View style={[styles.existsBox, isDark && { backgroundColor: '#151515', borderColor: '#03B7CE' }]}>
                <Text style={[styles.existsTitle, { color: isDark ? '#FFFFFF' : '#1A202C' }]}>This number is already registered.</Text>
                <Text style={[styles.existsSubtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Please sign in to your account instead.</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login', { identifier: existingPhone })} style={{ marginTop: 10 }}>
                  <Text style={{ color: '#03B7CE', fontWeight: '700' }}>Go to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              },
              focused && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#151515' } : styles.inputFocused)
            ]}>
              <View style={[styles.iconBox, isDark && { backgroundColor: 'rgba(3, 183, 206, 0.15)' }]}>
                <Ionicons name="phone-portrait-outline" size={18} color="#03B7CE" />
              </View>
              <View style={styles.inputContentWrapper}>
                <Text style={[styles.inputLabel, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>Mobile Number</Text>
                <View style={styles.phoneInputContent}>
                  <TouchableOpacity style={styles.countryBtn} onPress={() => setShowPicker(v => !v)}>
                    <Text style={[styles.countryCode, { color: isDark ? '#FFFFFF' : '#1A202C' }]}>{country.code}</Text>
                    <Ionicons name="chevron-down" size={14} color={isDark ? '#E2E8F0' : '#1A202C'} />
                  </TouchableOpacity>
                  <View style={[styles.divider, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]} />
                  <TextInput
                    ref={phoneInput}
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#1A202C' }]}
                    placeholder="Enter mobile number"
                    placeholderTextColor={isDark ? '#64748B' : '#A0AEC0'}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    keyboardType="phone-pad"
                    maxLength={15}
                    returnKeyType="done"
                    onSubmitEditing={handleSend}
                    selectionColor="#03B7CE"
                  />
                </View>
              </View>
            </View>

            {showPicker && (
              <View style={[styles.picker, isDark && { backgroundColor: '#161616', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                {COUNTRIES.map(c => (
                  <TouchableOpacity key={c.code} style={styles.pickerItem} onPress={() => { setCountry(c); setShowPicker(false); }}>
                    <Text style={[styles.pickerCode, { color: isDark ? '#FFFFFF' : '#1A202C' }]}>{c.code}</Text>
                    <Text style={[styles.pickerName, { color: isDark ? '#A0AEC0' : '#718096' }]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.signInButton} onPress={handleSend} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.signInText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ position: 'absolute', right: 24 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.orContainer}>
            <View style={[styles.orLine, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
            <Text style={[styles.orText, isDark && { color: '#94A3B8' }]}>OR</Text>
            <View style={[styles.orLine, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity style={[
              styles.socialBtn,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              }
            ]} activeOpacity={0.7}>
              <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.socialIcon} />
              <Text style={[styles.socialBtnText, { color: isDark ? '#FFFFFF' : '#1A202C' }]}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[
              styles.socialBtn,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              }
            ]} activeOpacity={0.7}>
              <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.socialIcon} />
              <Text style={[styles.socialBtnText, { color: isDark ? '#FFFFFF' : '#1A202C' }]}>Continue with Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.promptRow}>
            <Text style={[styles.promptText, isDark && { color: '#94A3B8' }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.promptLinkContainer}>
              <Text style={styles.promptLink}>Sign In </Text>
              <Ionicons name="chevron-forward" size={13} color="#03B7CE" style={{ marginTop: 1 }} />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.15,
    paddingBottom: 36,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 10,
  },
  logoContainer: {
    marginTop: 2,
    top: 0,
    left: 0,
  },
  logoTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0F203C',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  logoSubtitle: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '600',
    marginTop: 1,
  },
  illustrationImage: {
    width: 280,
    height: 340,
    position: 'absolute',
    right: -50,
    top: -140,
    zIndex: 5,
  },
  header: {
    marginBottom: 28,
    marginTop: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F203C',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#718096',
    fontWeight: '500',
  },
  form: {
    marginBottom: 20,
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: '#03B7CE',
    backgroundColor: '#FAFDFF',
  },
  iconBox: {
    width: 36,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#E6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  inputContentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 11,
    color: '#1A202C',
    fontWeight: '700',
    marginBottom: 4,
  },
  phoneInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A202C',
    padding: 0,
    margin: 0,
    fontWeight: '500',
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: -16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  pickerCode: { color: '#1A202C', fontSize: 13, fontWeight: '600', width: 40 },
  pickerName: { color: '#718096', fontSize: 13 },
  existsBox: {
    backgroundColor: '#FAFDFF',
    borderWidth: 1,
    borderColor: '#03B7CE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  existsTitle: {
    color: '#1A202C',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  existsSubtitle: {
    color: '#718096',
    fontSize: 13,
  },
  signInButton: {
    flexDirection: 'row',
    backgroundColor: '#03B7CE',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  orText: {
    marginHorizontal: 16,
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '700',
  },
  socialContainer: {
    gap: 12,
    marginBottom: 32,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  socialIcon: {
    position: 'absolute',
    left: 24,
  },
  socialBtnText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  promptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '500',
  },
  promptLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promptLink: {
    color: '#03B7CE',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PhoneScreen;
