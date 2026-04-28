import React, { useState, useRef } from 'react';
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
  StatusBar,
  Dimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../theme';
import { useAuth } from '../context/AuthContext';

const { height } = Dimensions.get('window');

const RegisterScreen = ({ navigation, route }) => {
  const { verificationToken, phone } = route.params || {};

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocused] = useState(null);
  
  const { signup } = useAuth();
  
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your exploration of the 99 Divine Names</Text>
          </View>

          <View style={styles.formSection}>
            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputContainer, focusedField === 'name' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                selectionColor="#00ADC1"
                autoCapitalize="words"
              />
            </View>

            {/* Username */}
            <Text style={[styles.label, { marginTop: 24 }]}>Choose Username</Text>
            <View style={[styles.inputContainer, focusedField === 'username' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="your_unique_username"
                placeholderTextColor="#666"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused(null)}
                selectionColor="#00ADC1"
              />
            </View>

            {/* Password */}
            <Text style={[styles.label, { marginTop: 24 }]}>Password</Text>
            <View style={[styles.inputContainer, focusedField === 'password' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                selectionColor="#00ADC1"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerWrap}>
            <TouchableOpacity 
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00ADC1', '#00DFE0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginFooter}>
              <Text style={styles.loginFooterText}>Already part of WAHID?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginFooterLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#8A9A9D',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 40,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1214',
    borderWidth: 1,
    borderColor: '#00ADC150',
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#00ADC1',
    backgroundColor: '#0A1C20',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: FONTS.regular,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  footerWrap: {
    marginTop: 'auto',
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
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginFooterText: {
    color: '#8A9A9D',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  loginFooterLink: {
    color: '#00ADC1',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});

export default RegisterScreen;
