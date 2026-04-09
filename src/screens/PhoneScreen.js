/**
 * PhoneScreen — Step 1 of OTP login
 * 
 * User enters their phone number with country code.
 * Calls POST /api/auth/send-otp → navigates to OTPScreen.
 * 
 * Design updated to use ArchedHeader (curved design).
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated, StatusBar, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import ArchedHeader from '../components/ArchedHeader';

// --- Country codes ------------------------------------------------------------
const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+9 Pakistan', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
];

const PhoneScreen = ({ navigation }) => {
  const { sendOTP } = useAuth();
  const { colors, isDark } = useAppTheme();

  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [focused, setFocused] = useState(false);

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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ArchedHeader
        title="Sign Up !"
        subtitle="Start your journey with WAHID"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : '#fff' }, SHADOW.card]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Enter Mobile Number</Text>

            <View style={[styles.inputRow, focused && { borderColor: colors.primary }]}>
              <TouchableOpacity style={styles.countryBtn} onPress={() => setShowPicker(true)}>
                <Text style={styles.flag}>{country.flag}</Text>
                <Text style={[styles.code, { color: colors.text }]}>{country.code}</Text>

              </TouchableOpacity>

              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="98765 43210"
                placeholderTextColor={colors.textDimmed}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={styles.footerRow}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{ color: colors.primary, fontFamily: FONTS.bold, fontSize: 13 }}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.9}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowPicker(false)} />
        <View style={[styles.sheet, { backgroundColor: isDark ? '#111' : '#fff' }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Select Country</Text>
          <FlatList
            data={COUNTRIES}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pickerRow}
                onPress={() => { setCountry(item); setShowPicker(false); }}
              >
                <Text style={styles.pickerFlag}>{item.flag}</Text>
                <Text style={[styles.pickerName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.pickerCode, { color: colors.textMuted }]}>{item.code}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 8,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flag: { fontSize: 20 },
  code: { fontFamily: FONTS.bold, fontSize: 16 },
  input: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 22,
    letterSpacing: 1,
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

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACE.md, maxHeight: '60%' },
  sheetTitle: { fontFamily: FONTS.bold, textAlign: 'center', marginBottom: SPACE.md },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  pickerFlag: { fontSize: 22 },
  pickerName: { flex: 1, fontSize: 14 },
  pickerCode: { fontFamily: FONTS.bold, fontSize: 14 },
});

export default PhoneScreen;
