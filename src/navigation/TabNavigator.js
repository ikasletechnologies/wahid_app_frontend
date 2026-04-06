import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import NamesScreen from '../screens/NamesScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import JourneyScreen from '../screens/JourneyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS, RADIUS } from '../theme';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home')    iconName = focused ? 'home'          : 'home-outline';
          else if (route.name === 'Names')   iconName = focused ? 'grid'          : 'grid-outline';
          else if (route.name === 'Playlist') iconName = focused ? 'musical-notes' : 'musical-notes-outline';
          else if (route.name === 'Journey') iconName = focused ? 'stats-chart'   : 'stats-chart-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person'        : 'person-outline';

          return (
            <View style={[styles.iconWrapper, focused && styles.activeTab]}>
              <Ionicons name={iconName} size={focused ? 22 : 20} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: '#c9a84c',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Names"    component={NamesScreen} />
      <Tab.Screen name="Playlist" component={PlaylistScreen} />
      <Tab.Screen name="Journey"  component={JourneyScreen} />
      <Tab.Screen name="Profile"  component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(18, 20, 28, 0.98)',
    borderRadius: 24,
    height: 74,
    borderTopWidth: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  iconWrapper: {
    width: 44,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 2,
  },
  activeTab: {
    backgroundColor: 'rgba(201, 168, 76, 0.18)',
  },
});

export default TabNavigator;
