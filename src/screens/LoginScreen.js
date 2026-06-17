import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

const LoginScreen = ({ navigation, route }) => {
  const { identifier: initialIdentifier } = route.params || {};

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
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [focused, setFocused]           = useState(null);

  const { login } = useAuth();
  const passwordInput = useRef(null);

  const handleLogin = async () => {
    const digits = identifier.replace(/\D/g, '');
    if (!identifier.trim() || digits.length === 0) {
      Toast.show({ type: 'error', text1: 'Incomplete Fields', text2: 'Please enter your phone and password.' });
      return;
    }
    if (digits.length !== 10) {
      Toast.show({ type: 'error', text1: 'Invalid Number', text2: 'Phone number must be exactly 10 digits.' });
      return;
    }
    if (!password) {
      Toast.show({ type: 'error', text1: 'Incomplete Fields', text2: 'Please enter your password.' });
      return;
    }
    setLoading(true);
    const raw       = identifier.trim();
    const fullPhone = raw.startsWith('+') ? raw : `${country.code}${digits}`;
    const result    = await login(fullPhone, password);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Login Error', text2: result.message || 'Incorrect credentials.' });
    } else {
      Toast.show({ type: 'success', text1: 'Welcome back!', text2: 'Signed in successfully.' });
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
            <Text style={styles.title}>Sign In Your Account</Text>
            <Text style={styles.subtitle}>Sign In and improve your knowledge today</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputRow, focused === 'phone' && styles.inputRowFocused]}>
              <TouchableOpacity
                style={styles.countryBtn}
                onPress={() => setShowPicker(v => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryCode}>{country.code}</Text>
                <Ionicons name="chevron-down" size={13} color="#aaa" style={{ marginLeft: 3 }} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TextInput
                style={styles.input}
                placeholder="Enter a phone number"
                placeholderTextColor="#4A5568"
                value={identifier}
                onChangeText={setIdentifier}
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="next"
                onSubmitEditing={() => passwordInput.current?.focus()}
                selectionColor="#03B7CE"
              />
            </View>

            {showPicker && (
              <View style={styles.picker}>
                {COUNTRIES.map(c => (
                  <TouchableOpacity
                    key={c.code}
                    style={styles.pickerItem}
                    onPress={() => { setCountry(c); setShowPicker(false); }}
                  >
                    <Text style={styles.pickerCode}>{c.code}</Text>
                    <Text style={styles.pickerName}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.label, { marginTop: 22 }]}>Password</Text>
            <View style={[styles.inputRow, focused === 'password' && styles.inputRowFocused]}>
              <TextInput
                ref={passwordInput}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#4A5568"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                selectionColor="#03B7CE"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#7A8FA6" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.promptRow}>
              <Text style={styles.promptText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Phone')} activeOpacity={0.7}>
                <Text style={styles.promptLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={['#02889D', '#03B7CE', '#4BD5E8']}
                locations={[0, 0.5048, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.button}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Sign In</Text>
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

  footer: {
    marginTop: 'auto',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  forgotText: {
    color: '#03B7CE',
    fontSize: 13,
    fontWeight: '600',
  },
  promptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 22,
  },
  promptText: {
    color: '#8A9A9D',
    fontSize: 13,
  },
  promptLink: {
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

export default LoginScreen;
