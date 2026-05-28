import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';

const { width: SW, height: SH } = Dimensions.get('window');

const MILESTONES = [
  { id: 1, label: 'FIRST STEP',  subtitle: '1 Learned Name',   required: 1  },
  { id: 2, label: 'BEGINNER',    subtitle: '5 Learned Names',  required: 5  },
  { id: 3, label: 'EXPLORER',    subtitle: '10 Learned Names', required: 10 },
  { id: 4, label: 'SEEKER',      subtitle: '20 Learned Names', required: 20 },
  { id: 5, label: 'DEVOTED',     subtitle: '30 Learned Names', required: 30 },
  { id: 6, label: 'SCHOLAR',     subtitle: '50 Learned Names', required: 50 },
  { id: 7, label: 'MASTER',      subtitle: '75 Learned Names', required: 75 },
  { id: 8, label: 'ENLIGHTENED', subtitle: 'All 99 Names',     required: 99 },
];

// Sizes bottom→top
const NODE_SIZES = [88, 70, 62, 55, 49, 44, 39, 34];
// Y from bottom of road area
const NODE_Y     = [22, 118, 202, 276, 344, 403, 456, 504];

const ROAD_H = SH * 0.82;
const DASHES = Array.from({ length: 26 }, (_, i) => i);

// Road edge border lines geometry
const LINE_LEN = Math.sqrt(Math.pow(SW / 2, 2) + Math.pow(ROAD_H, 2));
const EDGE_T   = 3;
const ANG_L    = Math.atan2(-ROAD_H, SW / 2)  * (180 / Math.PI);  // left edge angle
const ANG_R    = Math.atan2(-ROAD_H, -SW / 2) * (180 / Math.PI);  // right edge angle

// ─── Flat-top hexagon ─────────────────────────────────────────────────────────
const Hex = ({ size, color, children }) => {
  const tri = Math.round(size * 0.27);
  const mid = Math.round(size * 0.46);
  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: size / 2, borderRightWidth: size / 2,
        borderBottomWidth: tri,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
      }} />
      <View style={{ width: size, height: mid, backgroundColor: color,
        justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </View>
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: size / 2, borderRightWidth: size / 2,
        borderTopWidth: tri,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: color,
      }} />
    </View>
  );
};

// ─── Locked node ─────────────────────────────────────────────────────────────
const LockedNode = ({ size }) => (
  <View style={{
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  }}>
    <Hex size={size} color="#DFF0F4">
      <Ionicons name="lock-closed" size={size * 0.28} color="#8BBAC4" />
    </Hex>
  </View>
);

// ─── First Step / unlocked node ───────────────────────────────────────────────
const UnlockedNode = ({ size, label, subtitle }) => {
  const outerSize = size + 16;
  const triO = Math.round(outerSize * 0.27);
  const midO = Math.round(outerSize * 0.46);
  const totalOuter = triO * 2 + midO;
  const triI  = Math.round(size * 0.27);
  const midI  = Math.round(size * 0.46);
  const totalInner = triI * 2 + midI;
  const topOff = (totalOuter - totalInner) / 2;

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Outer teal wreath hex */}
      <View style={{ width: outerSize, alignItems: 'center' }}>
        <Hex size={outerSize} color="#03B7CE" />

        {/* Gold dot accents at 6 vertices */}
        {[0,1,2,3,4,5].map(i => {
          const angle = (i * 60 - 30) * (Math.PI / 180);
          const r = outerSize * 0.50;
          const cx = outerSize / 2 + r * Math.cos(angle) - 5;
          const cy = totalOuter  / 2 + r * Math.sin(angle) - 5;
          return (
            <View key={i} style={{
              position: 'absolute', top: cy, left: cx,
              width: 9, height: 9, borderRadius: 5,
              backgroundColor: '#F5C842',
              borderWidth: 1.5, borderColor: '#fff',
            }} />
          );
        })}

        {/* Inner white hex */}
        <View style={{
          position: 'absolute', top: topOff,
          width: outerSize, alignItems: 'center',
        }}>
          <Hex size={size} color="#FFFFFF">
            <View style={{ alignItems: 'center', paddingHorizontal: 4 }}>
              <Text style={[styles.unlockedLabel, { fontSize: size * 0.115 }]}>{label}</Text>
              <Text style={[styles.unlockedSub,   { fontSize: size * 0.088 }]}>{subtitle}</Text>
            </View>
          </Hex>
        </View>
      </View>

      {/* Gold ribbon */}
      <LinearGradient
        colors={['#F5C842', '#E8A800', '#F5C842']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.goldBanner}
      >
        <Text style={styles.goldBannerText}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const MilestoneScreen = ({ navigation }) => {
  const { learnedIds } = useNames();
  const learnedCount = learnedIds?.length ?? 0;
  const isUnlocked = (req) => learnedCount >= req;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* Sky gradient background */}
      <LinearGradient
        colors={['#A8E6F0', '#70D0E8', '#42BDD6', '#2AAEC8']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
          <Text style={styles.headerTitle}>Milestones</Text>
        </TouchableOpacity>
      </View>

      {/* Entire road + nodes layer */}
      <View style={styles.arena}>

        {/* Sun */}
        <View style={styles.sunWrap}>
          <LinearGradient colors={['#FFE566', '#FFA500']} style={styles.sunGrad} />
          {/* Cloud next to sun */}
          <Image source={require('../../assets/cloudTop.png')}
            style={styles.sunCloud} resizeMode="contain" />
        </View>

        {/* Side clouds */}
        <Image source={require('../../assets/cloudTop.png')}
          style={styles.cloudL1} resizeMode="contain" />
        <Image source={require('../../assets/cloudTop.png')}
          style={styles.cloudR1} resizeMode="contain" />
        <Image source={require('../../assets/Cloudbottom.png')}
          style={styles.cloudL2} resizeMode="contain" />
        <Image source={require('../../assets/Cloudbottom.png')}
          style={styles.cloudR2} resizeMode="contain" />

        {/* ── Road: dark teal upward triangle ── */}
        <View style={styles.road} />

        {/* ── Road edge border lines ── */}
        <View style={styles.roadEdgeLeft} />
        <View style={styles.roadEdgeRight} />

        {/* ── Dashed center line ── */}
        {DASHES.map(i => (
          <View key={i} style={[styles.dash, {
            bottom: 30 + i * (ROAD_H / DASHES.length),
          }]} />
        ))}

        {/* ── Milestone nodes ── */}
        {MILESTONES.map((m, i) => (
          <View key={m.id} style={[styles.nodeWrap, { bottom: NODE_Y[i], zIndex: 20 - i }]}>
            {isUnlocked(m.required)
              ? <UnlockedNode size={NODE_SIZES[i]} label={m.label} subtitle={m.subtitle} />
              : <LockedNode size={NODE_SIZES[i]} />}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 50,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  arena: {
    flex: 1,
  },

  // ── Sun ──────────────────────────────────────────────────────────────────
  sunWrap: {
    position: 'absolute',
    top: 8,
    right: 20,
    zIndex: 10,
    alignItems: 'center',
  },
  sunGrad: {
    width: 62,
    height: 62,
    borderRadius: 31,
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },
  sunCloud: {
    position: 'absolute',
    right: 38,
    top: 14,
    width: 55,
    height: 30,
    opacity: 0.9,
  },

  // ── Clouds ───────────────────────────────────────────────────────────────
  cloudL1: {
    position: 'absolute', top: 80, left: -16,
    width: 110, height: 55, opacity: 0.65, zIndex: 5,
  },
  cloudR1: {
    position: 'absolute', top: 115, right: -12,
    width: 95, height: 48, opacity: 0.55, zIndex: 5,
    transform: [{ scaleX: -1 }],
  },
  cloudL2: {
    position: 'absolute', bottom: 200, left: -22,
    width: 105, height: 52, opacity: 0.45, zIndex: 5,
  },
  cloudR2: {
    position: 'absolute', bottom: 140, right: -22,
    width: 105, height: 52, opacity: 0.45, zIndex: 5,
    transform: [{ scaleX: -1 }],
  },

  // ── Road triangle ─────────────────────────────────────────────────────────
  // Upward-pointing triangle: base=SW at the bottom, apex at ROAD_H up
  road: {
    position: 'absolute',
    bottom: 0,
    left: SW / 2,          // horizontal center
    width: 0,
    height: 0,
    borderLeftWidth:   SW / 2,
    borderRightWidth:  SW / 2,
    borderBottomWidth: ROAD_H,
    borderLeftColor:   'transparent',
    borderRightColor:  'transparent',
    borderBottomColor: '#0BAFC4',
    zIndex: 1,
  },

  // ── Road edge border lines ────────────────────────────────────────────────
  roadEdgeLeft: {
    position: 'absolute',
    left: SW / 4 - LINE_LEN / 2,
    bottom: ROAD_H / 2 - EDGE_T / 2,
    width: LINE_LEN,
    height: EDGE_T,
    borderRadius: EDGE_T / 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: `${ANG_L}deg` }],
    zIndex: 3,
  },
  roadEdgeRight: {
    position: 'absolute',
    left: (3 * SW) / 4 - LINE_LEN / 2,
    bottom: ROAD_H / 2 - EDGE_T / 2,
    width: LINE_LEN,
    height: EDGE_T,
    borderRadius: EDGE_T / 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: `${ANG_R}deg` }],
    zIndex: 3,
  },

  // ── Dashed center line ────────────────────────────────────────────────────
  dash: {
    position: 'absolute',
    left: SW / 2 - 2,
    width: 4,
    height: 11,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 2,
  },

  // ── Node wrapper ─────────────────────────────────────────────────────────
  nodeWrap: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
  },

  // ── Unlocked node text ────────────────────────────────────────────────────
  unlockedLabel: {
    fontWeight: 'bold',
    color: '#0BAFC4',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  unlockedSub: {
    color: '#777',
    textAlign: 'center',
    marginTop: 1,
  },

  // ── Gold ribbon ───────────────────────────────────────────────────────────
  goldBanner: {
    marginTop: 3,
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: 'center',
    shadowColor: '#D4A000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  goldBannerText: {
    color: '#6B4200',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});

export default MilestoneScreen;
