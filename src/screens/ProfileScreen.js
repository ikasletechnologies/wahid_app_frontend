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
import Settings02Icon from '@hugeicons/core-free-icons/dist/esm/Settings02Icon.js';

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
    const { user } = useAuth();
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
});