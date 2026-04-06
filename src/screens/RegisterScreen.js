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

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocused] = useState(null);
  const { register } = useAuth();

  const nameInput     = useRef(null);
  const emailInput    = useRef(null);
  const passwordInput = useRef(null);
  const buttonScale   = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(buttonScale, { toValue: 0.98, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill in all the details to continue.' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password should be at least 6 characters long.' });
      return;
    }
    setLoading(true);
    const result = await register(name.trim(), email.trim(), password);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Registration Error', text2: result.message || 'Something went wrong. Please try again.' });
    } else {
      Toast.show({ type: 'success', text1: 'Account Created!', text2: 'Welcome to your spiritual journey.' });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={['rgba(20, 22, 33, 1)', 'rgba(0, 0, 0, 1)']}
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
            <Text style={styles.arabicHeader}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
            <View style={styles.dividerWrap}>
              <View style={styles.line} />
              <Ionicons name="moon" size={14} color="#c9a84c" />
              <View style={styles.line} />
            </View>
            <Text style={styles.headerSub}>JOIN THE JOURNEY</Text>
          </View>

          {/* Registration Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSub}>Start your exploration of the 99 Divine Names</Text>

            {/* Name Input */}
            <Pressable 
              onPress={() => nameInput.current?.focus()}
              style={[styles.inputWrap, focusedField === 'name' && styles.inputFocused]}
            >
              <View style={styles.inputHeader}>
                <Ionicons 
                  name="person-outline" 
                  size={14} 
                  color={focusedField === 'name' ? '#c9a84c' : COLORS.muted} 
                />
                <Text style={[styles.inputLabel, focusedField === 'name' && { color: '#c9a84c' }]}>
                  FULL NAME
                </Text>
              </View>
              <TextInput
                ref={nameInput}
                style={styles.input}
                placeholder="How should we call you?"
                placeholderTextColor={COLORS.dimmed}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                selectionColor="#c9a84c"
                cursorColor="#c9a84c"
                autoCapitalize="words"
              />
            </Pressable>

            {/* Email Input */}
            <Pressable 
              onPress={() => emailInput.current?.focus()}
              style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}
            >
              <View style={styles.inputHeader}>
                <Ionicons 
                  name="mail-outline" 
                  size={14} 
                  color={focusedField === 'email' ? '#c9a84c' : COLORS.muted} 
                />
                <Text style={[styles.inputLabel, focusedField === 'email' && { color: '#c9a84c' }]}>
                  EMAIL ADDRESS
                </Text>
              </View>
              <TextInput
                ref={emailInput}
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.dimmed}
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

            {/* Password Input */}
            <Pressable 
              onPress={() => passwordInput.current?.focus()}
              style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}
            >
              <View style={styles.inputHeader}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={14} 
                  color={focusedField === 'password' ? '#c9a84c' : COLORS.muted} 
                />
                <Text style={[styles.inputLabel, focusedField === 'password' && { color: '#c9a84c' }]}>
                  SECURE PASSWORD
                </Text>
              </View>
              <View style={styles.passwordRow}>
                <TextInput
                  ref={passwordInput}
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.dimmed}
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
                    color={COLORS.muted}
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
                  colors={['#c9a84c', '#8a6d1e']}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.dark.black} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already part of WAHID?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.dark.black },
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
  },
  arabicHeader: {
    fontFamily: FONTS.arabicBold,
    fontSize: SIZES.arabic.sm,
    color: '#edca66',
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
    ...SHADOW.card,
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
    ...SHADOW.neon,
  },
  buttonText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    color: COLORS.dark.black,
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
