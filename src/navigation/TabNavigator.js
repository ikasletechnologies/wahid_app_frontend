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
    bottom: Platform.OS === 'ios' ? 25 : 15,
    alignSelf: 'center',
    width: '92%',
    backgroundColor: 'rgba(15, 17, 25, 0.97)',
    borderRadius: 20,
    height: 68,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    paddingBottom: 4,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  iconWrapper: {
    width: 40,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(201, 168, 76, 0.12)',
  },
});

export default TabNavigator;
