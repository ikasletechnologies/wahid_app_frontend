import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, Modal, ScrollView, Dimensions } from 'react-native';
import Text from '../components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme, THEME_MODES } from '../context/ThemeContext';
import TimeBasedBackground from '../components/TimeBasedBackground';
import { useAuth } from '../context/AuthContext';
import { useFontSettings, FONT_FAMILIES, FONT_SIZES, ARABIC_STYLES } from '../context/FontSettingsContext';
import CircleIcon from '@hugeicons/core-free-icons/dist/esm/CircleIcon.js';
import Logout01Icon from '@hugeicons/core-free-icons/dist/esm/Logout01Icon.js';
import { HugeiconsIcon } from '@hugeicons/react-native';
import ReadingSettingsModal from '../components/ReadingSettingsModal';

const { width } = Dimensions.get('window');

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isDark, themeMode, setThemeMode, colors } = useAppTheme();
  const { logout } = useAuth();
  const { fontFamily, setFontFamily, fontSize, setFontSize, arabicFontStyle, setArabicFontStyle } = useFontSettings();
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);
  const [readingSettingsVisible, setReadingSettingsVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent', paddingBottom: insets.bottom }]} edges={['top', 'left', 'right']}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsList}>
              {/* Reading Display & Text Settings */}
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}
                onPress={() => setReadingSettingsVisible(true)}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
                    <Ionicons name="color-palette-outline" size={14} color="#06b6d4" />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Reading & Display Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
              </TouchableOpacity>

              {/* About App */}
              <View style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
                    <Ionicons name="information-circle-outline" size={14} color="#06b6d4" />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>About Wahid</Text>
                </View>
                <View style={{ marginLeft: 'auto' }}>
                  <MaskedView maskElement={<Text style={styles.versionText}>v1.0.0</Text>}>
                    <LinearGradient colors={['#06b6d4', '#22d3ee']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={[styles.versionText, { opacity: 0 }]}>v1.0.0</Text>
                    </LinearGradient>
                  </MaskedView>
                </View>
              </View>

              {/* Privacy Policy */}
              <TouchableOpacity 
                style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}
                onPress={() => setPrivacyVisible(true)}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#06b6d4" />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity 
                style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}
                onPress={() => setIsLogoutVisible(true)}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
                    <HugeiconsIcon icon={Logout01Icon} size={14} color="#FF5252" />
                  </View>
                  <Text style={[styles.settingLabel, { color: '#FF5252' }]}>Logout</Text>
                </View>
              </TouchableOpacity>
            </View>

            <ReadingSettingsModal
              visible={readingSettingsVisible}
              onClose={() => setReadingSettingsVisible(false)}
            />

            {/* Privacy Policy Modal */}
            <Modal visible={privacyVisible} animationType="slide" transparent={true}>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                  <View style={[styles.modalHandle, { backgroundColor: isDark ? '#334155' : '#E0E0E0' }]} />
                  <View style={styles.modalHeaderRow}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy Policy</Text>
                    <TouchableOpacity onPress={() => setPrivacyVisible(false)}>
                      <Ionicons name="close-circle" size={24} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.privacyScroll} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      Welcome to the Wahid App. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information while using our application and services.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>1. Introduction</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      The Wahid App is designed for users in India and Dubai only. We are committed to protecting user privacy and ensuring secure usage of our platform.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>2. Information We Collect</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      We collect only limited information necessary for the proper functioning of the app, including:{"\n"}
                      • Basic account information (such as name, phone number, or email){"\n"}
                      • Device information for security and performance{"\n"}
                      • App usage data for improving user experience{"\n"}
                      We do not collect sensitive personal information unless required for a specific feature.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>3. No Third-Party Data Sharing</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      • User data is not sold, rented, or shared with third-party companies.{"\n"}
                      • We do not allow unauthorized third-party websites or services to access user information.{"\n"}
                      • The app does not transfer user data to external platforms without user consent.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>4. Data Transfer Restrictions</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      • User data remains protected and is not transferred internationally unless legally required.{"\n"}
                      • We aim to store and process data securely within approved service environments.{"\n"}
                      • No unnecessary cross-border data transfers are performed.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>5. Usage Limited to India and Dubai</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      This application is intended only for users located in:{"\n"}
                      • India{"\n"}
                      • Dubai{"\n"}
                      Services outside these regions may be limited or unavailable.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>6. Data Security</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      We implement reasonable security measures to protect user information, including:{"\n"}
                      • Encrypted connections{"\n"}
                      • Secure servers{"\n"}
                      • Restricted access controls{"\n"}
                      • Regular security monitoring{"\n"}
                      However, no online platform can guarantee 100% security.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>7. User Rights</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      Users may request to:{"\n"}
                      • Access their data{"\n"}
                      • Correct inaccurate information{"\n"}
                      • Delete their account and related data{"\n"}
                      • Withdraw consent for optional services
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>8. Cookies and Tracking</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      The app may use limited cookies or device identifiers only for:{"\n"}
                      • Login sessions{"\n"}
                      • Performance improvements{"\n"}
                      • Security purposes{"\n"}
                      We do not use invasive tracking technologies.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>9. Policy Updates</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      We may update this Privacy Policy from time to time. Changes will be posted within the application or website.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text }]}>10. Contact Us</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted }]}>
                      If you have questions regarding this Privacy Policy, you may contact the Wahid support team through the official application or website.
                    </Text>

                    <Text style={[styles.privacySectionTitle, { color: colors.text, marginTop: 10 }]}>Additional Recommended Privacy Points:</Text>
                    <Text style={[styles.privacyParagraph, { color: colors.textMuted, marginBottom: 40 }]}>
                      • No user location tracking without permission{"\n"}
                      • No camera or microphone access without consent{"\n"}
                      • OTP and authentication details are encrypted{"\n"}
                      • Users can request permanent account deletion{"\n"}
                      • App complies with applicable privacy laws in India and UAE{"\n"}
                      • Minimal data collection principle followed{"\n"}
                      • No advertising-based data profiling
                    </Text>
                  </ScrollView>
                </View>
              </View>
            </Modal>
            {/* Logout Modal */}
            <Modal
              transparent={true}
              visible={isLogoutVisible}
              animationType="fade"
              onRequestClose={() => setIsLogoutVisible(false)}
            >
              <View style={styles.logoutOverlay}>
                <View style={[styles.logoutModalContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                  <View style={styles.logoutIconWrapper}>
                    <View style={StyleSheet.absoluteFill}>
                      <HugeiconsIcon icon={CircleIcon} size={70} color={isDark ? "rgba(255,255,255,0.1)" : "#EBECF0"} />
                    </View>
                    <HugeiconsIcon icon={Logout01Icon} size={30} color="#FF5252" />
                  </View>
                  <Text style={[styles.logoutModalTitle, { color: colors.text }]}>LOG OUT</Text>
                  <Text style={[styles.logoutModalMessage, { color: colors.textMuted }]}>
                    Are you sure you want to log out of your account?
                  </Text>
                  <View style={styles.logoutButtonRow}>
                    <TouchableOpacity
                      style={[styles.cancelButton, { backgroundColor: isDark ? '#334155' : '#DDE3E9' }]}
                      onPress={() => setIsLogoutVisible(false)}>
                      <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#333' }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.logoutButtonModal}
                      onPress={() => { setIsLogoutVisible(false); logout(); }}>
                      <View style={styles.logoutButtonContent}>
                        <View style={[styles.smallIconCircle, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#EBECF0' }]}>
                          <HugeiconsIcon icon={Logout01Icon} size={18} color="#FF5252" />
                        </View>
                        <Text style={styles.logoutButtonText}>Log Out</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  settingsList: {
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  fontCard: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  fontCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'transparent',
  },
  
  // ── MODAL STYLES ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  privacyScroll: {
    flexGrow: 0,
  },
  privacySectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  privacyParagraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  
  // ── LOGOUT MODAL STYLES ──
  logoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContainer: {
    width: width * 0.85,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  logoutIconWrapper: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutModalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  logoutModalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  logoutButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 20,
  },
  logoutButtonModal: {
    flex: 1,
    backgroundColor: '#FFE5E5',
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2.5,
  },
  logoutButtonText: {
    color: '#FF5252',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SettingsScreen;
