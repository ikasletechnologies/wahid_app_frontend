import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar, Dimensions, Image } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { authenticateWithGoogle } from '../services/auth/googleAuth';
import { useFacebookAuth } from '../hooks/useFacebookAuth';
import { loginWithFacebook } from '../services/auth/facebookAuth';

const { width, height } = Dimensions.get('window');

const COUNTRIES = [
  { code: '+91', name: 'India' },
  { code: '+971', name: 'UAE' },
  { code: '+44', name: 'UK' },
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

const LoginScreen = ({ navigation, route }) => {
  const { login, completeLogin } = useAuth();
  const { isDark, colors } = useAppTheme();
  const { identifier: initialIdentifier } = route.params || {};

  const { signInWithGoogle, error: googleError, loading: googleAuthLoading } = useGoogleAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const isGoogleLoading = googleAuthLoading || googleLoading;

  useEffect(() => {
    if (googleError) {
      Toast.show({
        type: 'error',
        text1: 'Google Auth',
        text2: googleError,
      });
    }
  }, [googleError]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.accessToken) {
        const response = await authenticateWithGoogle(result.accessToken);
        if (response.success) {
          await completeLogin(response.user, response.token || response.accessToken, response.refreshToken);
          Toast.show({
            type: 'success',
            text1: 'Welcome back!',
            text2: 'Signed in with Google successfully.'
          });
          navigation.navigate('Main', { screen: 'Home' });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Google Auth Error',
            text2: response.message || 'Verification failed.'
          });
        }
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Google Auth Error',
        text2: err.response?.data?.message || err.message || 'Something went wrong.'
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const { signInWithFacebook, error: facebookError, loading: facebookAuthLoading } = useFacebookAuth();
  const [facebookLoading, setFacebookLoading] = useState(false);
  const isFacebookLoading = facebookAuthLoading || facebookLoading;

  useEffect(() => {
    if (facebookError) {
      Toast.show({
        type: 'error',
        text1: 'Facebook Auth',
        text2: facebookError,
      });
    }
  }, [facebookError]);

  const handleFacebookLogin = async () => {
    setFacebookLoading(true);
    try {
      const result = await signInWithFacebook();
      if (result?.accessToken) {
        const response = await loginWithFacebook(result.accessToken);
        if (response.success) {
          await completeLogin(response.user, response.token || response.accessToken, response.refreshToken);
          Toast.show({
            type: 'success',
            text1: 'Welcome back!',
            text2: 'Signed in with Facebook successfully.'
          });
          navigation.navigate('Main', { screen: 'Home' });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Facebook Auth Error',
            text2: response.message || 'Verification failed.'
          });
        }
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Facebook Auth Error',
        text2: err.response?.data?.message || err.message || 'Something went wrong.'
      });
    } finally {
      setFacebookLoading(false);
    }
  };

  const [country, setCountry] = useState(() => {
    if (initialIdentifier?.startsWith('+')) {
      return COUNTRIES.find(c => initialIdentifier.startsWith(c.code)) || COUNTRIES[0];
    }
    return COUNTRIES[0];
  });
  const [showPicker, setShowPicker] = useState(false);
  const [identifier, setIdentifier] = useState(() => {
    if (initialIdentifier?.startsWith('+')) {
      const matched = COUNTRIES.find(c => initialIdentifier.startsWith(c.code));
      return matched ? initialIdentifier.slice(matched.code.length) : initialIdentifier;
    }
    return initialIdentifier || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const passwordInput = useRef(null);

  const expectedLength = country.code === '+971' ? 9 : 10;

  const handleLogin = async () => {
    const digits = identifier.replace(/\D/g, '');
    if (!identifier.trim() || digits.length === 0) {
      Toast.show({ type: 'error', text1: 'Incomplete Fields', text2: 'Please enter your phone and password.' });
      return;
    }
    if (digits.length !== expectedLength) {
      Toast.show({ type: 'error', text1: 'Invalid Number', text2: `Please enter a valid ${expectedLength}-digit phone number.` });
      return;
    }
    if (!password) {
      Toast.show({ type: 'error', text1: 'Incomplete Fields', text2: 'Please enter your password.' });
      return;
    }
    setLoading(true);
    const raw = identifier.trim();
    const fullPhone = raw.startsWith('+') ? raw : `${country.code}${digits}`;
    const result = await login(fullPhone, password);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Login Error', text2: result.message || 'Incorrect credentials.' });
    } else {
      Toast.show({ type: 'success', text1: 'Welcome back!', text2: 'Signed in successfully.' });
    }
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
              <Text style={[styles.logoTitle, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>Wahid</Text>
              <Text style={[styles.logoSubtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Learn • Reflect • Live By</Text>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Sign in to continue learning</Text>
          </View>

          <View style={styles.form}>
            {/* Phone Input */}
            <View style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              },
              focused === 'phone' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#151515' } : styles.inputFocused)
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
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#1A202C' }]}
                    placeholder="Enter mobile number"
                    placeholderTextColor={isDark ? '#64748B' : '#A0AEC0'}
                    value={identifier}
                    onChangeText={(text) => setIdentifier(text.replace(/\D/g, ''))}
                    onFocus={() => setFocused('phone')}
                    onBlur={() => setFocused(null)}
                    keyboardType="phone-pad"
                    maxLength={expectedLength}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInput.current?.focus()}
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

            {/* Password Input */}
            <View style={[
              styles.inputContainer,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              },
              focused === 'password' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#151515' } : styles.inputFocused)
            ]}>
              <View style={[styles.iconBox, isDark && { backgroundColor: 'rgba(3, 183, 206, 0.15)' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#03B7CE" />
              </View>
              <View style={styles.inputContentWrapper}>
                <Text style={[styles.inputLabel, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>Password</Text>
                <View style={styles.phoneInputContent}>
                  <TextInput
                    ref={passwordInput}
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#1A202C' }]}
                    placeholder="Enter your password"
                    placeholderTextColor={isDark ? '#64748B' : '#A0AEC0'}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    selectionColor="#03B7CE"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={isDark ? '#64748B' : '#A0AEC0'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signInButton} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.signInText}>Sign In</Text>
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
            <TouchableOpacity
              style={[
                styles.socialCircleBtn,
                {
                  backgroundColor: isDark ? '#111111' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
                }
              ]}
              activeOpacity={0.7}
              onPress={() => handleGoogleLogin()}
              disabled={loading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color="#EA4335" />
              ) : (
                <Ionicons name="logo-google" size={22} color="#EA4335" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialCircleBtn,
                {
                  backgroundColor: isDark ? '#111111' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
                }
              ]}
              activeOpacity={0.7}
              onPress={() => handleFacebookLogin()}
              disabled={loading || isFacebookLoading}
            >
              {isFacebookLoading ? (
                <ActivityIndicator size="small" color="#1877F2" />
              ) : (
                <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.promptRow}>
            <Text style={[styles.promptText, isDark && { color: '#94A3B8' }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Phone')} activeOpacity={0.7} style={styles.promptLinkContainer}>
              <Text style={styles.promptLink}>Sign Up </Text>
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
    paddingHorizontal: 29,
    paddingTop: height * 0.15,
    paddingBottom: 36,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 10,
  },
  logoContainer: {
    marginTop: 2,
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0F203C',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
  },
  logoSubtitle: {
    fontSize: 10,
    color: '#718096',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 1,
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
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A202C',
    padding: 0,
    margin: 0,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 4,
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: -10,
    marginBottom: 16,
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
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#03B7CE',
    fontSize: 13,
    fontWeight: '700',
  },
  signInButton: {
    flexDirection: 'row',
    backgroundColor: '#03B7CE',
    height: 54,
    borderRadius: 14,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 32,
  },
  socialCircleBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
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

export default LoginScreen;
