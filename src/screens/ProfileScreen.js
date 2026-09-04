import React, { useState, useMemo } from "react";
import { View, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Modal, useColorScheme, Dimensions } from "react-native";
import Text from '../components/AppText';

import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CircleIcon from '@hugeicons/core-free-icons/dist/esm/CircleIcon.js';
import MaskedView from '@react-native-masked-view/masked-view';
import { HugeiconsIcon } from '@hugeicons/react-native';
import UserIcon from '@hugeicons/core-free-icons/dist/esm/UserIcon.js';
import Settings02Icon from '@hugeicons/core-free-icons/dist/esm/Settings02Icon.js';

import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import Logout01Icon from '@hugeicons/core-free-icons/dist/esm/Logout01Icon.js';
import ReadingSettingsModal from '../components/ReadingSettingsModal';
import TimeBasedBackground from '../components/TimeBasedBackground';

const { width } = Dimensions.get('window');

// ── Night / day colour tokens ─────────────────────────────────────────────
const DAY = {
    headerText: '#000000',
    nameText: '#000000',
    emailText: '#666666',
    cardBg: ['#FFFFFF', '#FFFFFF'],
    cardText: '#000000',
    iconCircleBg: '#FFFFFF',
    iconRing: '#EBECF0',
    cardShadow: '#fcfcfc',
    cardBorder: 'transparent',
};

const NIGHT = {
    headerText: '#FFFFFF',
    nameText: '#FFFFFF',
    emailText: 'rgba(255,255,255,0.55)',
    cardBg: ['#1A2744', '#1A2744'],
    cardText: '#FFFFFF',
    iconCircleBg: '#0F1D36',
    iconRing: 'rgba(61,243,255,0.20)',
    cardShadow: 'transparent',
    cardBorder: 'rgba(61,243,255,0.12)',
};
// ─────────────────────────────────────────────────────────────────────────

const MaskedGradient = ({ children, width: w, height: h }) => (
    <MaskedView
        style={{ width: w, height: h }}
        maskElement={
            <View style={{ backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                {children}
            </View>
        }
    >
        <LinearGradient
            colors={['#7FEAF5', '#41bacaff']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
    </MaskedView>
);

// Reusable menu card
const MenuCard = ({ t, onPress, left, right, style }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={style}>
        <LinearGradient
            colors={t.cardBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.card, { borderColor: t.cardBorder, borderWidth: 1, shadowColor: t.cardShadow }]}
        >
            <View style={styles.leftSection}>
                <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                        <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                    </View>
                    {left}
                </View>
                {right}
            </View>
        </LinearGradient>
    </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const { colors, isDark } = useAppTheme();
    const [privacyVisible, setPrivacyVisible] = useState(false);
    const [isLogoutVisible, setIsLogoutVisible] = useState(false);
    const [readingSettingsVisible, setReadingSettingsVisible] = useState(false);
    const initial = user?.name?.charAt(0) ?? '';

    return (
        <SafeAreaView style={styles.container}>
            <TimeBasedBackground showElements={false}>
                {({ isNight }) => {
                    const t = isNight ? NIGHT : DAY;

                    return (
                        <>
                            <StatusBar
                                barStyle={isNight ? "light-content" : "dark-content"}
                                backgroundColor="transparent"
                                translucent
                            />

                            {/* HEADER */}
                            <View style={styles.headerContainer}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (navigation.canGoBack()) {
                                            navigation.goBack();
                                        } else {
                                            navigation.navigate('Main');
                                        }
                                    }}
                                >
                                    <Ionicons name="chevron-back" size={24} color={t.headerText} />
                                </TouchableOpacity>
                                <Text style={[styles.headerTitle, { color: t.headerText }]}>Profile</Text>
                            </View>

                            <View>

                                {/* PROFILE SECTION */}
                                <View style={styles.profileSection}>
                                    <TouchableOpacity style={[styles.avatarBubble, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#cffafe' }]} activeOpacity={0.8}>
                                        <Text style={[styles.avatarInitial, { color: '#06b6d4' }]}>{initial || 'U'}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.profileName, { color: t.nameText }]}>
                                        {user?.name || 'User'}
                                    </Text>
                                    <Text style={[styles.profileEmail, { color: t.emailText }]}>
                                        {user?.email || ''}
                                    </Text>
                                </View>

                                {/* PERSONAL DETAILS */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('PersonalDetails')}
                                >
                                    <LinearGradient
                                        colors={t.cardBg}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={[styles.card, { borderColor: t.cardBorder, borderWidth: 1, shadowColor: t.cardShadow }]}
                                    >
                                        <View style={styles.leftSection}>
                                            <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                    <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                                </View>
                                                <MaskedGradient width={24} height={24}>
                                                    <HugeiconsIcon icon={UserIcon} size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>Personal Details</Text>
                                        </View>
                                        <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center', marginTop: -10, marginRight: 5 }}>
                                            <View style={StyleSheet.absoluteFill}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                            </View>
                                            <MaskedGradient width={24} height={24}>
                                                <Ionicons name="arrow-forward" size={20} style={{ marginLeft: 7, marginTop: 7 }} color="white" />
                                            </MaskedGradient>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* READING & DISPLAY SETTINGS */}
                                <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }} onPress={() => setReadingSettingsVisible(true)}>
                                    <LinearGradient
                                        colors={t.cardBg}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={[styles.card, { borderColor: t.cardBorder, borderWidth: 1, shadowColor: t.cardShadow }]}
                                    >
                                        <View style={styles.leftSection}>
                                            <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                    <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                                </View>
                                                <MaskedGradient width={24} height={24}>
                                                    <Ionicons name="color-palette-outline" size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>Reading & Display Settings</Text>
                                        </View>
                                        <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                            </View>
                                            <MaskedGradient width={18} height={18}>
                                                <Ionicons name="arrow-forward" size={18} color="black" />
                                            </MaskedGradient>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* SUBSCRIPTION & ACCESS PASS */}
                                <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }} onPress={() => navigation.navigate('Subscription')}>
                                    <LinearGradient
                                        colors={t.cardBg}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={[styles.card, { borderColor: t.cardBorder, borderWidth: 1, shadowColor: t.cardShadow }]}
                                    >
                                        <View style={styles.leftSection}>
                                            <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                    <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                                </View>
                                                <MaskedGradient width={24} height={24}>
                                                    <Ionicons name="sparkles" size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>Subscription & Access Pass</Text>
                                        </View>
                                        <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                            </View>
                                            <MaskedGradient width={18} height={18}>
                                                <Ionicons name="arrow-forward" size={18} color="black" />
                                            </MaskedGradient>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* NOTIFICATIONS */}
                                <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }} onPress={() => navigation.navigate('NotificationSettings')}>
                                    <LinearGradient
                                        colors={t.cardBg}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={[styles.card, { borderColor: t.cardBorder, borderWidth: 1, shadowColor: t.cardShadow }]}
                                    >
                                        <View style={styles.leftSection}>
                                            <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                    <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                                </View>
                                                <MaskedGradient width={24} height={24}>
                                                    <Ionicons name="notifications-outline" size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>Notifications</Text>
                                        </View>
                                        <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                            </View>
                                            <MaskedGradient width={18} height={18}>
                                                <Ionicons name="arrow-forward" size={18} color="black" />
                                            </MaskedGradient>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* ABOUT APP */}
                                <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }}>
                                    <LinearGradient
                                        colors={t.cardBg}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={[styles.card, { borderColor: t.cardBorder, borderWidth: 1, shadowColor: t.cardShadow }]}
                                    >
                                        <View style={styles.leftSection}>
                                            <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                    <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                                </View>
                                                <MaskedGradient width={24} height={24}>
                                                    <Ionicons name="information-circle-outline" size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>About Wahid</Text>
                                        </View>
                                        <View style={{ marginLeft: 'auto', justifyContent: 'center' }}>
                                            <MaskedView maskElement={<Text style={styles.versionText}>v1.0.0</Text>}>
                                                <LinearGradient colors={['#06b6d4', '#22d3ee']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                                    <Text style={[styles.versionText, { opacity: 0 }]}>v1.0.0</Text>
                                                </LinearGradient>
                                            </MaskedView>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* PRIVACY POLICY */}
                                <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }} onPress={() => setPrivacyVisible(true)}>
                                    <LinearGradient
                                        colors={t.cardBg}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={[styles.card, { borderColor: t.cardBorder, borderWidth: 1, shadowColor: t.cardShadow }]}
                                    >
                                        <View style={styles.leftSection}>
                                            <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                    <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                                </View>
                                                <MaskedGradient width={24} height={24}>
                                                    <Ionicons name="shield-checkmark-outline" size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>Privacy Policy</Text>
                                        </View>
                                        <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                            </View>
                                            <MaskedGradient width={18} height={18}>
                                                <Ionicons name="arrow-forward" size={18} color="black" />
                                            </MaskedGradient>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* LOGOUT BUTTON */}
                                <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }} onPress={() => setIsLogoutVisible(true)}>
                                    <LinearGradient
                                        colors={t.cardBg}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={[styles.card, { borderColor: t.cardBorder, borderWidth: 1, shadowColor: t.cardShadow }]}
                                    >
                                        <View style={styles.leftSection}>
                                            <View style={[styles.iconCircle, { backgroundColor: t.iconCircleBg }]}>
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                    <HugeiconsIcon icon={CircleIcon} size={45} color={t.iconRing} />
                                                </View>
                                                <MaskedGradient width={24} height={24}>
                                                    <HugeiconsIcon icon={Logout01Icon} size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: '#FF5252' }]}>Logout</Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            <ReadingSettingsModal
                                visible={readingSettingsVisible}
                                onClose={() => setReadingSettingsVisible(false)}
                            />

                            {/* Privacy Policy Modal */}
                            <Modal visible={privacyVisible} animationType="slide" transparent={true} onRequestClose={() => setPrivacyVisible(false)}>
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
                    );
                }}
            </TimeBasedBackground >
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: 15,
        marginTop: -3,
    },

    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
    },
    backButton: {
        marginRight: 5,
        padding: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },

    profileSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    avatarBubble: {
        width: 90,
        height: 90,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarInitial: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#06b6d4',
    },
    profileName: {
        marginTop: 0,
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileEmail: {
        marginTop: 0,
        fontSize: 14,
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        paddingVertical: 14,
        borderRadius: 14,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    leftSection: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconCircle: {
        width: 44,
        height: 34,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: "600",
    },
    versionText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'transparent',
    },
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