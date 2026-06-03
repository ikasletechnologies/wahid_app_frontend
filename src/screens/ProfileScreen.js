import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    ScrollView,
    Modal,
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

const { width } = Dimensions.get('window');

import TimeBasedBackground from '../components/TimeBasedBackground';

const MaskedGradient = ({ children, width, height }) => (
    <MaskedView
        style={{ width, height }}
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

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [isLogoutVisible, setIsLogoutVisible] = useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <TimeBasedBackground showElements={false}>
                {({ isNight }) => (
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
                                <Ionicons
                                    name="chevron-back"
                                    size={24}
                                    color="#000000ff"
                                />
                            </TouchableOpacity>

                            <Text style={styles.headerTitle}>
                                Profile
                            </Text>

                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

                            {/* PROFILE SECTION */}
                            <View style={styles.profileSection}>

                                {/* CIRCULAR INITIALS AVATAR */}
                                <TouchableOpacity style={[styles.avatarBubble]} activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
                                  <Text style={styles.avatarInitial}>{(user?.name ? user.name.split(' ')[0][0] : 'W').toUpperCase()}</Text>
                                </TouchableOpacity>

                                {/* NAME */}
                                <Text style={styles.profileName}>
                                    {user?.name || 'Wahid'}
                                </Text>

                                {/* EMAIL */}
                                <Text style={styles.profileEmail}>
                                    {user?.email || 'Wahid123@gmail.com'}
                                </Text>

                            </View>

                            {/* PERSONAL DETAILS CARD */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('PersonalDetails')}
                            >

                                <LinearGradient
                                    colors={['#FFFFFF', '#FFFFFF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.card}
                                >

                                    {/* LEFT SIDE */}
                                    <View style={styles.leftSection}>

                                        {/* PROFILE ICON */}
                                        <View style={styles.iconCircle}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={40} color="#EBECF0" />
                                            </View>
                                            <MaskedGradient width={24} height={24}>
                                                <HugeiconsIcon icon={UserIcon} size={20} color="white" />
                                            </MaskedGradient>
                                        </View>

                                        {/* TEXT */}
                                        <Text style={styles.cardTitle}>
                                            Personal Details
                                        </Text>

                                    </View>

                                    {/* RIGHT ARROW */}
                                    <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={StyleSheet.absoluteFill}>
                                            <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                        </View>
                                        <MaskedGradient width={24} height={24}>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={20}
                                                marginLeft={7}
                                                marginTop={7}
                                                color="white"
                                            />
                                        </MaskedGradient>
                                    </View>

                                </LinearGradient>

                            </TouchableOpacity>

                            {/* PRIVACY & SECURITY CARD */}
                            <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }}>

                                <LinearGradient
                                    colors={['#FFFFFF', '#FFFFFF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.card}
                                >

                                    {/* LEFT SIDE */}
                                    <View style={styles.leftSection}>

                                        {/* ICON */}
                                        <View style={styles.iconCircle}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                            </View>
                                            <MaskedGradient width={24} height={24}>
                                                <HugeiconsIcon icon={SecurityIcon} size={20} color="white" />
                                            </MaskedGradient>
                                        </View>

                                        {/* TEXT */}
                                        <Text style={styles.cardTitle}>
                                            Privacy & Security
                                        </Text>

                                    </View>

                                    {/* RIGHT ARROW */}
                                    <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                            <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                        </View>
                                        <MaskedGradient width={18} height={18}>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={18}
                                                color="black"
                                            />
                                        </MaskedGradient>
                                    </View>

                                </LinearGradient>

                            </TouchableOpacity>

                            {/* NOTIFICATIONS CARD */}
                            <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }}>

                                <LinearGradient
                                    colors={['#FFFFFF', '#FFFFFF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.card}
                                >

                                    {/* LEFT SIDE */}
                                    <View style={styles.leftSection}>

                                        {/* ICON */}
                                        <View style={styles.iconCircle}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                            </View>
                                            <MaskedGradient width={24} height={24}>
                                                <Ionicons
                                                    name="notifications-outline"
                                                    size={20}
                                                    color="white"
                                                />
                                            </MaskedGradient>
                                        </View>

                                        {/* TEXT */}
                                        <Text style={styles.cardTitle}>
                                            Notifications
                                        </Text>

                                    </View>

                                    {/* RIGHT ARROW */}
                                    <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                            <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                        </View>
                                        <MaskedGradient width={18} height={18}>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={18}
                                                color="black"
                                            />
                                        </MaskedGradient>
                                    </View>

                                </LinearGradient>

                            </TouchableOpacity>

                            {/* SETTINGS CARD */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={{ marginTop: 15 }}
                                onPress={() => navigation.navigate('Settings')}
                            >

                                <LinearGradient
                                    colors={['#FFFFFF', '#FFFFFF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.card}
                                >

                                    {/* LEFT SIDE */}
                                    <View style={styles.leftSection}>

                                        {/* ICON */}
                                        <View style={styles.iconCircle}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                            </View>
                                            <MaskedGradient width={24} height={24}>
                                                <HugeiconsIcon icon={Settings02Icon} size={20} color="white" />
                                            </MaskedGradient>
                                        </View>

                                        {/* TEXT */}
                                        <Text style={styles.cardTitle}>
                                            Settings
                                        </Text>

                                    </View>

                                    {/* RIGHT ARROW */}
                                    <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                            <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                        </View>
                                        <MaskedGradient width={18} height={18}>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={18}
                                                color="black"
                                            />
                                        </MaskedGradient>
                                    </View>

                                </LinearGradient>

                            </TouchableOpacity>

                            {/* ABOUT WAHID CARD */}
                            <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 15 }}>

                                <LinearGradient
                                    colors={['#FFFFFF', '#FFFFFF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.card}
                                >

                                    {/* LEFT SIDE */}
                                    <View style={styles.leftSection}>

                                        {/* ICON */}
                                        <View style={styles.iconCircle}>
                                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                            </View>
                                            <MaskedGradient width={24} height={24}>
                                                <HugeiconsIcon icon={InformationCircleIcon} size={20} color="white" />
                                            </MaskedGradient>
                                        </View>

                                        {/* TEXT */}
                                        <Text style={styles.cardTitle}>
                                            About Wahid
                                        </Text>

                                    </View>

                                    {/* VERSION TEXT */}
                                    <MaskedGradient width={60} height={25}>
                                        <Text style={{ fontSize: 18, color: 'black', fontWeight: '500' }}>
                                            v1.0.0
                                        </Text>
                                    </MaskedGradient>

                                </LinearGradient>

                            </TouchableOpacity>

                        </ScrollView>

                        {/* LOGOUT CARD */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={{ marginBottom: 20 }}
                            onPress={() => setIsLogoutVisible(true)}
                        >

                            <LinearGradient
                                colors={['#FFFFFF', '#FFFFFF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.card}
                            >

                                {/* LEFT SIDE */}
                                <View style={styles.leftSection}>

                                    {/* ICON */}
                                    <View style={styles.iconCircle}>
                                        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                            <HugeiconsIcon icon={CircleIcon} size={45} color="#EBECF0" />
                                        </View>
                                        <HugeiconsIcon icon={Logout01Icon} size={20} color="red" />
                                    </View>

                                    {/* TEXT */}
                                    <Text style={[styles.cardTitle, { color: 'red' }]}>
                                        Logout
                                    </Text>

                                </View>

                            </LinearGradient>

                        </TouchableOpacity>

                        {/* LOGOUT MODAL */}
                        <Modal
                            transparent={true}
                            visible={isLogoutVisible}
                            animationType="fade"
                            onRequestClose={() => setIsLogoutVisible(false)}
                        >
                            <View style={styles.overlay}>
                                <View style={styles.modalContainer}>

                                    {/* TOP ICON */}
                                    <View style={styles.iconWrapper}>
                                        <View style={StyleSheet.absoluteFill}>
                                            <HugeiconsIcon icon={CircleIcon} size={70} color="#EBECF0" />
                                        </View>
                                        <HugeiconsIcon icon={Logout01Icon} size={30} color="#FF5252" />
                                    </View>

                                    {/* TEXT CONTENT */}
                                    <Text style={styles.modalTitle}>LOG OUT</Text>
                                    <Text style={styles.modalMessage}>
                                        Are you sure you want to log out of your account?
                                    </Text>

                                    {/* BUTTONS */}
                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => setIsLogoutVisible(false)}
                                        >
                                            <Text style={styles.cancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.logoutButtonModal}
                                            onPress={() => {
                                                setIsLogoutVisible(false);
                                                logout();
                                            }}
                                        >
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
                    </>
                )}
            </TimeBasedBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: 15,
    },

    /* HEADER */

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
        color: '#000',
    },

    /* PROFILE SECTION */

    profileSection: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 30,
    },

    avatarBubble: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#cffafe',
        shadowColor: '#63F3FF',

        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,

        elevation: 8,
    },

    avatarInitial: {
        color: '#06b6d4',
        fontSize: 50,
        fontWeight: '600',
        textAlign: 'center',
    },
    profileName: {
        marginTop: 15,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },

    profileEmail: {
        marginTop: 5,
        fontSize: 14,
        color: '#666',
    },

    /* CARD */

    card: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        paddingHorizontal: 15,
        paddingVertical: 14,

        borderRadius: 14,

        shadowColor: "#fcffffff",

        shadowOffset: {
            width: 0,
            height: 0,
        },

        shadowOpacity: 0.3,
        shadowRadius: 8,

        elevation: 5,
    },

    leftSection: {
        flexDirection: "row",
        alignItems: "center"
    },

    iconCircle: {
        width: 44,
        height: 34,
        borderRadius: 17,

        backgroundColor: "#FFFFFF",

        justifyContent: "center",
        alignItems: "center",

        marginRight: 12,
    },

    cardTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#000000ff",
    },

    /* MODAL STYLES */
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
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16,
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
