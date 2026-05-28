import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { isDark, toggleTheme, colors } = useAppTheme();
  const lightMode = !isDark;
  const [arabicScript, setArabicScript] = useState(true);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsList}>
        {/* Light Mode */}
        <View style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
              <Ionicons name="sunny-outline" size={15} color="#06b6d4" />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Light Mode</Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: '#06b6d480' }}
            thumbColor={lightMode ? '#06b6d4' : '#f4f3f4'}
            ios_backgroundColor={colors.border}
            onValueChange={toggleTheme}
            value={lightMode}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>

        {/* Arabic Script */}
        <View style={[styles.settingItem, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.05, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff', shadowOpacity: isDark ? 0 : 0.15, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EBECF0', borderWidth: isDark ? 1 : 6 }]}>
              <Ionicons name="sync-outline" size={14} color="#06b6d4" />
            </View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Arabic Script</Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: '#06b6d480' }}
            thumbColor={arabicScript ? '#06b6d4' : '#f4f3f4'}
            ios_backgroundColor={colors.border}
            onValueChange={setArabicScript}
            value={arabicScript}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#06b6d4' }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.saveBtnText, { color: isDark ? colors.background : '#FFFFFF' }]}>Save Changes</Text>
        </TouchableOpacity>
      </View>
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
