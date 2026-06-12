import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import TimeBasedBackground from '../components/TimeBasedBackground';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { isDark, toggleTheme, colors } = useAppTheme();
  const lightMode = !isDark;
  const [arabicScript, setArabicScript] = useState(true);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]} edges={['top']}>
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
              <View style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
                    <Ionicons name="information-circle-outline" size={14} color="#06b6d4" />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>About Wahid</Text>
                  <View style={{ marginLeft: 'auto' }}>
                    <MaskedView maskElement={<Text style={styles.versionText}>v1.0.0</Text>}>
                      <LinearGradient colors={['#06b6d4', '#22d3ee']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={[styles.versionText, { opacity: 0 }]}>v1.0.0</Text>
                      </LinearGradient>
                    </MaskedView>
                  </View>
                </View>

            </View>
          </View>
      </>
        )}
    </TimeBasedBackground>
    </SafeAreaView >
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
  versionText: {
    fontSize: 18,
    fontWeight: '600',
    paddingLeft: 110,
    // gradient will be applied via MaskedView, keep transparent color
    color: 'transparent',
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

export default SettingsScreen;
