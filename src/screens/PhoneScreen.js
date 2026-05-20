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

const PhoneScreen = ({ navigation }) => {
  const { sendOTP } = useAuth();

  const [country, setCountry]       = useState(COUNTRIES[0]);
  const [phone, setPhone]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [focused, setFocused]       = useState(false);

  const phoneInput = useRef(null);

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      Toast.show({ type: 'error', text1: 'Invalid Number', text2: 'Please enter a valid phone number.' });
      return;
    }
    const fullPhone = `${country.code}${digits}`;
    setLoading(true);
    const result = await sendOTP(fullPhone);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Could Not Send OTP', text2: result.message });
      return;
    }
    navigation.navigate('OTP', { phone: fullPhone });
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Start your journey with <Text style={styles.brand}>WAHID</Text>
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            <Text style={styles.label}>Enter Mobile Number</Text>

            <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
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
                ref={phoneInput}
                style={styles.input}
                placeholder="Enter a phone number"
                placeholderTextColor="#4A5568"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="phone-pad"
                maxLength={15}
                returnKeyType="done"
                onSubmitEditing={handleSend}
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
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.promptRow}>
              <Text style={styles.promptText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.promptLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSend} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={['#02889D', '#03B7CE', '#4BD5E8']}
                locations={[0, 0.5048, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.button}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Get OTP</Text>
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
  brand: {
    color: '#03B7CE',
    fontWeight: '700',
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

export default PhoneScreen;
