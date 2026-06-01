import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import TimeBasedBackground from '../components/TimeBasedBackground';

const { width: SW, height: SH } = Dimensions.get('window');
const ROAD_H = SH;
const ROAD_W = SW * 0.85;
const W_TOP = ROAD_W * 0.18;
const W_BOTTOM = ROAD_W;

const getRoadWidthAtY = (y) => {
  return W_TOP + (W_BOTTOM - W_TOP) * (y / ROAD_H);
};

const Y_TOP = ROAD_H - 340;
const Y_BOTTOM = ROAD_H - 65;

const wTop = getRoadWidthAtY(Y_TOP);
const wBottom = getRoadWidthAtY(Y_BOTTOM);

const xLeftTop = (ROAD_W - wTop) / 1.65;
const xRightTop = (ROAD_W + wTop) / 2.05;

const xLeftBottom = (ROAD_W - wBottom) / 2;
const xRightBottom = (ROAD_W + wBottom) / 2;

const SvgHex = ({ size, color = '#FFFFFF' }) => {
  const w = size;
  const h = size * 0.9;
  const points = `
    ${w * 0.25},0 
    ${w * 0.75},0 
    ${w},${h * 0.5} 
    ${w * 0.75},${h} 
    ${w * 0.25},${h} 
    0,${h * 0.5}
  `;
  return (
    <Svg width={w} height={h}>
      <Polygon
        points={points}
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const LockedNode = ({ level = 1 }) => {
  const baseSize = 100;
  const w = baseSize;
  const h = baseSize * 0.9;
  
  const hexColor = level === 2 ? '#FFFDF0' : '#FFFFFF';
  const lockColor = level === 2 ? '#FF9800' : '#00BCD4';
  
  return (
    <View
      style={{
        width: w,
        height: h,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: level === 2 ? '#FF9800' : '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: level === 2 ? 0.35 : 0.15,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }}>
        <SvgHex size={baseSize} color={hexColor} />
      </View>
      <Ionicons name="lock-closed" size={baseSize * 0.30} color={lockColor} style={{ zIndex: 2 }} />
      <Text 
        style={{ 
          zIndex: 2, 
          fontSize: 10, 
          fontWeight: 'bold', 
          color: lockColor, 
          marginTop: -2 
        }}
      >
        {level === 2 ? 'L2' : 'L1'}
      </Text>
    </View>
  );
};

const SLOTS = [
  { size: 250, bottomRatio: 0.10 },
  { size: 80,  bottomRatio: 0.38 },
  { size: 68,  bottomRatio: 0.50 },
  { size: 58,  bottomRatio: 0.60 },
  { size: 50,  bottomRatio: 0.68 },
  { size: 43,  bottomRatio: 0.75 },
  { size: 37,  bottomRatio: 0.81 },
  { size: 32,  bottomRatio: 0.86 },
  { size: 28,  bottomRatio: 0.90 },
  { size: 24,  bottomRatio: 0.93 },
  { size: 21,  bottomRatio: 0.95 },
  { size: 18,  bottomRatio: 0.965 },
  { size: 16,  bottomRatio: 0.976 },
  { size: 14,  bottomRatio: 0.985 },
  { size: 12,  bottomRatio: 0.991 },
  { size: 11,  bottomRatio: 0.995 },
  { size: 10,  bottomRatio: 0.998 },
  { size: 9,   bottomRatio: 1.0 },
];

const interpolateSlot = (virtualIndex) => {
  if (virtualIndex <= 0) {
    const slot0 = SLOTS[0];
    return {
      bottom: SH * (slot0.bottomRatio + virtualIndex * 0.3),
      size: slot0.size * (1 + virtualIndex * 0.15),
      opacity: Math.max(0, 1 + virtualIndex),
    };
  }
  
  if (virtualIndex >= SLOTS.length - 1) {
    const lastSlot = SLOTS[SLOTS.length - 1];
    return {
      bottom: SH * (lastSlot.bottomRatio + (virtualIndex - (SLOTS.length - 1)) * 0.05),
      size: Math.max(5, lastSlot.size * Math.max(0.1, 1 - (virtualIndex - (SLOTS.length - 1)) * 0.2)),
      opacity: Math.max(0, 1 - (virtualIndex - (SLOTS.length - 1))),
    };
  }

  const indexL = Math.floor(virtualIndex);
  const indexH = Math.ceil(virtualIndex);
  const t = virtualIndex - indexL;

  const slotL = SLOTS[indexL];
  const slotH = SLOTS[indexH];

  const bottomRatio = slotL.bottomRatio + (slotH.bottomRatio - slotL.bottomRatio) * t;
  const size = slotL.size + (slotH.size - slotL.size) * t;

  return {
    bottom: SH * bottomRatio,
    size: size,
    opacity: 1,
  };
};

const MilestoneScreen = ({ navigation }) => {
  const scrollY = React.useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <TimeBasedBackground>
        {({ isNight }) => (
          <>
            {/* Ring decorations */}
            <Image source={require('../../assets/milestone/ring.png')} style={s.ringLeft} resizeMode="contain" />
            <Image source={require('../../assets/milestone/ring.png')} style={s.ringRight} resizeMode="contain" />

            {/* Pattern clusters */}
            <Image source={require('../../assets/milestone/Pattern.png')} style={s.patternLeft} resizeMode="contain" />
            <Image source={require('../../assets/milestone/Pattern.png')} style={s.patternRight} resizeMode="contain" />

            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={22} color={isNight ? '#FFFFFF' : '#0A7080'} />
                <Text style={[s.headerTitle, { color: isNight ? '#FFFFFF' : '#0A7080' }]}>
                  Milestones
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fixed Road */}
            <Image
              source={require('../../assets/milestone/road.png')}
              style={s.road}
              resizeMode="stretch"
            />

            {/* Tapered Glowing Light Band Effect */}
            <Svg width={ROAD_W} height={ROAD_H} style={[s.road, { zIndex: 2 }]}>
              <Defs>
                <SvgLinearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#3DF3FF" stopOpacity="0" />
                  <Stop offset="25%" stopColor="#3DF3FF" stopOpacity="0.75" />
                  <Stop offset="75%" stopColor="#3DF3FF" stopOpacity="0.75" />
                  <Stop offset="100%" stopColor="#3DF3FF" stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>
              <Polygon
                points={`${xLeftTop},${Y_TOP} ${xRightTop},${Y_TOP} ${xRightBottom},${Y_BOTTOM} ${xLeftBottom},${Y_BOTTOM}`}
                fill="url(#lightGrad)"
              />
            </Svg>

            {/* Scrollable Milestone Nodes */}
            {Array.from({ length: 18 }).map((_, i) => {
              const inputRange = [];
              const outputBottom = [];
              const outputSize = [];
              const outputOpacity = [];

              for (let v = 18; v >= -2; v--) {
                const scrollVal = (i - v) * 120;
                inputRange.push(scrollVal);
                const interpolated = interpolateSlot(v);
                
                // Scale transform scales from center. Base height is 90 (when size is 100).
                // Offset bottom to keep the visual bottom edge aligned with the target ratio.
                const adjustedBottom = i === 0
                  ? interpolated.bottom
                  : interpolated.bottom - 45 + (0.45 * interpolated.size);

                outputBottom.push(adjustedBottom);
                outputSize.push(interpolated.size);
                outputOpacity.push(interpolated.opacity);
              }

              const bottom = scrollY.interpolate({
                inputRange,
                outputRange: outputBottom,
                extrapolate: 'clamp',
              });

              const size = scrollY.interpolate({
                inputRange,
                outputRange: outputSize,
                extrapolate: 'clamp',
              });

              const opacity = scrollY.interpolate({
                inputRange,
                outputRange: outputOpacity,
                extrapolate: 'clamp',
              });

              const left = scrollY.interpolate({
                inputRange,
                outputRange: outputSize.map(s => (SW - s) / 2),
                extrapolate: 'clamp',
              });

              if (i === 0) {
                return (
                  <Animated.Image
                    key={`active-milestone`}
                    source={require('../../assets/milestone/mileStone.png')}
                    style={{
                      position: 'absolute',
                      bottom: bottom,
                      left: left,
                      width: size,
                      height: size,
                      opacity: opacity,
                      zIndex: 30 - i,
                    }}
                    resizeMode="contain"
                  />
                );
              } else {
                const scale = scrollY.interpolate({
                  inputRange,
                  outputRange: outputSize.map(s => s / 100),
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={`locked-node-${i}`}
                    style={{
                      position: 'absolute',
                      bottom: bottom,
                      left: SW / 2 - 50,
                      width: 100,
                      height: 90,
                      transform: [{ scale: scale }],
                      opacity: opacity,
                      zIndex: 30 - i,
                    }}
                  >
                    <LockedNode level={i >= 11 ? 2 : 1} />
                  </Animated.View>
                );
              }
            })}

            {/* Dashed center line scrolling in sync */}
            {Array.from({ length: 36 }).map((_, i) => {
              const dashBottom = scrollY.interpolate({
                inputRange: [0, 5000],
                outputRange: [35 + i * 120, 35 + i * 120 - 5000],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={`dash-${i}`}
                  style={[
                    s.dash,
                    {
                      position: 'absolute',
                      bottom: dashBottom,
                      height: 48,
                      width: 6,
                      left: SW / 2 - 3,
                      backgroundColor: '#D9D9D9',
                      borderRadius: 0,
                      opacity: 1,
                      zIndex: 3,
                    },
                  ]}
                />
              );
            })}

            {/* Scroll track overlay */}
            <Animated.ScrollView
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
              }}
              contentContainerStyle={{ height: SH + 1200 }}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
            >
              {/* spacer content */}
            </Animated.ScrollView>
          </>
        )}
      </TimeBasedBackground>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },



  road: {
    position: 'absolute',
    bottom: 0,
    width: SW * 0.85,
    left: (SW - SW * 0.85) / 2,
    height: ROAD_H,
    zIndex: 1,
  },

  dash: {
    position: 'absolute',
    left: SW / 2 - 2,
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    zIndex: 3,
  },

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

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    zIndex: 100,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
});

export default MilestoneScreen;
