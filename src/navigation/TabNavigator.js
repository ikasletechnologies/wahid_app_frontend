import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform, Animated, TouchableOpacity, StyleSheet, Text, Dimensions } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import NamesScreen from '../screens/NamesScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import JourneyScreen from '../screens/JourneyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation, colors, isDark }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  // The bar has left/right margin of 16 each = 32. 
  const availableWidth = width - 32;
  const tabWidth = availableWidth / state.routes.length;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      friction: 6,
      tension: 50,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[
      styles.tabBar,
      {
        backgroundColor: isDark ? 'rgba(18, 20, 28, 0.98)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        shadowOpacity: isDark ? 0.6 : 0.1,
      }
    ]}>
      {/* Sliding Active Pill */}
      <Animated.View
        style={[
          styles.activeIndicatorWrap,
          { width: tabWidth, transform: [{ translateX }] }
        ]}
      >
        <View style={[
          styles.activeIndicatorPill,
          { backgroundColor: isDark ? 'rgba(201, 168, 76, 0.18)' : 'rgba(184, 150, 61, 0.15)' }
        ]} />
      </Animated.View>

      {/* Tabs */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        if (route.name === 'Home')         iconName = isFocused ? 'home'          : 'home-outline';
        else if (route.name === 'Names')   iconName = isFocused ? 'grid'          : 'grid-outline';
        else if (route.name === 'Playlist')iconName = isFocused ? 'musical-notes' : 'musical-notes-outline';
        else if (route.name === 'Journey') iconName = isFocused ? 'stats-chart'   : 'stats-chart-outline';
        else if (route.name === 'Profile') iconName = isFocused ? 'person'        : 'person-outline';

        const color = isFocused 
          ? colors.primary 
          : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)');

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={1}
            onPress={onPress}
            style={styles.tabButton}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={20} color={color} />
            </View>
            <Text style={[styles.tabLabel, { color }]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 16,
    right: 16,
    borderRadius: 24,
    height: 70,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    paddingHorizontal: 0,
  },
  activeIndicatorWrap: {
    position: 'absolute',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    top: -5,
  },
  activeIndicatorPill: {
    width: 48,
    height: 30,
    borderRadius: 15,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

import MiniPlayer from '../components/MiniPlayer';

const TabNavigator = () => {
  const { colors, isDark } = useAppTheme();

  return (
    <>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} colors={colors} isDark={isDark} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Names" component={NamesScreen} />
        <Tab.Screen name="Playlist" component={PlaylistScreen} />
        <Tab.Screen name="Journey" component={JourneyScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <MiniPlayer />
    </>
  );
};

export default TabNavigator;
