import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Time periods ─────────────────────────────────────────────────────────────
const getPeriod = (h) => {
  if (h >= 6 && h < 8) return 'sunrise';
  if (h >= 8 && h < 12) return 'morning';
  if (h >= 12 && h < 15) return 'noon';
  if (h >= 15 && h < 18) return 'evening';
  if (h >= 18 && h < 20) return 'sunset';
  return 'night';
};

// ─── Sky gradients ────────────────────────────────────────────────────────────
const SKY = {
  sunrise: ['#FF9A6C', '#FFBD90', '#FFD8B5', '#EEF6FF', '#F8FCFF'],
  morning: ['#2EC8DC', '#4CD6EA', '#7DE4F4', '#B2EFF9', '#DCF8FD', '#F3FCFF'],
  noon: ['#1AB8D0', '#35C8E0', '#65DAEE', '#A5EBF8', '#D5F6FC', '#F0FBFF'],
  evening: ['#3AB5CC', '#58C8DC', '#85DCED', '#B8EFF8', '#DDF7FC'],
  sunset: ['#D9522B', '#F07840', '#F8A870', '#D5EAF5', '#EEF8FC'],
  night: ['#080D1A', '#0C1228', '#141C3C', '#1A2244', '#1E274C'],
};

// ─── Sun arc: left → right, 6 AM – 6 PM ─────────────────────────────────────
const getSunPos = (h, m) => {
  const t = h * 60 + m;
  if (t < 360 || t >= 1080) return null;
  const p = (t - 360) / 720;
  return { x: SW * 0.04 + p * SW * 0.82, y: 85 - Math.sin(p * Math.PI) * 70 };
};

// ─── Moon arc: right → left, 6 PM – 6 AM ────────────────────────────────────
const getMoonPos = (h, m) => {
  const t = h * 60 + m;
  const p = t >= 1080 ? (t - 1080) / 720 : (t + 360) / 720;
  return { x: SW * 0.82 - p * SW * 0.78, y: 75 - Math.sin(p * Math.PI) * 60 };
};

// ─── Stars: size, position, twinkling params ─────────────────────────────────
// r = radius | delay = start delay ms | dur1/dur2 = fade durations | minOp = dim opacity
const STARS = [
  { id: 1, top: 40, left: SW * 0.08, r: 3.0, delay: 0, dur1: 1200, dur2: 900, minOp: 0.15 },
  { id: 2, top: 28, left: SW * 0.20, r: 4.5, delay: 400, dur1: 900, dur2: 1100, minOp: 0.08 },
  { id: 3, top: 55, left: SW * 0.35, r: 2.5, delay: 800, dur1: 1500, dur2: 800, minOp: 0.25 },
  { id: 4, top: 32, left: SW * 0.52, r: 3.5, delay: 200, dur1: 1000, dur2: 1200, minOp: 0.10 },
  { id: 5, top: 48, left: SW * 0.68, r: 2.5, delay: 1000, dur1: 1300, dur2: 950, minOp: 0.20 },
  { id: 6, top: 22, left: SW * 0.83, r: 5.0, delay: 600, dur1: 800, dur2: 1400, minOp: 0.08 },
  { id: 7, top: 75, left: SW * 0.10, r: 2.0, delay: 300, dur1: 1400, dur2: 1000, minOp: 0.20 },
  { id: 8, top: 88, left: SW * 0.25, r: 3.5, delay: 700, dur1: 1100, dur2: 900, minOp: 0.12 },
  { id: 9, top: 70, left: SW * 0.43, r: 2.5, delay: 1200, dur1: 1600, dur2: 800, minOp: 0.25 },
  { id: 10, top: 95, left: SW * 0.60, r: 2.0, delay: 500, dur1: 900, dur2: 1300, minOp: 0.18 },
  { id: 11, top: 62, left: SW * 0.76, r: 4.0, delay: 150, dur1: 1200, dur2: 1000, minOp: 0.08 },
  { id: 12, top: 110, left: SW * 0.90, r: 2.5, delay: 900, dur1: 1000, dur2: 1100, minOp: 0.22 },
  { id: 13, top: 125, left: SW * 0.15, r: 3.0, delay: 450, dur1: 1300, dur2: 900, minOp: 0.15 },
  { id: 14, top: 135, left: SW * 0.33, r: 2.5, delay: 1100, dur1: 1500, dur2: 1200, minOp: 0.12 },
  { id: 15, top: 118, left: SW * 0.50, r: 2.0, delay: 250, dur1: 1000, dur2: 800, minOp: 0.25 },
  { id: 16, top: 100, left: SW * 0.72, r: 3.0, delay: 800, dur1: 900, dur2: 1100, minOp: 0.18 },
  { id: 17, top: 148, left: SW * 0.88, r: 2.5, delay: 350, dur1: 1200, dur2: 1000, minOp: 0.20 },
  { id: 18, top: 160, left: SW * 0.05, r: 2.0, delay: 650, dur1: 1400, dur2: 900, minOp: 0.15 },
  { id: 19, top: 145, left: SW * 0.42, r: 3.5, delay: 950, dur1: 1100, dur2: 1200, minOp: 0.08 },
  { id: 20, top: 170, left: SW * 0.65, r: 2.5, delay: 200, dur1: 1300, dur2: 1000, minOp: 0.20 },
];

// ─────────────────────────────────────────────────────────────────────────────
const MilestoneScreen = ({ navigation }) => {
  const [now, setNow] = useState(new Date());

  // Refresh every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const period = getPeriod(h, m);
  const isNight = period === 'night';
  const sunPos = getSunPos(h, m);
  const moonPos = getMoonPos(h, m);

  // ── Twinkling star animations ─────────────────────────────────────────────
  const starAnims = useRef(STARS.map(() => new Animated.Value(0.8))).current;

  useEffect(() => {
    if (!isNight) return;

    const loops = STARS.map((star, idx) => {
      const anim = starAnims[idx];
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(star.delay),
          Animated.timing(anim, { toValue: 1.0, duration: star.dur1, useNativeDriver: true }),
          Animated.timing(anim, { toValue: star.minOp, duration: star.dur2, useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach(l => l.stop());
  }, [isNight]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* Sky gradient */}
      <LinearGradient
        colors={SKY[period]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Stars — twinkling, night only ── */}
      {isNight && STARS.map((star, idx) => (
        <Animated.View
          key={star.id}
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.r,
            height: star.r,
            borderRadius: star.r / 2,
            backgroundColor: '#FFFFFF',
            opacity: starAnims[idx],
            // Glow for larger stars
            shadowColor: '#FFFFFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: star.r >= 4 ? 0.9 : 0.4,
            shadowRadius: star.r >= 4 ? 4 : 2,
            elevation: star.r >= 4 ? 4 : 1,
          }}
        />
      ))}

      {/* ── Moon + clouds — night only, moves together like sun group ── */}
      {isNight && (
        <View style={[s.moonWrap, { left: moonPos.x, top: moonPos.y }]}>
          <Image source={require('../../assets/milestone/Cloudlight.png')} style={s.moonCloudLight} resizeMode="contain" />
          <Image source={require('../../assets/milestone/Moon.png')} style={s.moon} resizeMode="contain" />
          <Image source={require('../../assets/milestone/Clouddark.png')} style={s.moonCloudDark} resizeMode="contain" />
        </View>
      )}

      {/* ── Sun + clouds — day periods ── */}
      {!isNight && sunPos && (
        <View style={[s.sunWrap, { left: sunPos.x, top: sunPos.y }]}>
          <Image source={require('../../assets/milestone/Cloudlight.png')} style={s.cloudLight} resizeMode="contain" />
          <Image source={require('../../assets/milestone/Sun.png')} style={s.sun} resizeMode="contain" />
          <Image source={require('../../assets/milestone/Clouddark.png')} style={s.cloudDark} resizeMode="contain" />
        </View>
      )}

      {/* ── Ring decorations ── */}
      <Image source={require('../../assets/milestone/ring.png')} style={s.ringLeft} resizeMode="contain" />
      <Image source={require('../../assets/milestone/ring.png')} style={s.ringRight} resizeMode="contain" />

      {/* ── Pattern clusters ── */}
      <Image source={require('../../assets/milestone/Pattern.png')} style={s.patternLeft} resizeMode="contain" />
      <Image source={require('../../assets/milestone/Pattern.png')} style={s.patternRight} resizeMode="contain" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={isNight ? '#FFFFFF' : '#0A7080'} />
          <Text style={[s.headerTitle, { color: isNight ? '#FFFFFF' : '#0A7080' }]}>
            Milestones
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // Moon group (mirrors sunWrap — moves with moonPos)
  moonWrap: {
    position: 'absolute',
    width: 130, height: 120,
    zIndex: 10,
  },
  moon: {
    position: 'absolute',
    width: 90, height: 90,
    right: 15, top: 38,
  },
  moonCloudLight: {
    position: 'absolute',
    width: 60, height: 30,
    left: 25, bottom: 0,
    zIndex: 9,
    opacity: 0.8,
  },
  moonCloudDark: {
    position: 'absolute',
    width: 60, height: 28,
    left: 65, top: 43,
    zIndex: 11,
    opacity: 0.3,
  },

  // Sun group
  sunWrap: {
    position: 'absolute',
    width: 130, height: 120,
    zIndex: 10,
  },
  sun: {
    position: 'absolute',
    width: 90, height: 90,
    right: 15, top: 38,
  },
  cloudLight: {
    position: 'absolute',
    width: 60, height: 30,
    left: 25, bottom: 0,
    zIndex: 9,
  },
  cloudDark: {
    position: 'absolute',
    width: 60, height: 28,
    left: 65, top: 43,
    zIndex: 11,
  },

  // Rings
  ringLeft: {
    position: 'absolute',
    width: 160, height: 160,
    left: -70, top: SH * 0.10,
  },
  ringRight: {
    position: 'absolute',
    width: 150, height: 150,
    right: -65, top: SH * 0.37,
  },

  // Patterns
  patternLeft: {
    position: 'absolute',
    width: 72, height: 58,
    left: SW * 0.04, top: SH * 0.35,
  },
  patternRight: {
    position: 'absolute',
    width: 72, height: 58,
    right: SW * 0.04, top: SH * 0.65,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    zIndex: 20,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
});

export default MilestoneScreen;
