import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';

const { height } = Dimensions.get('window');

const GENDERS = ['Male', 'Female', 'Other'];

// username check statuses
const US = { IDLE: 'idle', CHECKING: 'checking', AVAILABLE: 'available', TAKEN: 'taken' };

const RegisterScreen = ({ navigation, route }) => {
  const { verificationToken } = route.params || {};
  const { signup } = useAuth();

  const [name, setName]               = useState('');
  const [username, setUsername]       = useState('');
  const [usernameStatus, setUsernameStatus] = useState(US.IDLE);
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender]           = useState('Male');
  const [dob, setDob]                 = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [focused, setFocused]         = useState(null);

  const debounceTimer = useRef(null);

  const formattedDob = dob
    ? dob.toLocaleDateString('en-GB')
    : null;

  // Debounced username availability check
  useEffect(() => {
    const trimmed = username.trim();

    clearTimeout(debounceTimer.current);

    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus(US.IDLE);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setUsernameStatus(US.CHECKING);
      try {
        const res = await http.get(ENDPOINTS.checkUsername, {
          params: { username: trimmed },
          validateStatus: (s) => s < 500,
        });
        if (res.status === 404) {
          setUsernameStatus(US.AVAILABLE);
          return;
        }
        if (res.status !== 200) {
          setUsernameStatus(US.IDLE);
          return;
        }
        setUsernameStatus(res.data?.available ? US.AVAILABLE : US.TAKEN);
      } catch {
        setUsernameStatus(US.IDLE);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [username]);

  const handleRegister = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please enter your full name.' });
      return;
    }
    if (!username.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please enter a username.' });
      return;
    }
    if (usernameStatus === US.TAKEN) {
      Toast.show({ type: 'error', text1: 'Username Taken', text2: 'Please choose a different username.' });
      return;
    }
    if (!password || password.length < 6) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password must be at least 6 characters.' });
      return;
    }
    if (!verificationToken) {
      Toast.show({ type: 'error', text1: 'Session Expired', text2: 'Please verify your phone number again.' });
      navigation.navigate('Phone');
      return;
    }

    setLoading(true);
    const result = await signup(
      verificationToken,
      username.trim(),
      password,
      name.trim(),
      gender,
      formattedDob,
    );
    setLoading(false);

    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Registration Error', text2: result.message || 'Something went wrong.' });
    } else {
      navigation.replace('Success', {
        user:         result.user,
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
      });
    }
  };

  const renderUsernameIcon = () => {
    if (usernameStatus === US.CHECKING) {
      return <ActivityIndicator size="small" color="#03B7CE" style={styles.statusIcon} />;
    }
    if (usernameStatus === US.AVAILABLE) {
      return <Ionicons name="checkmark-circle" size={24} color="#22C55E" style={styles.statusIcon} />;
    }
    if (usernameStatus === US.TAKEN) {
      return <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.statusIcon} />;
    }
    return null;
  };

  const usernameBorderColor = () => {
    if (focused === 'username')          return '#03B7CE';
    if (usernameStatus === US.AVAILABLE) return '#22C55E';
    if (usernameStatus === US.TAKEN)     return '#EF4444';
    return 'rgba(3,183,206,0.3)';
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
            <Text style={styles.title}>Personal Information</Text>
            <Text style={styles.subtitle}>Tell us more about yourself</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputRow, focused === 'name' && styles.inputRowFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#4A5568"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                autoCapitalize="words"
                selectionColor="#03B7CE"
              />
            </View>

            {/* Username */}
            <Text style={[styles.label, { marginTop: 20 }]}>Username</Text>
            <View style={[
              styles.inputRow,
              { borderColor: usernameBorderColor() },
              focused === 'username' && styles.inputRowFocused,
            ]}>
              <TextInput
                style={styles.input}
                placeholder="your_unique_username"
                placeholderTextColor="#4A5568"
                value={username}
                onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor="#03B7CE"
              />
              {renderUsernameIcon()}
            </View>
            {usernameStatus === US.AVAILABLE && (
              <Text style={styles.hintAvailable}>Username is available</Text>
            )}
            {usernameStatus === US.TAKEN && (
              <Text style={styles.hintTaken}>Username is already taken</Text>
            )}

            {/* Password */}
            <Text style={[styles.label, { marginTop: 20 }]}>Password</Text>
            <View style={[styles.inputRow, focused === 'password' && styles.inputRowFocused]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#4A5568"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry={!showPassword}
                selectionColor="#03B7CE"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#7A8FA6" />
              </TouchableOpacity>
            </View>

            {/* Gender */}
            <Text style={[styles.label, { marginTop: 20 }]}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.75}
                >
                  {gender === g ? (
                    <LinearGradient
                      colors={['#02889D', '#03B7CE', '#4BD5E8']}
                      locations={[0, 0.5048, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.genderBtnGradient}
                    >
                      <Text style={styles.genderTextActive}>{g}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.genderText}>{g}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Date of Birth */}
            <Text style={[styles.label, { marginTop: 20 }]}>Date of Birth</Text>
            <TouchableOpacity
              style={[styles.inputRow, focused === 'dob' && styles.inputRowFocused]}
              onPress={() => { setFocused('dob'); setShowDatePicker(true); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.dobText, !formattedDob && styles.dobPlaceholder]}>
                {formattedDob || 'DD/MM/YYYY'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#7A8FA6" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dob || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  setFocused(null);
                  if (selected) setDob(selected);
                }}
              />
            )}
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={['#02889D', '#03B7CE', '#4BD5E8']}
                locations={[0, 0.5048, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.button}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Submit</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.signinLink}>Sign In</Text>
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
  kav:  { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    paddingBottom: 36,
  },

  header: {
    alignItems: 'center',
    marginBottom: 36,
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
    marginBottom: 28,
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
    paddingHorizontal: 18,
  },
  inputRowFocused: {
    backgroundColor: '#091A1E',
  },
  inputRowGlow: {
    shadowColor: '#03B7CE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  inputRowGlowGreen: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  inputRowGlowRed: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  statusIcon: {
    marginLeft: 8,
  },
  hintAvailable: {
    color: '#22C55E',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 14,
  },
  hintTaken: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 14,
  },

  // DOB text — separate from input so height:'100%' doesn't misalign it
  dobText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    textAlignVertical: 'center',
  },
  dobPlaceholder: {
    color: '#4A5568',
  },

  /* Gender */
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(3,183,206,0.35)',
    backgroundColor: '#0D1517',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  genderBtnActive: {
    borderColor: '#03B7CE',
  },
  genderBtnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  genderText: {
    color: '#8A9A9D',
    fontSize: 14,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Footer */
  footer: {
    marginTop: 'auto',
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
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signinText: {
    color: '#8A9A9D',
    fontSize: 13,
  },
  signinLink: {
    color: '#03B7CE',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default RegisterScreen;
