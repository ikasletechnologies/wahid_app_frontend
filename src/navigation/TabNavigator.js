import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import NamesScreen from '../screens/NamesScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import JourneyScreen from '../screens/JourneyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { colors, isDark } = useAppTheme();

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
            <View style={[
              { 
                width: 48, 
                height: 30, 
                justifyContent: 'center', 
                alignItems: 'center', 
                borderRadius: 15,
              },
              focused && { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.18)' : 'rgba(184, 150, 61, 0.15)' }
            ]}>
              <Ionicons name={iconName} size={20} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 16, right: 16,
          backgroundColor: isDark ? 'rgba(18, 20, 28, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: 24, height: 70,
          borderTopWidth: 0, borderWidth: 1.5,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          elevation: 12, shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.6 : 0.1,
          shadowRadius: 16,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: { 
          fontSize: 10, 
          fontWeight: '800', 
          textTransform: 'uppercase', 
          letterSpacing: 0.8,
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Names" component={NamesScreen} />
      <Tab.Screen name="Playlist" component={PlaylistScreen} />
      <Tab.Screen name="Journey" component={JourneyScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
