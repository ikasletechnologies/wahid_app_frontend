import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar, Dimensions, Image, Modal } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';

const { width, height } = Dimensions.get('window');

const GENDERS = ['Male', 'Female', 'Other'];
const US = { IDLE: 'idle', CHECKING: 'checking', AVAILABLE: 'available', TAKEN: 'taken' };

const RegisterScreen = ({ navigation, route }) => {
  const { verificationToken } = route.params || {};
  const { signup } = useAuth();
  const { isDark, colors } = useAppTheme();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(US.IDLE);

  const [dob, setDob] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [gender, setGender] = useState('');
  const [showGenderModal, setShowGenderModal] = useState(false);

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [tosAgreed, setTosAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const debounceTimer = useRef(null);

  const formattedDob = dob ? dob.toLocaleDateString('en-GB') : null;

  // Password Strength Logic
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let strengthScore = 0;
  if (password.length > 0) strengthScore += 1;
  if (hasMinLength) strengthScore += 1;
  if (hasNumber && hasSymbol) strengthScore += 1;
  if (hasMinLength && hasNumber && hasSymbol && password.length > 10) strengthScore += 1; // 4th bar

  let strengthText = '';
  let strengthColor = '#E2E8F0';
  if (strengthScore === 1) { strengthText = 'Weak'; strengthColor = '#EF4444'; }
  else if (strengthScore === 2) { strengthText = 'Fair'; strengthColor = '#F59E0B'; }
  else if (strengthScore >= 3) { strengthText = 'Good'; strengthColor = '#22C55E'; }

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
    if (!password || password.length < 8) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Password Mismatch', text2: 'Passwords do not match.' });
      return;
    }
    if (!tosAgreed) {
      Toast.show({ type: 'error', text1: 'Terms Required', text2: 'You must agree to the Terms of Service.' });
      return;
    }
    if (!verificationToken) {
      Toast.show({ type: 'error', text1: 'Session Expired', text2: 'Please verify your phone number again.' });
      navigation.navigate('Phone');
      return;
    }

    setLoading(true);
    // Note: email is not currently tracked in signup context, but we collect it in UI
    const result = await signup(
      verificationToken,
      username.trim(),
      password,
      name.trim(),
      gender || 'Other',
      formattedDob,
    );
    setLoading(false);

    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Registration Error', text2: result.message || 'Something went wrong.' });
    } else {
      navigation.replace('Success', {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    }
  };

  const renderUsernameStatus = () => {
    if (usernameStatus === US.CHECKING) {
      return <ActivityIndicator size="small" color="#03B7CE" style={styles.statusIcon} />;
    }
    if (usernameStatus === US.AVAILABLE) {
      return (
        <View style={styles.usernameAvailableBox}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#22C55E" />
          <Text style={styles.usernameAvailableText}>Available</Text>
        </View>
      );
    }
    if (usernameStatus === US.TAKEN) {
      return <Ionicons name="close-circle-outline" size={20} color="#EF4444" style={styles.statusIcon} />;
    }
    return null;
  };

  return (
    <LinearGradient
      colors={isDark ? ['#041012', '#080E10', '#050505'] : ['#EBF8FA', '#F4FDFE', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.kav}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Decorative Image inside scroll */}
          <Image
            source={require('../../assets/createaccount.png')}
            style={styles.headerImage}
            resizeMode="contain"
          />

          {/* Header Row inside scroll */}
          <TouchableOpacity
            style={[
              styles.backButton,
              { alignSelf: 'flex-start', marginBottom: 12 },
              isDark && { backgroundColor: '#111111', shadowColor: '#000', shadowOpacity: 0.1 }
            ]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#FFFFFF' : '#0F203C'} />
          </TouchableOpacity>

          {/* Title Area */}
          <View style={[styles.titleArea, { marginTop: 90 }]}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Complete your profile to start{'\n'}your learning journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Full Name */}
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#0F203C' }]}>Full Name</Text>
            <View style={[
              styles.inputRow,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              },
              focused === 'name' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#161616' } : styles.inputRowFocused)
            ]}>
              <Ionicons name="person-outline" size={20} color="#03B7CE" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F203C' }]}
                placeholder="Enter your full name"
                placeholderTextColor={isDark ? '#64748B' : '#A0AEC0'}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                autoCapitalize="words"
                selectionColor="#03B7CE"
              />
            </View>

            {/* Username */}
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#0F203C' }]}>Username</Text>
            <View style={[
              styles.inputRow,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              },
              focused === 'username' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#161616' } : styles.inputRowFocused),
              usernameStatus === US.TAKEN && styles.inputRowError
            ]}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F203C' }]}
                placeholder="Enter username"
                placeholderTextColor={isDark ? '#64748B' : '#A0AEC0'}
                value={username}
                onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor="#03B7CE"
              />
              {renderUsernameStatus()}
            </View>

            {/* DOB & Gender Side-by-Side */}
            <View style={styles.halfRowContainer}>
              {/* DOB */}
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#0F203C' }]}>Date of Birth</Text>
                <TouchableOpacity
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: isDark ? '#111111' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
                    },
                    focused === 'dob' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#161616' } : styles.inputRowFocused)
                  ]}
                  onPress={() => { setFocused('dob'); setShowDatePicker(true); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={20} color="#03B7CE" style={styles.inputIcon} />
                  <Text style={[styles.dobText, { color: formattedDob ? (isDark ? '#FFFFFF' : '#0F203C') : (isDark ? '#64748B' : '#A0AEC0') }]}>
                    {formattedDob || 'DD / MM / YYYY'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Gender */}
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#0F203C' }]}>Gender</Text>
                <TouchableOpacity
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: isDark ? '#111111' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
                    },
                    focused === 'gender' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#161616' } : styles.inputRowFocused)
                  ]}
                  onPress={() => { setFocused('gender'); setShowGenderModal(true); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="people-outline" size={20} color="#03B7CE" style={styles.inputIcon} />
                  <Text style={[styles.dobText, { color: gender ? (isDark ? '#FFFFFF' : '#0F203C') : (isDark ? '#64748B' : '#A0AEC0') }]} numberOfLines={1}>
                    {gender || 'Select gender'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={isDark ? '#64748B' : '#A0AEC0'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Email */}
            <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#0F203C' }]}>Email <Text style={styles.optionalText}>(Optional)</Text></Text>
            <View style={[
              styles.inputRow,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              },
              focused === 'email' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#161616' } : styles.inputRowFocused)
            ]}>
              <Ionicons name="mail-outline" size={20} color="#03B7CE" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F203C' }]}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? '#64748B' : '#A0AEC0'}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
                keyboardType="email-address"
                selectionColor="#03B7CE"
              />
            </View>

            {/* Password */}
            <View style={[
              styles.pwdInputContainer,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              },
              focused === 'password' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#151515' } : styles.pwdInputFocused)
            ]}>
              <View style={[styles.pwdIconBox, isDark && { backgroundColor: 'rgba(3, 183, 206, 0.15)' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#03B7CE" />
              </View>
              <View style={styles.pwdInputContentWrapper}>
                <Text style={[styles.pwdInputLabel, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>Password</Text>
                <View style={styles.pwdInputContent}>
                  <TextInput
                    style={[styles.pwdInput, { color: isDark ? '#FFFFFF' : '#1A202C' }]}
                    placeholder="Create a password"
                    placeholderTextColor={isDark ? '#64748B' : '#A0AEC0'}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    selectionColor="#03B7CE"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={isDark ? '#64748B' : '#A0AEC0'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={[
              styles.pwdInputContainer,
              {
                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
              },
              focused === 'confirm' && (isDark ? { borderColor: '#03B7CE', backgroundColor: '#151515' } : styles.pwdInputFocused)
            ]}>
              <View style={[styles.pwdIconBox, isDark && { backgroundColor: 'rgba(3, 183, 206, 0.15)' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#03B7CE" />
              </View>
              <View style={styles.pwdInputContentWrapper}>
                <Text style={[styles.pwdInputLabel, { color: isDark ? '#E2E8F0' : '#1A202C' }]}>Confirm Password</Text>
                <View style={styles.pwdInputContent}>
                  <TextInput
                    style={[styles.pwdInput, { color: isDark ? '#FFFFFF' : '#1A202C' }]}
                    placeholder="Confirm your password"
                    placeholderTextColor={isDark ? '#64748B' : '#A0AEC0'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocused('confirm')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    selectionColor="#03B7CE"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={isDark ? '#64748B' : '#A0AEC0'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Password Strength Section */}
            <View style={styles.strengthHeader}>
              <Text style={[styles.strengthTitle, isDark && { color: '#94A3B8' }]}>Password Strength</Text>
              <Text style={[styles.strengthLevel, { color: strengthColor }]}>{strengthText}</Text>
            </View>
            <View style={styles.strengthBars}>
              {[1, 2, 3, 4].map(barIndex => (
                <View
                  key={barIndex}
                  style={[
                    styles.strengthBar,
                    isDark && { backgroundColor: 'rgba(255,255,255,0.08)' },
                    strengthScore >= barIndex && { backgroundColor: strengthColor }
                  ]}
                />
              ))}
            </View>
            <View style={styles.strengthChecksRow}>
              <View style={styles.strengthCheckItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color={hasMinLength ? "#22C55E" : (isDark ? "#64748B" : "#A0AEC0")} />
                <Text style={[styles.strengthCheckText, isDark && { color: '#A0AEC0' }]}>At least 8 characters</Text>
              </View>
              <View style={styles.strengthCheckItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color={hasNumber ? "#22C55E" : (isDark ? "#64748B" : "#A0AEC0")} />
                <Text style={[styles.strengthCheckText, isDark && { color: '#A0AEC0' }]}>At least 1 number</Text>
              </View>
              <View style={styles.strengthCheckItem}>
                <Ionicons name="checkmark-circle-outline" size={16} color={hasSymbol ? "#22C55E" : (isDark ? "#64748B" : "#A0AEC0")} />
                <Text style={[styles.strengthCheckText, isDark && { color: '#A0AEC0' }]}>At least one $ symbol</Text>
              </View>
            </View>

            {/* TOS Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setTosAgreed(!tosAgreed)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.checkbox,
                isDark && { backgroundColor: '#111111', borderColor: 'rgba(255, 255, 255, 0.2)' },
                tosAgreed && styles.checkboxChecked
              ]}>
                {tosAgreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxText, isDark && { color: '#A0AEC0' }]}>
                I agree to the <Text style={styles.checkboxLink}>Terms of Service</Text> and <Text style={styles.checkboxLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, isDark && { color: '#94A3B8' }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker (OS Native) */}
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

      {/* Gender Picker Modal */}
      <Modal visible={showGenderModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => { setShowGenderModal(false); setFocused(null); }} activeOpacity={1}>
          <View style={[styles.modalContent, isDark && { backgroundColor: '#161616' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>Select Gender</Text>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.modalOption, isDark && { borderBottomColor: 'rgba(255,255,255,0.08)' }]}
                onPress={() => {
                  setGender(g);
                  setShowGenderModal(false);
                  setFocused(null);
                }}
              >
                <Text style={[styles.modalOptionText, isDark && { color: '#E2E8F0' }, gender === g && styles.modalOptionTextActive]}>{g}</Text>
                {gender === g && <Ionicons name="checkmark" size={20} color="#03B7CE" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav: { flex: 1 },
  headerImage: {
    position: 'absolute',
    top: -15,
    right: -50,
    width: 350,
    height: 350,
    zIndex: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 37,
    paddingTop: height * 0.05,
    paddingBottom: 15,
  },
  fixedTopNav: {
    position: 'absolute',
    top: height * 0.06,
    left: 29,
    zIndex: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  titleArea: {
    marginBottom: 40,
    zIndex: 10,
    width: '65%', // restrict width to avoid overlapping graphic if needed
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F203C',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
    zIndex: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F203C',
    marginBottom: 4,
    marginTop: 12,
  },
  optionalText: {
    color: '#A0AEC0',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 16,
  },
  inputRowFocused: {
    borderColor: '#03B7CE',
    backgroundColor: '#FAFDFF',
  },
  inputRowError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  atSymbol: {
    fontSize: 18,
    color: '#03B7CE',
    fontWeight: '600',
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#0F203C',
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  pwdInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  pwdInputFocused: {
    borderColor: '#03B7CE',
    backgroundColor: '#FAFDFF',
  },
  pwdIconBox: {
    width: 36,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#E6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  pwdInputContentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  pwdInputLabel: {
    fontSize: 13,
    color: '#1A202C',
    fontWeight: '700',
    marginBottom: 4,
  },
  pwdInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pwdInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A202C',
    padding: 0,
    margin: 0,
    fontWeight: '600',
  },
  usernameAvailableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usernameAvailableText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  statusIcon: {
    marginLeft: 8,
  },
  halfRowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  dobText: {
    flex: 1,
    color: '#0F203C',
    fontSize: 13,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#A0AEC0',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  strengthTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  strengthLevel: {
    fontSize: 12,
    fontWeight: '700',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  strengthChecksRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  strengthCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthCheckText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
    gap: 12,
    paddingRight: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#03B7CE',
    borderColor: '#03B7CE',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: '#718096',
    lineHeight: 20,
  },
  checkboxLink: {
    color: '#03B7CE',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#01A7C2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#718096',
    fontSize: 13,
  },
  footerLink: {
    color: '#01A7C2',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F203C',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: '#03B7CE',
    fontWeight: '700',
  },
});

export default RegisterScreen;
