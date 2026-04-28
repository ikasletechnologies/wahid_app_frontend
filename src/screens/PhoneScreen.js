import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { FONTS } from '../theme';

const { height } = Dimensions.get('window');

const COUNTRIES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'USA/CA' },
  { code: '+44', name: 'UK' },
  { code: '+971', name: 'UAE' },
  { code: '+92', name: 'Pakistan' },
  { code: '+60', name: 'Malaysia' },
  { code: '+966', name: 'Saudi Arabia' },
];

const PhoneScreen = ({ navigation }) => {
  const { sendOTP } = useAuth();

  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [focused, setFocused] = useState(false);

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

      {/* Premium Dark Teal Background */}
      <LinearGradient
        colors={['#0A3B40', '#03080A', '#000000']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your journey with <Text style={styles.brand}>WAHID</Text></Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Enter Mobile Number</Text>
            
            <View style={[styles.inputContainer, focused && styles.inputFocused]}>
              <TouchableOpacity style={styles.countrySelector} onPress={() => setShowPicker(!showPicker)}>
                <Text style={styles.countryCodeText}>{country.code}</Text>
                <Ionicons name="chevron-down" size={14} color="#aaa" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <TextInput
                ref={phoneInput}
                style={styles.input}
                placeholder="Enter a phone number"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="phone-pad"
                maxLength={15}
                selectionColor="#00ADC1"
              />
            </View>

            {showPicker && (
               <View style={styles.miniPicker}>
                 {COUNTRIES.map(c => (
                   <TouchableOpacity key={c.code} style={styles.miniPickerItem} onPress={() => { setCountry(c); setShowPicker(false); }}>
                     <Text style={{color: '#fff', fontSize: 13}}>{c.code}  <Text style={{color: '#888'}}>{c.name}</Text></Text>
                   </TouchableOpacity>
                 ))}
               </View>
            )}
          </View>

          <View style={styles.footerWrap}>
            <View style={styles.loginPrompt}>
              <Text style={styles.promptText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00ADC1', '#00DFE0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get OTP</Text>}
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
  kav: { flex: 1 },
  scroll: { 
    flexGrow: 1, 
    paddingHorizontal: 24,
    paddingTop: height * 0.15,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#8A9A9D',
    textAlign: 'center',
  },
  brand: {
    color: '#00ADC1',
    fontFamily: FONTS.bold,
  },
  formSection: {
    marginBottom: 40,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1214',
    borderWidth: 1,
    borderColor: '#00ADC150',
    borderRadius: 24,
    height: 56,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#00ADC1',
    backgroundColor: '#0A1C20',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 10,
  },
  countryCodeText: {
    color: '#fff',
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#333',
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: FONTS.regular,
    fontSize: 15,
    height: '100%',
  },
  miniPicker: {
    backgroundColor: '#1A2123',
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  miniPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  footerWrap: {
    marginTop: 'auto',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  promptText: {
    color: '#8A9A9D',
    fontSize: 13,
  },
  loginText: {
    color: '#00ADC1',
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  button: {
    height: 56,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00ADC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontFamily: FONTS.bold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default PhoneScreen;
