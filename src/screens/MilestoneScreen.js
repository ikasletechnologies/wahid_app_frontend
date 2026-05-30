import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Small diamond grid decoration ─────────────────────────────────────────────
const DiamondCluster = ({ rows = 4, cols = 4, size = 6, gap = 10, opacity = 0.28, style }) => (
  <View style={[{ position: 'absolute' }, style]}>
    {Array.from({ length: rows }).map((_, r) => (
      <View key={r} style={{ flexDirection: 'row', marginBottom: gap * 0.45 }}>
        {Array.from({ length: cols }).map((_, c) => (
          <View
            key={c}
            style={{
              width: size,
              height: size,
              backgroundColor: `rgba(0,155,178,${opacity})`,
              transform: [{ rotate: '45deg' }],
              marginRight: c < cols - 1 ? gap : 0,
            }}
          />
        ))}
      </View>
    ))}
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────
const MilestoneScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Sky gradient: medium cyan → near-white ── */}
      <LinearGradient
        colors={['#2EC8DC', '#4CD6EA', '#7DE4F4', '#B2EFF9', '#DCF8FD', '#F3FCFF']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Decorative rings (partially off-screen) ── */}
      <View style={s.ringLeft} />
      <View style={s.ringRight} />

      {/* ── Diamond clusters ── */}
      <DiamondCluster style={{ left: SW * 0.04, top: SH * 0.34 }} />
      <DiamondCluster style={{ right: SW * 0.05, top: SH * 0.60 }} />
      <DiamondCluster style={{ left: SW * 0.28, top: SH * 0.70 }} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#0A7080" />
          <Text style={s.headerTitle}>Milestones</Text>
        </TouchableOpacity>
      </View>

      {/* ── Sun + clouds (upper-right, overlaps header) ── */}
      <View style={s.sunWrap}>
        {/* soft yellow halo */}
        <View style={s.sunGlow} />
        {/* sun circle */}
        <LinearGradient
          colors={['#FFF176', '#FFCC00', '#FFA000']}
          style={s.sun}
        />
        {/* main cloud — left side of sun */}
        <Image
          source={require('../../assets/milestone/cloud_top.png')}
          style={s.cloudLeft}
          resizeMode="contain"
        />
        {/* secondary cloud — below-left */}
        <Image
          source={require('../../assets/milestone/cloud_bottom.png')}
          style={s.cloudBelow}
          resizeMode="contain"
        />
      </View>

      {/* ── Canvas (build milestone content here next) ── */}
      <View style={s.canvas} />

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },

  // ── Decorative rings ──
  ringLeft: {
    position: 'absolute',
    left: -SW * 0.40,
    top: SH * 0.06,
    width: SW * 0.75,
    height: SW * 0.75,
    borderRadius: SW * 0.375,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  ringRight: {
    position: 'absolute',
    right: -SW * 0.40,
    top: SH * 0.37,
    width: SW * 0.75,
    height: SW * 0.75,
    borderRadius: SW * 0.375,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 50,
  },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0A7080' },

  // ── Sun ──
  sunWrap: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  sunGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,215,0,0.14)',
  },
  sun: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    elevation: 12,
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  cloudLeft: {
    position: 'absolute',
    left: -36,
    top: 26,
    width: 78,
    height: 40,
    opacity: 0.97,
  },
  cloudBelow: {
    position: 'absolute',
    left: 2,
    top: 58,
    width: 62,
    height: 32,
    opacity: 0.90,
  },

  // ── Future content canvas ──
  canvas: { flex: 1 },
});

export default MilestoneScreen;
