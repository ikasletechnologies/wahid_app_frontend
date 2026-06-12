import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../theme';
import { useAppTheme } from '../context/ThemeContext';

const NameDetailHeader = ({ name, onClose }) => {
  const { isDark } = useAppTheme();

  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1A2332'] : ['#C5F2F7', '#FFFFFF']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={28} color={isDark ? '#E8EDF2' : '#1A1A1A'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerArabic}>{name.arabic}</Text>
          <Text style={[styles.headerName, { color: isDark ? '#E8EDF2' : '#1A1A1A' }]}>{name.transliteration}</Text>
          <Text style={styles.headerMeaning}>{name.meaning}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 20,
    zIndex: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerArabic: {
    fontFamily: FONTS.arabic,
    fontSize: 14,
    color: '#00ADC1',
  },
  headerName: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', letterSpacing: 0.2 },
  headerMeaning: { fontSize: 14, color: '#00ADC1', fontWeight: '500' },
});

export default NameDetailHeader;
