import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    ScrollView,
    Modal,
    useColorScheme,
    Dimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import CircleIcon from '@hugeicons/core-free-icons/dist/esm/CircleIcon.js';
import MaskedView from '@react-native-masked-view/masked-view';
import { HugeiconsIcon } from '@hugeicons/react-native';
import UserIcon from '@hugeicons/core-free-icons/dist/esm/UserIcon.js';
import SecurityIcon from '@hugeicons/core-free-icons/dist/esm/SecurityIcon.js';
import Settings02Icon from '@hugeicons/core-free-icons/dist/esm/Settings02Icon.js';
import InformationCircleIcon from '@hugeicons/core-free-icons/dist/esm/InformationCircleIcon.js';
import Logout01Icon from '@hugeicons/core-free-icons/dist/esm/Logout01Icon.js';
import { useAuth } from '../context/AuthContext';
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
    cardShadow: '#3DF3FF',
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
    const [isLogoutVisible, setIsLogoutVisible] = useState(false);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
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
                                    onPress={() => navigation.navigate('Home')}
                                >
                                    <Ionicons name="chevron-back" size={24} color={t.headerText} />
                                </TouchableOpacity>
                                <Text style={[styles.headerTitle, { color: t.headerText }]}>Profile</Text>
                            </View>

                            <View>

                                {/* PROFILE SECTION */}
                                <View style={styles.profileSection}>
                                    <TouchableOpacity style={[styles.avatarBubble, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#cffafe' }]} activeOpacity={0.8}>
                                        <Text style={[styles.avatarInitial, { color: '#06b6d4' }]}>{initial}</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.profileName, { color: t.nameText }]}>
                                        {user?.name || 'Wahid'}
                                    </Text>
                                    <Text style={[styles.profileEmail, { color: t.emailText }]}>
                                        {user?.email || 'Wahid123@gmail.com'}
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

                                {/* PRIVACY & SECURITY */}
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
                                                    <HugeiconsIcon icon={SecurityIcon} size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>Privacy & Security</Text>
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

                                {/* SETTINGS */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={{ marginTop: 15 }}
                                    onPress={() => navigation.navigate('Settings')}
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
                                                    <HugeiconsIcon icon={Settings02Icon} size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>Settings</Text>
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

                                {/* ABOUT WAHID */}
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
                                                    <HugeiconsIcon icon={InformationCircleIcon} size={20} color="white" />
                                                </MaskedGradient>
                                            </View>
                                            <Text style={[styles.cardTitle, { color: t.cardText }]}>About Wahid</Text>
                                        </View>
                                        <MaskedGradient width={60} height={25}>
                                            <Text style={{ fontSize: 18, color: 'black', fontWeight: '500' }}>v1.0.0</Text>
                                        </MaskedGradient>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
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
                                                    <HugeiconsIcon icon={Logout01Icon} size={20} color="red" />
                                                </View>
                                                <Text style={[styles.cardTitle, { color: 'red' }]}>Logout</Text>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </ScrollView>

                                {/* LOGOUT MODAL */}
                                <Modal
                                    transparent={true}
                                    visible={isLogoutVisible}
                                    animationType="fade"
                                    onRequestClose={() => setIsLogoutVisible(false)}
                                >
                                    <View style={styles.overlay}>
                                        <View style={styles.modalContainer}>
                                            <View style={styles.iconWrapper}>
                                                <View style={StyleSheet.absoluteFill}>
                                                    <HugeiconsIcon icon={CircleIcon} size={70} color="#EBECF0" />
                                                </View>
                                                <HugeiconsIcon icon={Logout01Icon} size={30} color="#FF5252" />
                                            </View>
                                            <Text style={styles.modalTitle}>LOG OUT</Text>
                                            <Text style={styles.modalMessage}>
                                                Are you sure you want to log out of your account?
                                            </Text>
                                            <View style={styles.buttonRow}>
                                                <TouchableOpacity
                                                    style={styles.cancelButton}
                                                    onPress={() => setIsLogoutVisible(false)}>
                                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.logoutButtonModal}
                                                    onPress={() => { setIsLogoutVisible(false); logout(); }}>
                                                    <View style={styles.logoutButtonContent}>
                                                        <View style={styles.smallIconCircle}>
                                                            <HugeiconsIcon icon={Logout01Icon} size={18} color="#FF5252" />
                                                        </View>
                                                        <Text style={styles.logoutButtonText}>Log Out</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </Modal>
                            </View>
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

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    iconWrapper: {
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#000',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#DDE3E9',
        paddingVertical: 14,
        borderRadius: 10,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16,
        // slight downward shift via lineHeight
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
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 2.5,
        borderColor: '#EBECF0',
    },
    logoutButtonText: {
        color: '#FF5252',
        fontWeight: 'bold',
        fontSize: 16,
    },
});