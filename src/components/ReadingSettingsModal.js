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
  useWindowDimensions,
  Easing,
  LayoutAnimation,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text as RNText } from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme, THEME_MODES } from '../context/ThemeContext';
import { useFontSettings, FONT_FAMILIES, FONT_SIZES, ARABIC_STYLES } from '../context/FontSettingsContext';
import { FONTS, COLORS } from '../theme';

const RiAiGenerateText = ({ size = 16, color = 'currentColor', style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
    <Path d="M21 6V8H3V6H21ZM3 11H14V13H3V11ZM3 16H10V18H3V16ZM18.5 10L19.25 12.25L21.5 13L19.25 13.75L18.5 16L17.75 13.75L15.5 13L17.75 12.25L18.5 10ZM14.5 16.5L15 18L16.5 18.5L15 19L14.5 20.5L14 19L12.5 18.5L14 18L14.5 16.5Z" />
  </Svg>
);

const FONT_SIZE_KEYS = ['small', 'medium', 'large', 'extralarge'];

const CustomTextSizeSlider = ({ currentSizeKey, onSizeChange, isDark, accentColor }) => {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(windowWidth / 393, 1.25);
  const rs = (n) => Math.round(n * scale);

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
          {/* Background track */}
          <View style={[styles.sliderTrackBg, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

          {/* Active fill */}
          <Animated.View style={[styles.sliderTrackActive, { backgroundColor: accentColor, width: activeTrackWidth }]} />

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
                    backgroundColor: isSelected ? accentColor : (isDark ? '#475569' : '#CBD5E1'),
                  },
                ]}
              />
            );
          })}

          {/* Draggable Circle Thumb */}
          <Animated.View style={[styles.sliderThumb, { borderColor: accentColor, left: thumbLeft }]} />
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

  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(windowWidth / 393, 1.25);
  const rs = (n) => Math.round(n * scale);
  const isTabletOrDesktop = windowWidth >= 600;

  const primaryColor = colors?.primary || COLORS.primary || '#06b6d4';
  const primaryTint = primaryColor.startsWith('#') ? primaryColor + '1A' : 'rgba(6, 182, 212, 0.15)';
  const primaryBgLight = primaryColor.startsWith('#') ? primaryColor + '12' : 'rgba(6, 182, 212, 0.1)';

  const tabAnim = useRef(new Animated.Value(activeTab === 'Display' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: activeTab === 'Display' ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    LayoutAnimation.configureNext({
      duration: 200,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    setActiveTab(tab);
  };

  const handleThemeChange = (mode) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setThemeMode(mode);
  };

  const handleFontFamilyChange = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFontFamily(key);
  };

  const handleArabicStyleChange = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setArabicFontStyle(key);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, isTabletOrDesktop && styles.overlayCentered]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            isTabletOrDesktop && styles.modalCardDesktop,
          ]}
        >
          {/* Top Handle */}
          <View style={[styles.handleBar, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />

          {/* Top Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Settings</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={rs(20)} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Top Category Tabs (Display, Text) */}
          <View
            style={[
              styles.tabsOuterContainer,
              { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: isDark ? '#334155' : '#F1F5F9' },
            ]}
          >
            <View style={[styles.tabsRow, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }]}>
              {/* Animated Sliding Background Pill */}
              <Animated.View
                style={[
                  styles.activeTabIndicator,
                  {
                    backgroundColor: primaryColor,
                    left: tabAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '50%'],
                    }),
                  },
                ]}
              />

              {['Display', 'Text'].map((tab) => {
                const selected = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={styles.tabPill}
                    onPress={() => handleTabChange(tab)}
                    activeOpacity={0.85}
                  >
                    {tab === 'Display' ? (
                      <Ionicons
                        name="desktop-outline"
                        size={rs(16)}
                        color={selected ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')}
                        style={{ marginRight: rs(6) }}
                      />
                    ) : (
                      <RiAiGenerateText
                        size={rs(16)}
                        color={selected ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')}
                        style={{ marginRight: rs(6) }}
                      />
                    )}
                    <Text
                      style={[
                        styles.tabPillText,
                        { color: selected ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B') },
                        selected && { fontWeight: '600' },
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {activeTab === 'Display' && (
              <>
                {/* THEMES SECTION */}
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionBadge, { backgroundColor: primaryTint }]}>
                    <Ionicons name="color-palette-outline" size={rs(14)} color={primaryColor} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Themes</Text>
                </View>

                <View style={styles.cardsRow}>
                  {/* Modern (Light) */}
                  <TouchableOpacity
                    style={[
                      styles.optionCard,
                      (themeMode === 'light' || (themeMode === 'default' && !isDark))
                        ? { backgroundColor: isDark ? primaryTint : primaryBgLight, borderColor: primaryColor }
                        : { backgroundColor: '#FAFAFC', borderColor: isDark ? '#475569' : '#EBF0F5' },
                    ]}
                    onPress={() => handleThemeChange('light')}
                    activeOpacity={0.85}
                  >
                    {(themeMode === 'light' || (themeMode === 'default' && !isDark)) && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={rs(18)} color={primaryColor} />
                      </View>
                    )}
                    <View style={styles.themeArabicWrap}>
                      <Text style={[styles.arabicPreviewText, { color: isDark ? primaryColor : '#0F172A' }]}>بِسْمِ ٱللَّهِ</Text>
                    </View>
                    <Text
                      style={[
                        styles.fontCardLabel,
                        { color: (themeMode === 'light' || (themeMode === 'default' && !isDark)) ? primaryColor : '#0F172A' },
                        (themeMode === 'light' || (themeMode === 'default' && !isDark)) && { fontWeight: '700' },
                      ]}
                    >
                      Modern
                    </Text>
                  </TouchableOpacity>

                  {/* Dark */}
                  <TouchableOpacity
                    style={[
                      styles.optionCard,
                      (themeMode === 'dark' || (themeMode === 'default' && isDark))
                        ? { backgroundColor: '#1E293B', borderColor: primaryColor }
                        : { backgroundColor: '#1E293B', borderColor: '#334155' },
                    ]}
                    onPress={() => handleThemeChange('dark')}
                    activeOpacity={0.85}
                  >
                    {(themeMode === 'dark' || (themeMode === 'default' && isDark)) && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={rs(18)} color={primaryColor} />
                      </View>
                    )}
                    <View style={styles.themeArabicWrap}>
                      <Text style={[styles.arabicPreviewText, { color: isDark ? primaryColor : '#FFFFFF' }]}>بِسْمِ ٱللَّهِ</Text>
                    </View>
                    <Text
                      style={[
                        styles.fontCardLabel,
                        { color: (themeMode === 'dark' || (themeMode === 'default' && isDark)) ? primaryColor : '#FFFFFF' },
                        (themeMode === 'dark' || (themeMode === 'default' && isDark)) && { fontWeight: '700' },
                      ]}
                    >
                      Dark
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* TEXT SIZE SECTION */}
                <View style={[styles.sectionHeaderRow, { marginTop: rs(24) }]}>
                  <View style={[styles.sectionBadge, { backgroundColor: primaryTint }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: rs(12), fontWeight: '700', color: primaryColor, lineHeight: rs(14) }}>A</Text>
                      <Text style={{ fontSize: rs(9), fontWeight: '700', color: primaryColor, lineHeight: rs(10), marginBottom: 0.5 }}>A</Text>
                    </View>
                  </View>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Text Size</Text>
                </View>
                <CustomTextSizeSlider
                  currentSizeKey={fontSize}
                  onSizeChange={(newSize) => setFontSize(newSize)}
                  isDark={isDark}
                  accentColor={primaryColor}
                />
              </>
            )}

            {activeTab === 'Text' && (
              <>
                {/* FONT FAMILY SECTION */}
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionBadge, { backgroundColor: primaryTint }]}>
                    <Text style={{ fontSize: rs(12), fontWeight: '700', color: primaryColor }}>Aa</Text>
                  </View>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Font Family</Text>
                </View>
                <View style={styles.cardsRow}>
                  {Object.entries(FONT_FAMILIES).map(([key, { label }]) => {
                    const selected = fontFamily === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.optionCard,
                          selected
                            ? { backgroundColor: isDark ? primaryTint : primaryBgLight, borderColor: primaryColor }
                            : { backgroundColor: isDark ? '#334155' : '#FAFAFC', borderColor: isDark ? '#475569' : '#EBF0F5' },
                        ]}
                        onPress={() => handleFontFamilyChange(key)}
                        activeOpacity={0.85}
                      >
                        {selected && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark-circle" size={rs(18)} color={primaryColor} />
                          </View>
                        )}
                        <RNText
                          style={[
                            styles.fontCardPreview,
                            { color: selected ? primaryColor : (isDark ? '#F1F5F9' : '#0F172A') },
                            { fontFamily: FONT_FAMILIES[key].regular },
                          ]}
                        >
                          Aa
                        </RNText>
                        <Text
                          style={[
                            styles.fontCardLabel,
                            { color: selected ? primaryColor : (isDark ? '#94A3B8' : '#475569') },
                            selected && { fontWeight: '600' },
                          ]}
                          numberOfLines={1}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ARABIC SCRIPT STYLE SECTION */}
                <View style={[styles.sectionHeaderRow, { marginTop: rs(24) }]}>
                  <View style={[styles.sectionBadge, { backgroundColor: primaryTint }]}>
                    <Ionicons name="pencil" size={rs(13)} color={primaryColor} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Arabic Script Style</Text>
                </View>
                <View style={styles.cardsRow}>
                  {Object.entries(ARABIC_STYLES).map(([key, { label, family }]) => {
                    const selected = arabicFontStyle === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.optionCard,
                          selected
                            ? { backgroundColor: isDark ? primaryTint : primaryBgLight, borderColor: primaryColor }
                            : { backgroundColor: isDark ? '#334155' : '#FAFAFC', borderColor: isDark ? '#475569' : '#EBF0F5' },
                        ]}
                        onPress={() => handleArabicStyleChange(key)}
                        activeOpacity={0.85}
                      >
                        {selected && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark-circle" size={rs(18)} color={primaryColor} />
                          </View>
                        )}
                        <RNText
                          style={[
                            styles.arabicCardPreview,
                            { color: isDark ? primaryColor : '#0F172A' },
                            family ? { fontFamily: family } : null,
                          ]}
                        >
                          ابجد
                        </RNText>
                        <Text
                          style={[
                            styles.fontCardLabel,
                            { color: selected ? primaryColor : (isDark ? '#94A3B8' : '#475569') },
                            selected && { fontWeight: '600' },
                          ]}
                          numberOfLines={2}
                        >
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
  overlayCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    maxHeight: '85%',
  },
  modalCardDesktop: {
    borderRadius: 24,
    maxHeight: '80%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsOuterContainer: {
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    borderRadius: 22,
    zIndex: 0,
  },
  tabPill: {
    flex: 1,
    height: 42,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    height: 320,
    minHeight: 320,
  },
  scrollContainer: {
    paddingBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionCard: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  fontCardPreview: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 4,
  },
  arabicCardPreview: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 4,
    textAlign: 'center',
  },
  fontCardLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  themeArabicWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabicPreviewText: {
    fontSize: 18,
    fontFamily: FONTS.arabic,
    fontWeight: '700',
  },
  themeLabelPaper: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  sliderLabelSmall: {
    fontSize: 14,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  sliderLabelLarge: {
    fontSize: 22,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
  sliderTrackArea: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  sliderTrackBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  sliderTrackActive: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  snapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
  sliderThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    position: 'absolute',
    top: '50%',
    marginTop: -13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ReadingSettingsModal;

