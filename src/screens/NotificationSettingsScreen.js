import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, TouchableOpacity } from 'react-native';

import TimeBasedBackground from '../components/TimeBasedBackground';
import { useAppTheme } from '../context/ThemeContext';

export default function NotificationSettingsScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();


  const [isNotificationEnabled, setNotificationEnabled] = useState(false);
  const [isSoundEnabled, setSoundEnabled] = useState(false);

  const toggleNotification = () => setNotificationEnabled(prev => !prev);
  const toggleSound = () => setSoundEnabled(prev => !prev);

  return (
    <SafeAreaView style={styles.container}>
      <TimeBasedBackground showElements={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 32, color: colors.text }}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notification Settings</Text>
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isNotificationEnabled ? '#f5dd4b' : '#f4f3f4'}
            onValueChange={toggleNotification}
            value={isNotificationEnabled}
          />
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.label}>Notifications Sound</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isSoundEnabled ? '#f5dd4b' : '#f4f3f4'}
            onValueChange={toggleSound}
            value={isSoundEnabled}
          />
        </View>
      </TimeBasedBackground>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 10,
    paddingLeft: 10,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    fontSize: 18,
    paddingLeft: 10,
    color: '#333',
  },
});
