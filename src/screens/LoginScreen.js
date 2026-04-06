import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
  Pressable,
  Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [focusedField, setFocused]    = useState(null);
  const { login } = useAuth();
  const { colors, isDark } = useAppTheme();

  const emailInput    = useRef(null);
  const passwordInput = useRef(null);
  const buttonScale   = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(buttonScale, { toValue: 0.98, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(buttonScale, { toValue: 1,    useNativeDriver: true }).start();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Incomplete Fields', text2: 'Please enter both your email and password.' });
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Login Error', text2: result.message || 'The credentials you entered are incorrect.' });
    } else {
      Toast.show({ type: 'success', text1: 'Welcome back!', text2: 'Signed in successfully.' });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={isDark ? ['rgba(20, 22, 33, 1)', 'rgba(0, 0, 0, 1)'] : [colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Elements */}
      <View style={styles.glowTop} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoWrap, { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.1)' : 'rgba(184, 150, 61, 0.15)', borderColor: isDark ? 'rgba(201, 168, 76, 0.2)' : 'rgba(184, 150, 61, 0.3)' }]}>
              <Ionicons name="sparkles" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>WAHID</Text>
            <Text style={[styles.arabicHeader, { color: colors.primary, opacity: isDark ? 0.8 : 1.0 }]}>بِسْمِ ٱللَّهِ</Text>
          </View>

          {/* Login Card (Glassmorphic) */}
          <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Sign in to continue your spiritual journey</Text>

            {/* Email Field */}
            <Pressable 
              onPress={() => emailInput.current?.focus()}
              style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.border }, focusedField === 'email' && [styles.inputFocused, { borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)', backgroundColor: isDark ? 'rgba(201, 168, 76, 0.02)' : 'rgba(184, 150, 61, 0.02)' }]]}
            >
              <View style={styles.inputHeader}>
                <Ionicons 
                  name="mail-outline" 
                  size={14} 
                  color={focusedField === 'email' ? colors.primary : colors.textMuted} 
                />
                <Text style={[styles.inputLabel, { color: colors.textDimmed }, focusedField === 'email' && { color: colors.primary }]}>
                  EMAIL ADDRESS
                </Text>
              </View>
              <TextInput
                ref={emailInput}
                style={[styles.input, { color: colors.text }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.textDimmed}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                selectionColor="#c9a84c"
                cursorColor="#c9a84c"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Pressable>

            {/* Password Field */}
            <Pressable 
              onPress={() => passwordInput.current?.focus()}
              style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.border }, focusedField === 'password' && [styles.inputFocused, { borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)', backgroundColor: isDark ? 'rgba(201, 168, 76, 0.02)' : 'rgba(184, 150, 61, 0.02)' }]]}
            >
              <View style={styles.inputHeader}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={14} 
                  color={focusedField === 'password' ? colors.primary : colors.textMuted} 
                />
                <Text style={[styles.inputLabel, { color: colors.textDimmed }, focusedField === 'password' && { color: colors.primary }]}>
                  PASSWORD
                </Text>
              </View>
              <View style={styles.passwordRow}>
                <TextInput
                  ref={passwordInput}
                  style={[styles.input, { flex: 1, color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textDimmed}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  selectionColor="#c9a84c"
                  cursorColor="#c9a84c"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </Pressable>

            {/* Action Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: SPACE.md }}>
              <TouchableOpacity
                onPress={handleLogin}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.primary, isDark ? '#8a6d1e' : '#B8963D']}
                  style={[styles.button, !isDark && { shadowColor: colors.primary, elevation: 6 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color={isDark ? COLORS.black : COLORS.white} size="small" />
                  ) : (
                    <>
                      <Text style={[styles.buttonText, { color: COLORS.white }]}>SIGN IN</Text>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>New to Wahid?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
    paddingVertical: 100,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(201, 168, 76, 0.05)',
    filter: 'blur(50px)',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACE.xxl,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.2)',
  },
  brandName: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.white,
    letterSpacing: 8,
    textAlign: 'center',
  },
  arabicHeader: {
    fontFamily: FONTS.arabicBold,
    fontSize: SIZES.arabic.sm,
    marginTop: SPACE.xs,
    opacity: 0.8,
  },

  // Card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.xl,
    padding: SPACE.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSub: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACE.xl,
  },

  // Inputs
  inputWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.xs,
    marginBottom: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  inputFocused: {
    borderColor: 'rgba(201, 168, 76, 0.3)',
    backgroundColor: 'rgba(201, 168, 76, 0.02)',
  },
  inputLabel: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.muted,
    letterSpacing: 1.5,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.base,
    color: COLORS.white,
    minHeight: 40,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },

  // Button
  button: {
    height: 54,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    color: COLORS.black,
    letterSpacing: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACE.xl,
    gap: 8,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: SIZES.sm,
  },
  footerLink: {
    color: '#c9a84c',
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
  },
});

export default LoginScreen;
