/**
 * RegisterProfileScreen — Step 3 of NEW User Registration
 * 
 * Collects name, email, gender, and date of birth.
 * Calls PUT /api/me → updates user profile → Home.
 * 
 * Design updated to use ArchedHeader (curved design).
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Animated, StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import ArchedHeader from '../components/ArchedHeader';

const GENDERS = ['Male', 'Female', 'Other'];

const RegisterProfileScreen = ({ navigation }) => {
  const { updateProfile, logout } = useAuth();
  const { colors, isDark } = useAppTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [date, setDate] = useState(new Date(1995, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !gender || !dob) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill all fields.' });
      return;
    }
    
    setLoading(true);
    const result = await updateProfile({ name, email, gender, dob });
    setLoading(false);

    if (result.success) {
      Toast.show({ type: 'success', text1: 'Profile Created!', text2: 'Welcome to WAHID.' });
      // The user object is updated in AuthContext, which should trigger AppNavigator redirect
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: result.message });
      // If user is not found (e.g. DB reset), log out to clear stale session
      if (result.message?.includes('not found') || result.message?.includes('Unauthorized')) {
        setTimeout(() => logout(), 2000);
      }
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(currentDate);
      setDob(currentDate.toISOString().split('T')[0]);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ArchedHeader 
        title="Sign Up !" 
        subtitle="Tell us more about yourself" 
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <View style={[styles.card, { backgroundColor: isDark ? colors.surface : '#fff' }, SHADOW.card]}>
            
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
                placeholder="Amina Khan"
                placeholderTextColor={colors.textDimmed}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
                placeholder="amina@example.com"
                placeholderTextColor={colors.textDimmed}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity 
                    key={g} 
                    style={[
                      styles.genderBtn, 
                      { borderColor: colors.border },
                      gender === g && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderText, { color: gender === g ? '#fff' : colors.text }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date of Birth Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Date of Birth</Text>
              <TouchableOpacity
                style={[styles.input, { borderBottomColor: colors.border, justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: dob ? colors.text : colors.textDimmed, fontFamily: FONTS.regular, fontSize: 16 }}>
                  {dob || 'Select Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

          </View>

          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.9}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={logout} 
            style={styles.backBtn}
          >
            <Text style={[styles.backText, { color: colors.textMuted }]}>Change Phone Number</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav:  { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACE.xl, paddingTop: 200 },
  
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACE.xl,
    paddingVertical: 24,
    marginBottom: SPACE.xxl,
  },
  inputGroup: {
    marginBottom: SPACE.xl,
  },
  label: {
     fontFamily: FONTS.bold,
     fontSize: 12,
     marginBottom: 6,
     textTransform: 'uppercase',
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  genderBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
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
    color: '#fff',
    letterSpacing: 1,
  },
  backBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: SPACE.xl,
  },
  backText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default RegisterProfileScreen;
