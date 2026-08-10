/**
 * AdminDashboard — entry screen for the admin section.
 *
 * Accessible only when user.isAdmin === true (set by backend on login).
 * Accessed via Profile → "Admin Panel" button (add that button yourself once
 * backend returns isAdmin on the user object).
 *
 * From here admin can:
 *   • Manage content cards  (Did You Know / Media / Advertisement)
 *   • Manage app config     (app name, ad frequency, etc.)
 *   • View basic stats
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { FONTS, SIZES, SPACE, RADIUS } from '../../theme';

const GOLD = '#c9a84c';

const ACTION_TILES = [
  {
    id: 'content',
    label: 'Content Cards',
    sub: 'Did You Know · Media · Ads',
    icon: 'layers-outline',
    color: GOLD,
    screen: 'AdminContentManager',
  },
  {
    id: 'config',
    label: 'App Settings',
    sub: 'Name, ad frequency, features',
    icon: 'settings-outline',
    color: '#0ea5e9',
    screen: 'AdminAppConfig',
  },
  {
    id: 'users',
    label: 'Users',
    sub: 'View registered accounts',
    icon: 'people-outline',
    color: '#10b981',
    screen: 'AdminUsers',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    sub: 'Engagement & progress stats',
    icon: 'bar-chart-outline',
    color: '#8b5cf6',
    screen: 'AdminAnalytics',
  },
];

const AdminDashboard = ({ navigation }) => {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.title, { color: GOLD }]}>Admin Panel</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>Manage your app content</Text>
          </View>
        </View>

        {/* Action tiles */}
        <View style={styles.grid}>
          {ACTION_TILES.map(tile => (
            <TouchableOpacity
              key={tile.id}
              style={[styles.tile, { borderColor: tile.color + '30', backgroundColor: colors.glass }]}
              onPress={() => navigation.navigate(tile.screen)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[tile.color + '10', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={[styles.tileIcon, { backgroundColor: tile.color + '20' }]}>
                <Ionicons name={tile.icon} size={22} color={tile.color} />
              </View>
              <Text style={[styles.tileLabel, { color: colors.text }]}>{tile.label}</Text>
              <Text style={[styles.tileSub, { color: colors.textMuted }]}>{tile.sub}</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textDimmed}
                style={styles.tileArrow}
              />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: SPACE.md, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    marginBottom: SPACE.lg,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
  },
  sub: {
    fontSize: SIZES.xs,
    marginTop: 2,
    letterSpacing: 0.4,
  },

  grid: { gap: SPACE.sm },

  tile: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE.md,
    overflow: 'hidden',
    position: 'relative',
  },
  tileIcon: {
    width: 44, height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACE.sm,
  },
  tileLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    marginBottom: 3,
  },
  tileSub: {
    fontSize: SIZES.xs,
    lineHeight: 18,
  },
  tileArrow: {
    position: 'absolute',
    right: SPACE.md,
    top: SPACE.md,
  },
});

export default AdminDashboard;
