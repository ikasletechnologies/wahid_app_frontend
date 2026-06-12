import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import TimeBasedBackground from '../components/TimeBasedBackground';

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { isDark, colors } = useAppTheme();

  const [isNotificationEnabled, setNotificationEnabled] = useState(false);
  const [isSoundEnabled, setSoundEnabled] = useState(false);

  const toggleNotification = () => setNotificationEnabled(prev => !prev);
  const toggleSound = () => setSoundEnabled(prev => !prev);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]} edges={['top']}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsList}>
              <View style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
                    <Ionicons name="notifications-outline" size={14} color="#06b6d4" />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Enable Notifications</Text>
                </View>
                <Switch
                  trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#06b6d4' }}
                  thumbColor={isNotificationEnabled ? '#ffffff' : isDark ? '#94A3B8' : '#f4f3f4'}
                  ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
                  onValueChange={toggleNotification}
                  value={isNotificationEnabled}
                />
              </View>

              <View style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
                    <Ionicons name="volume-high-outline" size={14} color="#06b6d4" />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Notification Sound</Text>
                </View>
                <Switch
                  trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#06b6d4' }}
                  thumbColor={isSoundEnabled ? '#ffffff' : isDark ? '#94A3B8' : '#f4f3f4'}
                  ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
                  onValueChange={toggleSound}
                  value={isSoundEnabled}
                  disabled={!isNotificationEnabled}
                />
              </View>
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
});

export default NotificationSettingsScreen;
