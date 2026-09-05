import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Modal, ActivityIndicator, Platform } from 'react-native';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import TimeBasedBackground from '../components/TimeBasedBackground';

// Letters (incl. accented/Unicode) and spaces only — no digits, symbols, or punctuation.
const NAME_REGEX = /^[\p{L} ]+$/u;
const GENDERS = ['Male', 'Female', 'Other'];

const PersonalDetailsScreen = () => {
  const { user, updateProfile } = useAuth();
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [dob, setDob] = useState(user?.dob ? new Date(user.dob) : null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const formattedDob = dob ? dob.toLocaleDateString('en-GB') : null;

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please enter your name.' });
      return;
    }
    if (!NAME_REGEX.test(name.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid Name', text2: 'Name can only contain letters and spaces.' });
      return;
    }

    setSaving(true);
    const result = await updateProfile({
      name: name.trim(),
      email: email.trim() || null,
      gender: gender || null,
      dob: dob ? dob.toISOString() : null,
    });
    setSaving(false);

    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: result.message || 'Could not save your details.' });
      return;
    }
    Toast.show({ type: 'success', text1: 'Saved', text2: 'Your personal details have been updated.' });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]} edges={['top']}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Personal Details</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Name"
                  placeholderTextColor={colors.textDimmed}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? colors.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={colors.textDimmed}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.inputContainer, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? colors.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.input, { color: formattedDob ? colors.text : colors.textDimmed }]}>
                  {formattedDob || 'Date of Birth'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inputContainer, styles.rowContainer, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? colors.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}
                onPress={() => setShowGenderModal(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.input, { color: gender ? colors.text : colors.textDimmed }]}>
                  {gender || 'Gender'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textDimmed} />
              </TouchableOpacity>

              <View style={[styles.inputContainer, styles.rowContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9', shadowOpacity: 0 }]}>
                <Text style={[styles.input, { color: colors.textDimmed }]}>
                  {user?.phone || 'No phone on file'}
                </Text>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textDimmed} />
              </View>

              {/* Password section removed */}
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#06b6d4' }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.saveBtnText, { color: isDark ? colors.background : '#FFFFFF' }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dob || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) setDob(selected);
                }}
              />
            )}

            <Modal visible={showGenderModal} transparent animationType="fade">
              <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowGenderModal(false)} activeOpacity={1}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#161616' : '#FFFFFF' }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Select Gender</Text>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.modalOption, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}
                      onPress={() => { setGender(g); setShowGenderModal(false); }}
                    >
                      <Text style={[styles.modalOptionText, { color: colors.text }, gender === g && styles.modalOptionTextActive]}>{g}</Text>
                      {gender === g && <Ionicons name="checkmark" size={20} color="#06b6d4" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </>
        )}
      </TimeBasedBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
    gap: 14,
    marginTop: 10,
  },
  inputContainer: {
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    fontSize: 13,
    fontWeight: '500',
  },
  passwordContainerWrapper: {
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2,
  },
  eyeIcon: {
    padding: 4,
  },
  changePasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  changePasswordText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  saveBtn: {
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: '#06b6d4',
    fontWeight: '700',
  },
});

export default PersonalDetailsScreen;
