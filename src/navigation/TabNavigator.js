import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform, Animated, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import NamesScreen from '../screens/NamesScreen';
import MilestoneScreen from '../screens/MilestoneScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import MiniPlayer from '../components/MiniPlayer';

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const BAR_HEIGHT        = 65;
const BAR_MARGIN        = 10;
const ICON_ACTIVE_SCALE = 1.2;

const TAB_ICONS = {
  Home:       require('../../assets/navigation/home.png'),
  Names:      require('../../assets/navigation/names.png'),
  Milestones: require('../../assets/navigation/journey.png'),
  Profile:    require('../../assets/navigation/profile.png'),
};

// ── Time-based night detection — mirrors TimeBasedBackground logic ─────────
const getIsNight = () => {
  const h = new Date().getHours();
  return h < 6 || h >= 18;
};

const useIsNight = () => {
  const [isNight, setIsNight] = useState(getIsNight);
  useEffect(() => {
    const id = setInterval(() => setIsNight(getIsNight()), 60_000);
    return () => clearInterval(id);
  }, []);
  return isNight;
};
// ──────────────────────────────────────────────────────────────────────────

// Colour tokens — day vs night
const DAY = {
  barBg:          '#FFFFFF',
  border:         'rgba(0, 173, 193, 0.08)',
  shadow:         '#00ADC1',
  beamColor:      '#00ADC1',
  beamOpacity:    0.225,
  topLine:        '#00ADC1',
  iconActive:     '#00ADC1',
  iconInactive:   '#1A1A1A',
  iconOpacity:    0.6,
};

const NIGHT = {
  barBg:          '#0F172A',
  border:         'rgba(61, 243, 255, 0.18)',
  shadow:         '#3DF3FF',
  beamColor:      '#3DF3FF',
  beamOpacity:    0.30,
  topLine:        '#3DF3FF',
  iconActive:     '#3DF3FF',
  iconInactive:   '#FFFFFF',
  iconOpacity:    0.45,
};

const CustomTabBar = ({ state, descriptors, navigation, isNight }) => {
  const theme = isNight ? NIGHT : DAY;

  const translateX   = useRef(new Animated.Value(0)).current;
  const activeScales = useRef(state.routes.map(() => new Animated.Value(1))).current;

  const availableWidth = width - BAR_MARGIN * 2;
  const tabWidth       = availableWidth / state.routes.length;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();

    state.routes.forEach((_, i) => {
      Animated.spring(activeScales[i], {
        toValue: state.index === i ? ICON_ACTIVE_SCALE : 1,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index, tabWidth]);

  return (
    <View style={styles.tabBarContainer}>
      <View
        style={[
          styles.tabBar,
          {
            height:          BAR_HEIGHT,
            borderRadius:    BAR_HEIGHT / 2.2,
            backgroundColor: theme.barBg,
            borderColor:     theme.border,
            shadowColor:     theme.shadow,
          },
        ]}
      >
        {/* Sliding spotlight beam */}
        <Animated.View
          style={[
            styles.beamContainer,
            { width: tabWidth, height: BAR_HEIGHT, transform: [{ translateX }] },
          ]}
        >
          <LinearGradient
            colors={[`rgba(${isNight ? '61,243,255' : '0,173,193'}, ${theme.beamOpacity})`, 'transparent']}
            style={styles.beamGradient}
          />
          <View style={[styles.beamTopLine, { backgroundColor: theme.topLine, shadowColor: theme.topLine }]} />
        </Animated.View>

        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
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
                      tintColor: isFocused ? theme.iconActive : theme.iconInactive,
                      opacity:   isFocused ? 1 : theme.iconOpacity,
                    },
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
    left:  BAR_MARGIN,
    right: BAR_MARGIN,
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 30,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    borderWidth: 1,
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
    transform: [{ perspective: 100 }, { rotateX: '45deg' }],
    opacity: 1,
  },
  beamTopLine: {
    position: 'absolute',
    top: -1,
    width: 45,
    height: 4.5,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
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
  const isNight = useIsNight();

  return (
    <>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} colors={colors} isDark={isDark} isNight={isNight} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home"       component={HomeScreen} />
        <Tab.Screen name="Names"      component={NamesScreen} />
        <Tab.Screen name="Milestones" component={MilestoneScreen} />
        <Tab.Screen name="Profile"    component={ProfileScreen} />
      </Tab.Navigator>
      <MiniPlayer />
    </>
  );
};

export default TabNavigator;
