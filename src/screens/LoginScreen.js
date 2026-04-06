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
  Alert,
  Animated,
  StatusBar,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [focusedField, setFocused] = useState(null);
  const { login } = useAuth();

  const emailInput    = useRef(null);
  const passwordInput = useRef(null);
  const buttonScale   = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(buttonScale, { toValue: 0.98, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(buttonScale, { toValue: 1,    useNativeDriver: true }).start();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Incomplete Fields', 'Please enter both your email and password.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Login Error', result.message || 'The credentials you entered are incorrect.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={['rgba(20, 22, 33, 1)', 'rgba(0, 0, 0, 1)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Elements */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

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
            <View style={styles.logoWrap}>
              <Ionicons name="sparkles" size={32} color="#c9a84c" />
            </View>
            <Text style={styles.brandName}>WAHID</Text>
            <Text style={styles.arabicHeader}>بِسْمِ ٱللَّهِ</Text>
          </View>

          {/* Login Card (Glassmorphic) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to continue your spiritual journey</Text>

            {/* Email Field */}
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

            {/* Password Field */}
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
                  PASSWORD
                </Text>
              </View>
              <TextInput
                ref={passwordInput}
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.dimmed}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                selectionColor="#c9a84c"
                cursorColor="#c9a84c"
                secureTextEntry
              />
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
                  colors={['#c9a84c', '#8a6d1e']}
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.dark.black} size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>SIGN IN</Text>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.dark.black} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Wahid?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.footerLink}>Create Account</Text>
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
    backgroundColor: COLORS.dark.black,
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
  glowBottom: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(45, 156, 150, 0.05)',
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
    color: '#c9a84c',
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

  // Button
  button: {
    height: 54,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...SHADOW.card,
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

export default LoginScreen;
