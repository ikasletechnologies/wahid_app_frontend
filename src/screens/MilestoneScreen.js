import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
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

const Y_TOP = ROAD_H - 320;
const Y_BOTTOM = ROAD_H - 65;

const wTop = getRoadWidthAtY(Y_TOP);
const wBottom = getRoadWidthAtY(Y_BOTTOM);

const xLeftTop = (ROAD_W - wTop) / 1.65;
const xRightTop = (ROAD_W + wTop) / 2.05;

const xLeftBottom = (ROAD_W - wBottom) / 2;
const xRightBottom = (ROAD_W + wBottom) / 2;

const MilestoneScreen = ({ navigation }) => {


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

            {/* Fixed Dashed center line */}
            {Array.from({ length: 9 }).map((_, i) => (
              <View
                key={`dash-${i}`}
                style={[
                  s.dash,
                  {
                    bottom: 35 + i * 120,
                    height: 48,
                    width: 6,
                    left: SW / 2 - 3,
                    backgroundColor: '#D9D9D9',
                    borderRadius: 0,
                    opacity: 1,
                  },
                ]}
              />
            ))}
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
