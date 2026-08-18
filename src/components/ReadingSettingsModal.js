import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, THEME_MODES } from '../context/ThemeContext';
import { useFontSettings, FONT_FAMILIES, FONT_SIZES, ARABIC_STYLES } from '../context/FontSettingsContext';
import { FONTS } from '../theme';

const { width: SW } = Dimensions.get('window');
const rs = (n) => Math.round(n * (SW / 393));

const FONT_SIZE_KEYS = ['small', 'medium', 'large', 'extralarge'];

const CustomTextSizeSlider = ({ currentSizeKey, onSizeChange, isDark }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = FONT_SIZE_KEYS.indexOf(currentSizeKey) >= 0 ? FONT_SIZE_KEYS.indexOf(currentSizeKey) : 1;
  const thumbAnim = useRef(new Animated.Value(activeIndex / (FONT_SIZE_KEYS.length - 1))).current;

  useEffect(() => {
    const idx = FONT_SIZE_KEYS.indexOf(currentSizeKey);
    const target = (idx >= 0 ? idx : 1) / (FONT_SIZE_KEYS.length - 1);
    Animated.spring(thumbAnim, {
      toValue: target,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [currentSizeKey]);

  const updateSizeFromX = (x) => {
    if (trackWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    const stepIdx = Math.round(ratio * (FONT_SIZE_KEYS.length - 1));
    const nextKey = FONT_SIZE_KEYS[stepIdx];
    if (nextKey && nextKey !== currentSizeKey) {
      onSizeChange(nextKey);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateSizeFromX(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        updateSizeFromX(evt.nativeEvent.locationX);
      },
    })
  ).current;

  const handleTrackPress = (evt) => {
    updateSizeFromX(evt.nativeEvent.locationX);
  };

  const thumbLeft = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, trackWidth - rs(28))],
  });

  const activeTrackWidth = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [rs(14), Math.max(rs(14), trackWidth)],
  });

  return (
    <View style={styles.sliderContainer}>
      <Text style={[styles.sliderLabelSmall, { color: isDark ? '#94A3B8' : '#64748B' }]}>A</Text>

      <TouchableWithoutFeedback onPress={handleTrackPress}>
        <View
          style={styles.sliderTrackArea}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          {/* Background gray track */}
          <View style={[styles.sliderTrackBg, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

          {/* Active emerald fill */}
          <Animated.View style={[styles.sliderTrackActive, { width: activeTrackWidth }]} />

          {/* Snap dots */}
          {FONT_SIZE_KEYS.map((key, index) => {
            const pct = (index / (FONT_SIZE_KEYS.length - 1)) * 100;
            const isSelected = key === currentSizeKey;
            return (
              <View
                key={key}
                style={[
                  styles.snapDot,
                  {
                    left: `${pct}%`,
                    backgroundColor: isSelected ? '#059669' : (isDark ? '#475569' : '#CBD5E1'),
                  },
                ]}
              />
            );
          })}

          {/* Draggable Circle Thumb */}
          <Animated.View style={[styles.sliderThumb, { left: thumbLeft }]} />
        </View>
      </TouchableWithoutFeedback>

      <Text style={[styles.sliderLabelLarge, { color: isDark ? '#E8EDF2' : '#0F172A' }]}>A</Text>
    </View>
  );
};

const ReadingSettingsModal = ({ visible, onClose }) => {
  const { isDark, themeMode, setThemeMode, colors } = useAppTheme();
  const { fontFamily, setFontFamily, fontSize, setFontSize, arabicFontStyle, setArabicFontStyle } = useFontSettings();
  const [activeTab, setActiveTab] = useState('Display');

  const emerald = '#059669';

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', shadowColor: '#000' }]}>
          {/* Top Handle */}
          <View style={[styles.handleBar, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={rs(22)} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Top Category Tabs (Display, Text) */}
          <View style={styles.tabsRow}>
            {['Display', 'Text'].map((tab) => {
              const selected = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabPill,
                    selected
                      ? { backgroundColor: emerald }
                      : { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      { color: selected ? '#FFFFFF' : (isDark ? '#E8EDF2' : '#475569') },
                      selected && { fontWeight: '700' },
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {activeTab === 'Display' && (
              <>
                {/* THEMES SECTION */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Themes</Text>
                <View style={styles.themesRow}>
                  {/* Modern (Light) */}
                  <TouchableOpacity
                    style={[
                      styles.themeCard,
                      { backgroundColor: '#F3F4F6' },
                      (themeMode === 'light' || themeMode === 'default' && !isDark) && styles.themeCardSelected,
                    ]}
                    onPress={() => setThemeMode('light')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.themeArabicWrap}>
                      <Text style={[styles.arabicPreviewText, { color: '#0F172A' }]}>بِسْمِ ٱللَّهِ</Text>
                    </View>
                    <Text style={[styles.themeLabel, { color: '#0F172A' }]}>Modern</Text>
                  </TouchableOpacity>

                  {/* Paper (Cream / Sepia) */}
                  <TouchableOpacity
                    style={[
                      styles.themeCard,
                      { backgroundColor: '#FFFBEB' },
                      themeMode === 'paper' && styles.themeCardSelected,
                    ]}
                    onPress={() => setThemeMode('paper')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.themeArabicWrap}>
                      <Text style={[styles.arabicPreviewText, { color: '#2C221E' }]}>بِسْمِ ٱللَّهِ</Text>
                    </View>
                    <Text style={[styles.themeLabelPaper, { color: '#2C221E' }]}>Paper</Text>
                  </TouchableOpacity>

                  {/* Dark */}
                  <TouchableOpacity
                    style={[
                      styles.themeCard,
                      { backgroundColor: '#1E293B' },
                      (themeMode === 'dark' || (themeMode === 'default' && isDark)) && styles.themeCardSelected,
                    ]}
                    onPress={() => setThemeMode('dark')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.themeArabicWrap}>
                      <Text style={[styles.arabicPreviewText, { color: '#FFFFFF' }]}>بِسْمِ ٱللَّهِ</Text>
                    </View>
                    <Text style={[styles.themeLabel, { color: '#FFFFFF' }]}>Dark</Text>
                  </TouchableOpacity>
                </View>

                {/* TEXT SIZE SECTION */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: rs(24) }]}>Text Size</Text>
                <CustomTextSizeSlider
                  currentSizeKey={fontSize}
                  onSizeChange={(newSize) => setFontSize(newSize)}
                  isDark={isDark}
                />
              </>
            )}

            {activeTab === 'Text' && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Font Family</Text>
                <View style={styles.pillsRow}>
                  {Object.entries(FONT_FAMILIES).map(([key, { label }]) => {
                    const selected = fontFamily === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.optionPill,
                          selected
                            ? { backgroundColor: emerald, borderColor: emerald }
                            : { backgroundColor: isDark ? '#334155' : '#F1F5F9', borderColor: isDark ? '#475569' : '#E2E8F0' },
                        ]}
                        onPress={() => setFontFamily(key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.optionPillText, { color: selected ? '#FFFFFF' : colors.text }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: rs(24) }]}>Arabic Script Style</Text>
                <View style={styles.pillsRow}>
                  {Object.entries(ARABIC_STYLES).map(([key, { label }]) => {
                    const selected = arabicFontStyle === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.optionPill,
                          selected
                            ? { backgroundColor: emerald, borderColor: emerald }
                            : { backgroundColor: isDark ? '#334155' : '#F1F5F9', borderColor: isDark ? '#475569' : '#E2E8F0' },
                        ]}
                        onPress={() => setArabicFontStyle(key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.optionPillText, { color: selected ? '#FFFFFF' : colors.text }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    width: '100%',
    borderTopLeftRadius: rs(28),
    borderTopRightRadius: rs(28),
    paddingHorizontal: rs(20),
    paddingTop: rs(12),
    paddingBottom: Platform.OS === 'ios' ? rs(36) : rs(24),
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    maxHeight: '80%',
  },
  handleBar: {
    width: rs(40),
    height: rs(4),
    borderRadius: rs(2),
    alignSelf: 'center',
    marginBottom: rs(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(16),
  },
  headerTitle: {
    fontSize: rs(20),
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  closeBtn: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: rs(8),
    marginBottom: rs(22),
  },
  tabPill: {
    paddingVertical: rs(8),
    paddingHorizontal: rs(16),
    borderRadius: rs(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabPillText: {
    fontSize: rs(14),
    fontWeight: '600',
  },
  scrollContent: {
    maxHeight: rs(360),
  },
  scrollContainer: {
    paddingBottom: rs(16),
  },
  sectionTitle: {
    fontSize: rs(16),
    fontWeight: '700',
    fontFamily: FONTS.bold,
    marginBottom: rs(12),
  },
  themesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(10),
  },
  themeCard: {
    flex: 1,
    height: rs(105),
    borderRadius: rs(18),
    padding: rs(10),
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  themeArabicWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabicPreviewText: {
    fontSize: rs(20),
    fontFamily: FONTS.arabic,
    fontWeight: '700',
  },
  themeLabel: {
    fontSize: rs(13),
    fontWeight: '600',
  },
  themeLabelPaper: {
    fontSize: rs(13),
    fontWeight: '700',
    fontFamily: 'serif',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: rs(8),
    paddingHorizontal: rs(4),
  },
  sliderLabelSmall: {
    fontSize: rs(14),
    fontWeight: '600',
    width: rs(24),
    textAlign: 'center',
  },
  sliderLabelLarge: {
    fontSize: rs(22),
    fontWeight: '700',
    width: rs(28),
    textAlign: 'center',
  },
  sliderTrackArea: {
    flex: 1,
    height: rs(40),
    justifyContent: 'center',
    marginHorizontal: rs(8),
  },
  sliderTrackBg: {
    width: '100%',
    height: rs(4),
    borderRadius: rs(2),
    position: 'absolute',
  },
  sliderTrackActive: {
    height: rs(4),
    borderRadius: rs(2),
    backgroundColor: '#059669',
    position: 'absolute',
    left: 0,
  },
  snapDot: {
    width: rs(8),
    height: rs(8),
    borderRadius: rs(4),
    position: 'absolute',
    top: '50%',
    marginTop: rs(-4),
    marginLeft: rs(-4),
  },
  sliderThumb: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#059669',
    position: 'absolute',
    top: '50%',
    marginTop: rs(-13),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(10),
  },
  optionPill: {
    paddingVertical: rs(10),
    paddingHorizontal: rs(16),
    borderRadius: rs(20),
    borderWidth: 1,
  },
  optionPillText: {
    fontSize: rs(14),
    fontWeight: '600',
  },
  audioInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(16),
    borderRadius: rs(16),
    borderWidth: 1,
  },
  audioTitle: {
    fontSize: rs(15),
    fontWeight: '700',
    marginBottom: rs(4),
  },
  audioDesc: {
    fontSize: rs(13),
    lineHeight: rs(18),
  },
});

export default ReadingSettingsModal;
