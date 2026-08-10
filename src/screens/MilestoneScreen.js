import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import Text from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Polygon, Circle, Defs,
  LinearGradient as SvgLinearGradient, Stop,
} from 'react-native-svg';

import TimeBasedBackground from '../components/TimeBasedBackground';
import { useMilestones } from '../context/MilestoneContext';

const { width: SW, height: SH } = Dimensions.get('window');
const ROAD_H = SH;
const ROAD_W = SW * 0.85;
const W_TOP = ROAD_W * 0.18;
const W_BOTTOM = ROAD_W;

const getRoadWidthAtY = y => W_TOP + (W_BOTTOM - W_TOP) * (y / ROAD_H);

const Y_TOP = ROAD_H - 340;
const Y_BOTTOM = ROAD_H - 65;
const wTop = getRoadWidthAtY(Y_TOP);
const wBottom = getRoadWidthAtY(Y_BOTTOM);
const xLeftTop = (ROAD_W - wTop) / 1.65;
const xRightTop = (ROAD_W + wTop) / 2.05;
const xLeftBottom = (ROAD_W - wBottom) / 2;
const xRightBottom = (ROAD_W + wBottom) / 2;

// Stone images — one per milestone (index 0 = milestone 1)
const STONE_IMAGES = [
  require('../../assets/milestone/Stone/Stone1.png'),
  require('../../assets/milestone/Stone/Stone2.png'),
  require('../../assets/milestone/Stone/Stone3.png'),
  require('../../assets/milestone/Stone/Stone4.png'),
  require('../../assets/milestone/Stone/Stone5.png'),
  require('../../assets/milestone/Stone/Stone6.png'),
  require('../../assets/milestone/Stone/Stone7.png'),
];


// 7 perspective slots — bottom (large/close) → top (small/distant)
const SLOTS = [
  { size: 180, bottomRatio: 0.12 }, // Increased from 0.02 to give more bottom space
  { size: 108, bottomRatio: 0.42 }, // Pushed second stone further up to keep a large gap
  { size: 76, bottomRatio: 0.58 },
  { size: 56, bottomRatio: 0.70 },
  { size: 42, bottomRatio: 0.79 },
  { size: 31, bottomRatio: 0.86 },
  { size: 23, bottomRatio: 0.92 },
];
const N_NODES = SLOTS.length;

const interpolateSlot = (virtualIndex) => {
  if (virtualIndex <= 0) {
    const s = SLOTS[0];
    return {
      bottom: SH * (s.bottomRatio + virtualIndex * 0.28),
      size: s.size * (1 + virtualIndex * 0.15),
      opacity: Math.max(0, 1 + virtualIndex),
    };
  }
  if (virtualIndex >= N_NODES - 1) {
    const s = SLOTS[N_NODES - 1];
    return {
      bottom: SH * (s.bottomRatio + (virtualIndex - (N_NODES - 1)) * 0.05),
      size: Math.max(4, s.size * Math.max(0.1, 1 - (virtualIndex - (N_NODES - 1)) * 0.2)),
      opacity: Math.max(0, 1 - (virtualIndex - (N_NODES - 1))),
    };
  }
  const lo = Math.floor(virtualIndex);
  const hi = Math.ceil(virtualIndex);
  const t = virtualIndex - lo;
  return {
    bottom: SH * (SLOTS[lo].bottomRatio + (SLOTS[hi].bottomRatio - SLOTS[lo].bottomRatio) * t),
    size: SLOTS[lo].size + (SLOTS[hi].size - SLOTS[lo].size) * t,
    opacity: 1,
  };
};

// Hexagon SVG shape
const SvgHex = ({ size, color = '#FFFFFF' }) => {
  const w = size, h = size * 0.9;
  const pts = `${w * .25},0 ${w * .75},0 ${w},${h * .5} ${w * .75},${h} ${w * .25},${h} 0,${h * .5}`;
  return (
    <Svg width={w} height={h}>
      <Polygon points={pts} fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round" />
    </Svg>
  );
};

// Locked milestone node
const LockedNode = ({ milestoneId, isNight }) => {
  const baseSize = 100;
  const w = baseSize, h = baseSize * 0.9;
  const tier = milestoneId > 4 ? 2 : 1;
  const hexColor = isNight ? '#1E293B' : (tier === 2 ? '#FFFDF0' : '#FFFFFF');
  const lockColor = isNight ? (tier === 2 ? '#FFA726' : '#00ADC1') : (tier === 2 ? '#FF9800' : '#00BCD4');
  return (
    <View style={{
      width: w, height: h, justifyContent: 'center', alignItems: 'center',
      shadowColor: lockColor, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 6, elevation: 4
    }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: w, height: h }}>
        <SvgHex size={baseSize} color={hexColor} />
      </View>
      <Ionicons name="lock-closed" size={baseSize * 0.28} color={lockColor} style={{ zIndex: 2 }} />
      <Text style={{ zIndex: 2, fontSize: 9, fontWeight: 'bold', color: lockColor, marginTop: -2 }}>
        {`M${milestoneId}`}
      </Text>
    </View>
  );
};

// Progress ring overlaid on the active milestone stone
const ProgressRing = ({ progress, size }) => {
  const r = size * 0.35;
  const cx = size / 2;
  const cy = (size / 2) + (size * 0.05); // shifted downward by 5%
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, Math.max(0, progress));
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
      <Circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={4} fill="none" />
      <Circle
        cx={cx} cy={cy} r={r}
        stroke="#3DF3FF" strokeWidth={4} fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        rotation={-90} origin={`${cx},${cy}`}
      />
    </Svg>
  );
};

const MilestoneScreen = ({ navigation }) => {
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { milestones, allCompleted } = useMilestones();

  const extendedMilestones = React.useMemo(() => {
    const arr = [...milestones];
    // Add extra locked milestones to make the road appear endless
    const targetLength = Math.max(milestones.length + 15, 25);
    for (let i = milestones.length; i < targetLength; i++) {
      arr.push({ id: i + 1, status: 'locked' });
    }
    return arr;
  }, [milestones]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <TimeBasedBackground>
        {({ isNight }) => (
          <>
            <Image source={require('../../assets/milestone/ring.png')} style={[s.ringLeft, isNight && { opacity: 0.15 }]} resizeMode="contain" />
            <Image source={require('../../assets/milestone/ring.png')} style={[s.ringRight, isNight && { opacity: 0.15 }]} resizeMode="contain" />
            <Image source={require('../../assets/milestone/Pattern.png')} style={[s.patternLeft, isNight && { opacity: 0.15 }]} resizeMode="contain" />
            <Image source={require('../../assets/milestone/Pattern.png')} style={[s.patternRight, isNight && { opacity: 0.15 }]} resizeMode="contain" />

            {/* Header */}
            <View style={[s.header, { justifyContent: 'flex-end' }]}>
              {allCompleted && (
                <View style={s.allDoneBadge}>
                  <Ionicons name="trophy" size={14} color="#FFD700" />
                  <Text style={s.allDoneText}>All Complete!</Text>
                </View>
              )}
            </View>

            {/* Road */}
            <Image source={require('../../assets/milestone/road.png')} style={[s.road, isNight && { opacity: 0.4 }]} resizeMode="stretch" />

            {/* Tapered glow band */}
            {/* <Svg width={ROAD_W} height={ROAD_H} style={[s.road, { zIndex: 2 }]}>
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
            </Svg> */}

            {/* Milestone nodes */}
            {extendedMilestones.map((milestone, i) => {
              const inputRange = [];
              const outTranslateY = [];
              const outSize = [];
              const outOpacity = [];

              for (let v = N_NODES; v >= -2; v--) {
                const scrollVal = (i - v) * 120;
                inputRange.push(scrollVal);
                const interp = interpolateSlot(v);
                const adjBottom = interp.bottom - 35 + 0.18 * interp.size;
                outSize.push(interp.size);
                outOpacity.push(interp.opacity);
                outTranslateY.push(50 - adjBottom - interp.size / 2);
              }

              const translateY = scrollY.interpolate({ inputRange, outputRange: outTranslateY, extrapolate: 'clamp' });
              const scale = scrollY.interpolate({ inputRange, outputRange: outSize.map(sz => sz / 100), extrapolate: 'clamp' });
              const opacity = scrollY.interpolate({ inputRange, outputRange: outOpacity, extrapolate: 'clamp' });

              const { status } = milestone;

              if (status === 'completed') {
                return (
                  <Animated.Image
                    key={`stone-${i}`}
                    source={STONE_IMAGES[i]}
                    style={{ position: 'absolute', bottom: 0, left: (SW - 100) / 2, width: 100, height: 100, transform: [{ translateY }, { scale }], opacity, zIndex: 30 - i }}
                    resizeMode="contain"
                  />
                );
              }


              // locked
              return (
                <Animated.View
                  key={`locked-${i}`}
                  style={{
                    position: 'absolute', bottom: 0, left: (SW - 100) / 2,
                    width: 100, height: 100,
                    justifyContent: 'center', alignItems: 'center',
                    transform: [{ translateY }, { scale }],
                    opacity, zIndex: 30 - i,
                  }}
                >
                  <LockedNode milestoneId={milestone.id} isNight={isNight} />
                </Animated.View>
              );
            })}

            {/* Dashed center line — static */}
            {Array.from({ length: 14 }).map((_, i) => (
              <View
                key={`dash-${i}`}
                style={[s.dash, { position: 'absolute', bottom: 35 + i * 120, zIndex: 3, backgroundColor: isNight ? '#334155' : '#D9D9D9' }]}
              />
            ))}



            {/* Scroll track overlay */}
            <Animated.ScrollView
              style={[s.scrollOverlay, { transform: [{ scaleY: -1 }] }]}
              contentContainerStyle={{ height: SH + 900 }}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )}
              scrollEventThrottle={16}
            />
          </>
        )}
      </TimeBasedBackground>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },

  road: {
    position: 'absolute', bottom: 0,
    width: SW * 0.85,
    left: (SW - SW * 0.85) / 2,
    height: ROAD_H, zIndex: 1,
  },

  dash: {
    left: SW / 2 - 3, width: 6, height: 48,
    backgroundColor: '#D9D9D9', borderRadius: 0, opacity: 1,
  },

  ringLeft: { position: 'absolute', width: 160, height: 160, left: -70, top: SH * 0.10 },
  ringRight: { position: 'absolute', width: 150, height: 150, right: -65, top: SH * 0.37 },
  patternLeft: { position: 'absolute', width: 72, height: 58, left: SW * 0.04, top: SH * 0.35 },
  patternRight: { position: 'absolute', width: 72, height: 58, right: SW * 0.04, top: SH * 0.65 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, zIndex: 100,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },

  allDoneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  allDoneText: { color: '#FFD700', fontWeight: '700', fontSize: 13 },

  progressStrip: {
    position: 'absolute', bottom: 20, alignSelf: 'center',
    flexDirection: 'row', gap: 8, zIndex: 100,
  },
  progressDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotDone: { backgroundColor: '#3DF3FF' },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    width: 20, borderRadius: 4,
  },

  scrollOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50,
  },
});

export default MilestoneScreen;
