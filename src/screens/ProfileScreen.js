import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNames } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';
import ConfirmDialog from '../components/ConfirmDialog';

const ProfileScreen = () => {
  const { user, updateProfile, logout } = useAuth();
  const { learnedIds, masteredIds, streak } = useNames();
  const { colors, isDark, toggleTheme } = useAppTheme();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  // Build initials avatar from user name
  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const result = await updateProfile({ name: editName.trim() });
    setSaving(false);
    if (result.success) {
      setEditing(false);
    } else {
      Alert.alert('Error', result.message || 'Could not update profile.');
    }
  };

  const handleLogout = () => setShowSignOut(true);

  const stats = [
    { label: 'LEARNED', value: learnedIds.length, color: '#2d9c96', icon: 'book-outline' },
    { label: 'MASTERED', value: masteredIds.length, color: '#c9a84c', icon: 'trophy-outline' },
    { label: 'DAY STREAK', value: streak, color: '#f59e0b', icon: 'flame-outline' },
  ];

  const progress = Math.round((learnedIds.length / 99) * 100);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </View>

        {/* ── Avatar + Name ── */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={['#2d9c96', '#1a5e5b']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>

          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={[styles.nameInput, { color: colors.text, backgroundColor: colors.glass, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={colors.textDimmed}
                autoFocus
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.black} />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setEditing(false); setEditName(user?.name || ''); }}
              >
                <Ionicons name="close" size={18} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editIcon}>
                <Ionicons name="pencil-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || ''}</Text>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
              <Ionicons name={s.icon} size={18} color={s.color} style={{ marginBottom: 6 }} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Overall Progress ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>OVERALL JOURNEY</Text>
          <View style={[styles.progressCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <View style={styles.progressTop}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                {learnedIds.length} of 99 Names Learned
              </Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>{progress}%</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.borderStrong }]}>
              <LinearGradient
                colors={['#2d9c96', '#c9a84c']}
                style={[styles.progressFill, { width: `${progress}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressSub}>
              {99 - learnedIds.length} names remaining to complete your journey
            </Text>
          </View>
        </View>

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SETTINGS</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <SettingRow
              colors={colors}
              icon="person-outline"
              label="Edit Name"
              onPress={() => setEditing(true)}
            />
            <View style={[styles.divider, { backgroundColor: colors.borderStrong }]} />
            <SettingRow
              colors={colors}
              icon="notifications-outline"
              label="Daily Reminders"
              note="Coming soon"
            />
            <View style={[styles.divider, { backgroundColor: colors.borderStrong }]} />
            <SettingRow
              colors={colors}
              icon={isDark ? "moon-outline" : "sunny-outline"}
              label={isDark ? "Dark Mode" : "Light Mode"}
              note="Toggle Theme"
              onPress={toggleTheme}
            />
            <View style={[styles.divider, { backgroundColor: colors.borderStrong }]} />
            <SettingRow
              colors={colors}
              icon="language-outline"
              label="Arabic Script"
              note="Enabled"
            />
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.glass, borderColor: colors.border }]}>
            <SettingRow
              colors={colors}
              icon="shield-checkmark-outline"
              label="Privacy Policy"
            />
            <View style={[styles.divider, { backgroundColor: colors.borderStrong }]} />
            <SettingRow
              colors={colors}
              icon="information-circle-outline"
              label="About Wahid"
              note="v1.0.0"
            />
          </View>
        </View>

        {/* ── Sign Out Card ── */}
        <TouchableOpacity
          style={styles.signOutCard}
          onPress={handleLogout}
          activeOpacity={0.75}
        >
          <View style={styles.signOutInner}>
            <View style={styles.signOutIconWrap}>
              <Ionicons name="log-out-outline" size={18} color="#ff6b6b" />
            </View>
            <Text style={styles.signOutLabel}>Sign Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,107,107,0.4)" />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sign Out Confirmation ── */}
      <ConfirmDialog
        visible={showSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        icon="log-out-outline"
        iconColor="#ff6b6b"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        confirmColor="#ff6b6b"
        onConfirm={() => { setShowSignOut(false); logout(); }}
        onCancel={() => setShowSignOut(false)}
      />
    </SafeAreaView>
  );
};

const SettingRow = ({ icon, label, note, onPress, colors }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress}>
    <View style={styles.settingLeft}>
      <View style={[styles.settingIconWrap, { backgroundColor: colors.border }]}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
    </View>
    <View style={styles.settingRight}>
      {note && <Text style={[styles.settingNote, { color: colors.textMuted }]}>{note}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={14} color={colors.textDimmed} />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scrollContent: {
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.md,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.xl,
  },
  headerTitle: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
    letterSpacing: -0.5,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // ── Avatar ──
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACE.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACE.md,
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.xl,
    letterSpacing: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  userName: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
    lineHeight: 24,
  },
  editIcon: {
    padding: 4,
    marginLeft: 4,
    marginTop: 2, // Slight push down to visually align with text baseline
  },
  userEmail: {
    color: COLORS.muted,
    fontSize: SIZES.sm,
    marginTop: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nameInput: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: '#c9a84c',
    paddingVertical: 4,
    minWidth: 140,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#c9a84c',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.xs,
    minWidth: 50,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cancelBtn: {
    padding: 6,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACE.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Progress ──
  section: {
    marginBottom: SPACE.xl,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: SPACE.md,
  },
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.sm,
  },
  progressLabel: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
  },
  progressPct: {
    color: '#c9a84c',
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
  },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACE.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSub: {
    color: COLORS.muted,
    fontSize: 11,
  },

  // ── Settings ──
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingNote: {
    color: COLORS.muted,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: SPACE.md,
  },

  // ── Sign Out ──
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 80, 80, 0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.md,
    marginBottom: SPACE.xl,
  },
  signOutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  signOutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutLabel: {
    color: '#ff6b6b',
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    letterSpacing: 0.3,
  },
});

export default ProfileScreen;
