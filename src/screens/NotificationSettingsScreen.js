import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';

export default function NotificationSettingsScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => setIsEnabled(previous => !previous);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[isDark ? '#0F172A' : '#FFFFFF', isDark ? '#0F172A' : '#FFFFFF']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Notification Settings</Text>
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
    padding: 50,
    paddingLeft: 10,
    
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  label: {
    fontSize: 18,
    paddingLeft:10,
    color: '#333',
  },
});
