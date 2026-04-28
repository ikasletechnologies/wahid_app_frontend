import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated, StatusBar, Pressable,
  Dimensions, Picker
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { FONTS, SIZES, RADIUS } from '../theme';

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

const LoginScreen = ({ navigation, route }) => {
  const { identifier: initialIdentifier } = route.params || {};

  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [identifier, setIdentifier] = useState(initialIdentifier || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [focusedField, setFocused] = useState(null);
  const { login } = useAuth();
  
  const identifierInput = useRef(null);
  const passwordInput = useRef(null);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Toast.show({ type: 'error', text1: 'Incomplete Fields', text2: 'Please enter your phone and password.' });
      return;
    }
    
    setLoading(true);
    // Combine country code and phone number
    const digits = identifier.replace(/\D/g, '');
    const fullPhone = digits.length >= 7 ? `${country.code}${digits}` : identifier.trim();
    
    // In actual auth, we might just pass identifier if username, or compiled fullPhone if phone
    const result = await login(fullPhone, password);
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

      {/* Premium Dark Teal Background */}
      <LinearGradient
        colors={['#0A3B40', '#03080A', '#000000']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Sign In Your Account</Text>
            <Text style={styles.subtitle}>Sign In and improve your knowledge today</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputContainer, focusedField === 'phone' && styles.inputFocused]}>
               <TouchableOpacity style={styles.countrySelector} onPress={() => setShowCountryPicker(!showCountryPicker)}>
                 <Text style={styles.countryCodeText}>{country.code}</Text>
                 <Ionicons name="chevron-down" size={14} color="#aaa" style={{ marginLeft: 4 }} />
               </TouchableOpacity>
               
               <View style={styles.divider} />
               
               <TextInput
                 ref={identifierInput}
                 style={styles.input}
                 placeholder="Enter a phone number"
                 placeholderTextColor="#666"
                 value={identifier}
                 onChangeText={setIdentifier}
                 onFocus={() => setFocused('phone')}
                 onBlur={() => setFocused(null)}
                 keyboardType="phone-pad"
                 selectionColor="#00ADC1"
               />
            </View>

            {/* In-line Country Picker Dropdown (Simplified) */}
            {showCountryPicker && (
               <View style={styles.miniPicker}>
                 {COUNTRIES.map(c => (
                   <TouchableOpacity key={c.code} style={styles.miniPickerItem} onPress={() => { setCountry(c); setShowCountryPicker(false); }}>
                     <Text style={{color: '#fff', fontSize: 13}}>{c.code}  <Text style={{color: '#888'}}>{c.name}</Text></Text>
                   </TouchableOpacity>
                 ))}
               </View>
            )}

            <Text style={[styles.label, { marginTop: 24 }]}>Password</Text>
            <View style={[styles.inputContainer, focusedField === 'password' && styles.inputFocused]}>
               <TextInput
                 ref={passwordInput}
                 style={styles.input}
                 placeholder="Enter your password"
                 placeholderTextColor="#666"
                 value={password}
                 onChangeText={setPassword}
                 onFocus={() => setFocused('password')}
                 onBlur={() => setFocused(null)}
                 secureTextEntry={!showPassword}
                 selectionColor="#00ADC1"
               />
               <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                 <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#fff" />
               </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerWrap}>
            <View style={styles.signupPrompt}>
              <Text style={styles.promptText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Phone')}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00ADC1', '#00DFE0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
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
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  promptText: {
    color: '#8A9A9D',
    fontSize: 13,
  },
  signupText: {
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

export default LoginScreen;
