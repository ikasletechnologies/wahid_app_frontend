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
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { Image } from 'react-native';

const RegisterScreen = ({ navigation, route }) => {
  const { verificationToken, phone } = route.params || {};

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocused] = useState(null);
  const { signup } = useAuth();
  const { colors, isDark } = useAppTheme();

  const nameInput = useRef(null);
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(buttonScale, { toValue: 0.98, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const handleRegister = async () => {
    if (!username.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Username and password are required.' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password should be at least 6 characters long.' });
      return;
    }
    if (!verificationToken) {
      Toast.show({ type: 'error', text1: 'Session Expired', text2: 'Please verify your phone number again.' });
      navigation.navigate('Phone');
      return;
    }

    setLoading(true);
    const result = await signup(verificationToken, username.trim(), password, name.trim());
    setLoading(false);

    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Registration Error', text2: result.message || 'Something went wrong.' });
    } else {
      Toast.show({ type: 'success', text1: 'Account Created!', text2: 'Welcome to your spiritual journey.' });
      // AuthNavigator will naturally switch to MainApp
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <LinearGradient
        colors={isDark ? ['rgba(20, 22, 33, 1)', 'rgba(0, 0, 0, 1)'] : [colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />

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
              <Image
                source={
                  isDark
                    ? require('../../assets/logoWhite.png')
                    : require('../../assets/logoColor.png')
                }
                style={styles.logo}
              />
            </View>
            <Text style={[styles.arabicHeader, { color: colors.primary, opacity: isDark ? 0.9 : 1.0 }]}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
            <View style={[styles.dividerWrap, { opacity: isDark ? 0.6 : 1.0 }]}>
              <View style={[styles.line, { backgroundColor: colors.primary }]} />
              <Ionicons name="moon" size={14} color={colors.primary} />
              <View style={[styles.line, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>JOIN THE JOURNEY</Text>
          </View>

          {/* Registration Card */}
          <View style={[styles.card, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.cardSub, { color: colors.textMuted }]}>Start your exploration of the 99 Divine Names</Text>

            {/* Name Input */}
            <Pressable
              onPress={() => nameInput.current?.focus()}
              style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.border }, focusedField === 'name' && [styles.inputFocused, { borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)', backgroundColor: isDark ? 'rgba(201, 168, 76, 0.02)' : 'rgba(184, 150, 61, 0.02)' }]]}
            >
              <View style={styles.inputHeader}>
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={focusedField === 'name' ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.inputLabel, { color: colors.textDimmed }, focusedField === 'name' && { color: colors.primary }]}>
                  FULL NAME
                </Text>
              </View>
              <TextInput
                ref={nameInput}
                style={[styles.input, { color: colors.text }]}
                placeholder="How should we call you?"
                placeholderTextColor={colors.textDimmed}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                selectionColor="#c9a84c"
                cursorColor="#c9a84c"
                autoCapitalize="words"
              />
            </Pressable>

            {/* Username Input */}
            <Pressable
              onPress={() => usernameInput.current?.focus()}
              style={[styles.inputWrap, { backgroundColor: colors.glass, borderColor: colors.border }, focusedField === 'username' && [styles.inputFocused, { borderColor: isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(184, 150, 61, 0.3)', backgroundColor: isDark ? 'rgba(201, 168, 76, 0.02)' : 'rgba(184, 150, 61, 0.02)' }]]}
            >
              <View style={styles.inputHeader}>
                <Ionicons
                  name="at-outline"
                  size={14}
                  color={focusedField === 'username' ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.inputLabel, { color: colors.textDimmed }, focusedField === 'username' && { color: colors.primary }]}>
                  CHOOSE USERNAME
                </Text>
              </View>
              <TextInput
                ref={usernameInput}
                style={[styles.input, { color: colors.text }]}
                placeholder="your_unique_username"
                placeholderTextColor={colors.textDimmed}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused(null)}
                selectionColor="#c9a84c"
                cursorColor="#c9a84c"
                autoCapitalize="none"
              />
            </Pressable>

            {/* Password Input */}
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
                  SECURE PASSWORD
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
                onPress={handleRegister}
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
                    <Text style={[styles.buttonText, { color: COLORS.white }]}>CREATE ACCOUNT</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>Already part of WAHID?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xl,
    paddingVertical: 100,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACE.xxl,
  }, logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
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
  arabicHeader: {
    fontFamily: FONTS.arabicBold,
    fontSize: SIZES.arabic.sm,
    textAlign: 'center',
    marginBottom: 8,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACE.sm,
    opacity: 0.6,
  },
  line: {
    width: 32,
    height: 1,
    backgroundColor: '#c9a84c',
  },
  headerSub: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 2.5,
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
    justifyContent: 'center',
    alignItems: 'center',
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

export default RegisterScreen;
