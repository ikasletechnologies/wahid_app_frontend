import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import TimeBasedBackground from '../components/TimeBasedBackground';

const PersonalDetailsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();
  
  const [name, setName] = useState(user?.name || 'Wahid');
  const [email, setEmail] = useState(user?.email || 'Wahid123@gmail.com');
  const [password, setPassword] = useState('password123'); // Just for UI
  const [showPassword, setShowPassword] = useState(false);

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

          {/* Password section removed */}
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#06b6d4' }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.saveBtnText, { color: isDark ? colors.background : '#FFFFFF' }]}>Save Changes</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 10,
  },
  inputContainer: {
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalDetailsScreen;
