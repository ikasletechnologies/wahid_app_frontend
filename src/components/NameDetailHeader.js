import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../theme';
import { useAppTheme } from '../context/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');
const rs = (n) => Math.round(n * (SW / 393));
const hs = (n) => Math.round(n * (SH / 900));

const STEP_META = {
  meaning: { label: 'Simple\nMeaning', icon: 'book-outline' },
  gifts: { label: 'Gift Of\nThis Name', icon: 'gift-outline' },
  quran: { label: "Pearls From\nQur'an", icon: 'library-outline' },
  hadith: { label: 'Pearls From\nHadith', icon: 'library-outline' },
  practical: { label: 'How To\nLive By It', icon: 'moon-outline' },
  scholarly: { label: 'Scholarly\nView', icon: 'school-outline' },
  reflection: { label: 'Reflection', icon: 'pencil-outline' },
  mastery: { label: 'Quiz', icon: 'help-circle-outline' },
};

const NameDetailHeader = ({ name, steps = [], currentStepIndex = 0 }) => {
  const { isDark } = useAppTheme();
  const navigation = useNavigation();

  const teal = '#00ADC1';
  const textColor = isDark ? '#E8EDF2' : '#112F33';
  const inactiveBg = isDark ? '#1E293B' : '#F0F9FB';
  const inactiveBord = isDark ? '#2A3A4A' : '#CBD5E1';
  const inactiveLbl = isDark ? '#5A6A7A' : '#94A3B8';
  const inactiveIco = isDark ? '#4A5A6A' : '#94A3B8';
  const connInactive = isDark ? '#2A3A4A' : '#D1E8EC';

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={rs(20)} color={isDark ? '#E2E8F0' : '#1E293B'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
          activeOpacity={0.7}
        >
          <Ionicons name="flag-outline" size={rs(20)} color={isDark ? '#E2E8F0' : '#1E293B'} />
        </TouchableOpacity>
      </View>

      {/* Name display */}
      <View style={styles.nameRow}>
        <Text style={[styles.arabic, { color: isDark ? '#E8EDF2' : '#0B292C' }]}>{name.arabic}</Text>
        <Text style={[styles.latin, { color: isDark ? '#E8EDF2' : '#0F172A' }]}>
          <Text style={{ color: teal }}>✦ </Text>
          {name.transliteration}
          <Text style={{ color: teal }}> ✦</Text>
        </Text>
        {!!(name.meaning || name.en) && (
          <Text style={[styles.meaning, { color: isDark ? '#94A3B8' : '#64748B' }]}>{name.meaning || name.en}</Text>
        )}
      </View>

      {/* Step tracker */}
      {steps.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tracker}
          contentContainerStyle={[
            styles.trackerContent,
            steps.length <= 5 && { minWidth: SW - rs(32), justifyContent: 'center' },
          ]}
        >
          {steps.map((step, i) => {
            const meta = STEP_META[step.type] || { label: step.type, icon: 'ellipse-outline' };
            const isActive = i === currentStepIndex;
            const isDone = i < currentStepIndex;
            const circBg = isActive || isDone ? teal : inactiveBg;
            const circBord = isActive || isDone ? teal : inactiveBord;
            const lblColor = isActive || isDone ? teal : inactiveLbl;
            const icoColor = isActive || isDone ? '#FFFFFF' : inactiveIco;

            return (
              <React.Fragment key={i}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, { backgroundColor: circBg, borderColor: circBord }]}>
                    {isDone
                      ? <Ionicons name="checkmark" size={rs(11)} color="#FFFFFF" />
                      : <Ionicons name={meta.icon} size={rs(12)} color={icoColor} />
                    }
                  </View>
                  <Text
                    style={[styles.stepLabel, { color: lblColor, fontWeight: isActive ? '700' : '400' }]}
                    numberOfLines={2}
                  >
                    {meta.label}
                  </Text>
                </View>

                {i < steps.length - 1 && (
                  <View style={[
                    styles.connector,
                    { backgroundColor: i < currentStepIndex ? teal : connInactive },
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', paddingBottom: hs(6) },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: rs(15),
    paddingTop: hs(5),
  },
  iconButton: {
    width: rs(44), height: rs(44),
    borderRadius: rs(14),
    justifyContent: 'center', alignItems: 'center',
  },


  nameRow: {
    alignItems: 'center',
    paddingHorizontal: rs(20),
    marginTop: hs(-24), // Pull it up between the icons
    paddingBottom: hs(6),
  },
  arabic: { fontSize: rs(40), fontFamily: FONTS.arabic, fontWeight: '700', marginBottom: hs(-18) },
  latin: { fontSize: rs(20), fontFamily: FONTS.arabic, fontWeight: '700', letterSpacing: 0.5 },
  meaning: { fontSize: rs(14), fontWeight: '500', marginTop: hs(4), marginBottom: hs(15) },

  tracker: { width: '100%' },
  trackerContent: {
    paddingHorizontal: rs(16),
    paddingVertical: hs(6),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  stepItem: { alignItems: 'center', width: rs(58) },
  stepCircle: {
    width: rs(28), height: rs(28), borderRadius: rs(14),
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
    marginBottom: hs(4),
  },
  stepLabel: { fontSize: rs(8.5), textAlign: 'center', lineHeight: rs(12) },

  connector: {
    width: rs(18), height: 1.5,
    alignSelf: 'flex-start',
    marginTop: hs(13.5),
    opacity: 0.7,
  },
});

export default NameDetailHeader;
