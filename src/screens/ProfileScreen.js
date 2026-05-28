import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const { colors, isDark } = useAppTheme();
  const [showSignOut, setShowSignOut] = useState(false);

  const handleLogout = () => setShowSignOut(true);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ── */}
        <View style={styles.avatarSection}>
          {/* <Image 
            source={require('../../assets/man.png')} // assuming man.png is the 3D avatar, fallback to a network URL if needed
            style={styles.avatar} 
            defaultSource={{uri: 'https://cdn3d.iconscout.com/3d/premium/thumb/boy-avatar-6299533-5187871.png'}}
          /> */}
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Wahid'}</Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'Wahid123@gmail.com'}</Text>
        </View>

        {/* ── Settings ── */}
        <View style={styles.settingsContainer}>
          <SettingItem
            icon="person-outline"
            label="Personal Details"
            colors={colors}
            isDark={isDark}
            onPress={() => navigation.navigate('PersonalDetails')}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            label="Privacy & Security"
            colors={colors}
            isDark={isDark}
            onPress={() => {}}
          />
          <SettingItem
            icon="notifications-outline"
            label="Notifications"
            colors={colors}
            isDark={isDark}
            onPress={() => {}}
          />
          <SettingItem
            icon="settings-outline"
            label="Settings"
            colors={colors}
            isDark={isDark}
            onPress={() => navigation.navigate('Settings')}
          />
          <SettingItem
            icon="information-circle-outline"
            label="About Wahid"
            value="v1.0.0"
            colors={colors}
            isDark={isDark}
            onPress={() => {}}
          />
        </View>

        {/* ── Log Out Card ── */}
        <TouchableOpacity
          style={[styles.signOutCard, {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
            shadowOpacity: isDark ? 0 : 0.06,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'transparent',
            borderWidth: isDark ? 1 : 0,
          }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={[styles.signOutIconWrap, { backgroundColor: isDark ? 'rgba(255,77,77,0.12)' : '#fff0f0' }]}>
            <Ionicons name="log-out-outline" size={18} color="#ff4d4d" />
          </View>
          <Text style={styles.signOutLabel}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Sign Out Confirmation ── */}
      <ConfirmDialog
        visible={showSignOut}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        icon="log-out-outline"
        iconColor="#ff4d4d"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        confirmColor="#ff4d4d"
        onConfirm={() => { setShowSignOut(false); logout(); }}
        onCancel={() => setShowSignOut(false)}
      />
    </SafeAreaView>
  );
};

const SettingItem = ({ icon, label, value, onPress, colors, isDark }) => (
  <TouchableOpacity 
    style={[
      styles.settingRow, 
      { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }
    ]} 
    onPress={onPress} 
    activeOpacity={0.7}
  >
    <View style={styles.settingLeft}>
      <View style={[styles.iconCircle, { backgroundColor: isDark ? colors.surface : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
        <Ionicons name={icon} size={15} color="#06b6d4" />
      </View>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
    </View>
    {value ? (
      <Text style={[styles.settingValue, { color: '#06b6d4' }]}>{value}</Text>
    ) : (
      <View style={[styles.arrowCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
        <Ionicons name="arrow-forward" size={12} color="#06b6d4" />
      </View>
    )}
  </TouchableOpacity>
);

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    backgroundColor: '#fdeee0',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
  },
  settingsContainer: {
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  arrowCircle: {
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
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    gap: 14,
  },
  signOutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff4d4d',
  },
});

export default ProfileScreen;
