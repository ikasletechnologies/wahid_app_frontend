import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SPACE, RADIUS, SHADOW } from '../theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for the orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.container}>
        {/* Top Search Bar (Glassmorphic) */}
        <Animated.View 
          style={[
            styles.searchContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.searchBackground}>
            <TextInput
              style={styles.searchInput}
              placeholder="I can search new names |"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Main Content */}
        <View style={styles.content}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.mainTitle}>What Can I Do for</Text>
            <Text style={styles.mainTitle}>You Today?</Text>
          </Animated.View>

          {/* Central Glowing Orb */}
          <View style={styles.orbContainer}>
            <Animated.View style={[styles.orbOuterGlow, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.orbInner, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['#00FF88', '#00A357']}
                style={styles.orbGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
            <Animated.View style={[styles.orbSwirl1, { transform: [{ scale: pulseAnim }, { rotate: '45deg' }] }]} />
            <Animated.View style={[styles.orbSwirl2, { transform: [{ scale: pulseAnim }, { rotate: '-45deg' }] }]} />
          </View>

          {/* Use Keyboard Button */}
          <TouchableOpacity style={styles.keyboardBtn}>
            <View style={styles.keyboardIconWrap}>
              <Text style={styles.keyboardIcon}>⌨️</Text>
            </View>
            <Text style={styles.keyboardText}>Use Keyboard</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>👤</Text>
              <View style={styles.badge} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItemActive}>
            <View style={styles.activeOrb} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <View style={styles.navIconContainer}>
              <Text style={styles.navIcon}>⚙️</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.dark.black,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.xl,
  },
  
  // Search Bar
  searchContainer: {
    marginTop: SPACE.md,
    alignItems: 'center',
  },
  searchBackground: {
    width: '100%',
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 22,
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontSize: SIZES.base,
    textAlign: 'center',
  },

  // Main Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Space for bottom nav
  },
  mainTitle: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 42,
    textAlign: 'center',
    lineHeight: 50,
    fontWeight: '700',
  },

  // Orb
  orbContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACE.xxl,
  },
  orbOuterGlow: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    backgroundColor: '#00FF88',
    opacity: 0.15,
    ...SHADOW.orb,
  },
  orbInner: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00FF88',
    backgroundColor: '#000',
    ...SHADOW.neon,
  },
  orbGradient: {
    flex: 1,
    opacity: 0.8,
  },
  orbSwirl1: {
    position: 'absolute',
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: (width * 0.45) / 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderStyle: 'dashed',
  },
  orbSwirl2: {
    position: 'absolute',
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: (width * 0.55) / 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.1)',
  },

  // Keyboard Button
  keyboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACE.xl,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  keyboardIconWrap: {
    marginRight: SPACE.sm,
  },
  keyboardIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  keyboardText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
  },

  // Bottom Nav
  bottomNav: {
    position: 'absolute',
    bottom: SPACE.xl,
    left: SPACE.xl,
    right: SPACE.xl,
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navItem: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  navItemActive: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeOrb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    ...SHADOW.neon,
  },
});

export default DashboardScreen;
