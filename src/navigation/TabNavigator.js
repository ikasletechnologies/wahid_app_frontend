import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform, Animated, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import NamesScreen from '../screens/NamesScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import JourneyScreen from '../screens/JourneyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import MiniPlayer from '../components/MiniPlayer';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

// ── MANUALLY RESIZE THESE TO TWEAK THE LOOK ───────────────────────────────
const BAR_HEIGHT = 65;         // Tall and premium
const BAR_MARGIN = 10;         // Left/Right distance from screen edges
const BEAM_OPACITY = 0.15;     // Strength of the light beam
const ICON_ACTIVE_SCALE = 1.2; // Animation pop
// ──────────────────────────────────────────────────────────────────────────

const TAB_ICONS = {
  Home: require('../../assets/HOME.png'),
  Names: require('../../assets/NAMES.png'),
  Playlist: require('../../assets/PLAYLIST.png'),
  Journey: require('../../assets/JOURNEY.png'),
  Profile: require('../../assets/PROFILE.png'),
};

const CustomTabBar = ({ state, descriptors, navigation, isDark }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const activeScales = useRef(state.routes.map(() => new Animated.Value(1))).current;

  const availableWidth = width - (BAR_MARGIN * 2);
  const tabWidth = availableWidth / state.routes.length;

  useEffect(() => {
    // 1. Move the light beam
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    // 2. Animate icon scale
    state.routes.forEach((_, i) => {
      Animated.spring(activeScales[i], {
        toValue: state.index === i ? ICON_ACTIVE_SCALE : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index, tabWidth]);

  return (
    <View style={styles.tabBarContainer}>
      <View style={[styles.tabBar, { height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2.2 }]}>

        {/* Sliding Spotlight Beam (Soft Gradient) */}
        <Animated.View
          style={[
            styles.beamContainer,
            { width: tabWidth, height: BAR_HEIGHT, transform: [{ translateX }] }
          ]}
        >
          <LinearGradient
            colors={[`rgba(0, 173, 193, ${BEAM_OPACITY * 1.5})`, 'transparent']}
            style={styles.beamGradient}
          />
          <View style={styles.beamTopLine} />
        </Animated.View>

        {/* Tabs */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={1}
              onPress={onPress}
              style={styles.tabButton}
            >
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: activeScales[index] }] }]}>
                <Image
                  source={TAB_ICONS[route.name]}
                  style={[
                    styles.tabIcon,
                    {
                      tintColor: isFocused ? '#00ADC1' : '#1A1A1A',
                      opacity: isFocused ? 1 : 0.6
                    }
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 35 : 25,
    left: BAR_MARGIN,
    right: BAR_MARGIN,
    zIndex: 1000,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 30,
    shadowColor: '#00ADC1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(0, 173, 193, 0.08)',
    overflow: 'hidden',
  },
  beamContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  beamGradient: {
    width: '50%',
    height: '100%',
    position: 'absolute',
    top: -15,
    // This creates the tapered searchlight look
    transform: [{ perspective: 100 }, { rotateX: '45deg' }],
    opacity: 1,
  },
  beamTopLine: {
    position: 'absolute',
    top: -1,
    width: 45,
    height: 4.5,
    backgroundColor: '#00ADC1',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    shadowColor: '#00ADC1',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
});

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
