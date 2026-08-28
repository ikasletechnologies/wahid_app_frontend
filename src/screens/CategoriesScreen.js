import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, LayoutAnimation, Modal } from 'react-native';
import Text from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNames, CATEGORIES } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import LiquidText from '../components/LiquidText';
import { FONTS } from '../theme';

const { width: SW } = Dimensions.get('window');
const rs = (size) => Math.round(size * (SW / 393));

const CategoriesScreen = ({ navigation }) => {
  const { names, learnedIds, masteredIds, draftIds, markAsDraft, removeDraft, isSubscribed } = useNames();
  const { isDark } = useAppTheme();

  const [expandedCategories, setExpandedCategories] = useState({});
  const [draftLimitModalVisible, setDraftLimitModalVisible] = useState(false);
  const [lastReadNameId, setLastReadNameId] = useState(null);

  React.useEffect(() => {
    AsyncStorage.getItem('last_reading_progress')
      .then(saved => {
        if (saved) {
          const progress = JSON.parse(saved);
          const isCompleted = learnedIds.includes(progress.nameNumber) || masteredIds.includes(progress.nameNumber);
          if (!isCompleted) {
            setLastReadNameId(progress.nameNumber);
          }
        }
      })
      .catch(() => {});
  }, [learnedIds, masteredIds]);

  const activeDraftIds = React.useMemo(() => {
    return (draftIds || []).filter(id => !learnedIds.includes(id) && !masteredIds.includes(id));
  }, [draftIds, learnedIds, masteredIds]);

  const visibleDraftsCount = React.useMemo(() => {
    let count = activeDraftIds.length;
    if (lastReadNameId && activeDraftIds.includes(lastReadNameId)) {
      count -= 1;
    }
    return count;
  }, [activeDraftIds, lastReadNameId]);

  const toggleCategory = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToDraft = (item) => {
    const isDraft = activeDraftIds.includes(item.number);
    if (isDraft) {
      removeDraft(item.number);
    } else {
      if (!isSubscribed) {
        navigation.navigate('Subscription');
        return;
      }
      if (visibleDraftsCount >= 4) {
        setDraftLimitModalVisible(true);
      } else {
        markAsDraft(item.number);
      }
    }
  };

  const bg = isDark ? '#0F172A' : '#F0FBFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#F0F4F8' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#475569';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2EEF0';
  const teal = '#00ADC1';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(24)} color={teal} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Categories</Text>
        <View style={{ width: rs(40) }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.values(CATEGORIES).map((cat) => {
          const catNames = names.filter(n => n.category === cat.id);
          const learnedInCat = catNames.filter(n => learnedIds.includes(n.number)).length;
          const catTotal = catNames.length || 1;
          const percent = (learnedInCat / catTotal) * 100;

          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => toggleCategory(cat.id)}
              style={[
                styles.categoryCard,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F6FCFD', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E6F4F6' }
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(12) }}>
                <View>
                  <Text style={[styles.categoryCardName, { color: textPrimary }]}>{cat.name}</Text>
                  <Text style={{ color: teal, fontSize: rs(13), fontFamily: FONTS.bold }}>
                    {learnedInCat} <Text style={{ color: textSec, fontFamily: FONTS.medium }}>/ {catTotal}</Text>
                  </Text>
                </View>
                <View style={{ width: rs(64), alignItems: 'flex-end' }}>
                  <LiquidText
                    text={`${Math.round(percent)}%`}
                    percentage={percent}
                    baseColor={isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1'}
                    fillColor={teal}
                    textStyle={{ fontFamily: FONTS.bold, fontSize: rs(24) }}
                  />
                </View>
              </View>
              <View style={{ height: rs(4), backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2EEF0', borderRadius: rs(2), overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${percent}%`, backgroundColor: teal, borderRadius: rs(2) }} />
              </View>

              {expandedCategories[cat.id] && (
                <View style={{ marginTop: rs(16), paddingTop: rs(4), borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#E6F4F6' }}>
                  {catNames.map((item, idx) => {
                    const isMastered = masteredIds.includes(item.number);
                    const isLearned = learnedIds.includes(item.number);
                    const isDraft = activeDraftIds.includes(item.number);

                    return (
                      <View key={item.number}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: rs(12) }}>
                          <View style={{ width: rs(65), marginRight: rs(12) }}>
                            <Text style={{ color: teal, fontFamily: FONTS.bold, fontSize: rs(22) }}>{item.arabic}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: textPrimary, fontFamily: FONTS.bold, fontSize: rs(15), marginBottom: rs(2) }}>{item.transliteration}</Text>
                            <Text style={{ color: textSec, fontFamily: FONTS.regular, fontSize: rs(12) }}>{item.meaning}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                            {isMastered ? (
                              <Ionicons name="trophy" size={rs(16)} color="#F59E0B" />
                            ) : isLearned ? (
                              <Ionicons name="checkmark-circle" size={rs(16)} color="#4CAF50" />
                            ) : (
                              <TouchableOpacity
                                style={[styles.draftToggleBtn, { backgroundColor: teal }]}
                                activeOpacity={0.8}
                                onPress={() => handleAddToDraft(item)}
                              >
                                <Ionicons
                                  name={isDraft ? 'checkmark' : 'add'}
                                  size={rs(16)}
                                  color="#FFFFFF"
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        {idx < catNames.length - 1 && (
                          <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#E6F4F6' }} />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* --- Draft Limit Modal --- */}
      <Modal
        transparent
        visible={draftLimitModalVisible}
        animationType="fade"
        onRequestClose={() => setDraftLimitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.modalText, { color: textPrimary }]}>
              Please read the existing Draft cards before adding the next card.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: teal }]}
              onPress={() => setDraftLimitModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(20), paddingVertical: rs(16), justifyContent: 'space-between'
  },
  backBtn: { width: rs(40), height: rs(40), justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: rs(18) },
  scrollContent: { paddingHorizontal: rs(20), paddingBottom: rs(40) },
  categoryCard: {
    borderRadius: rs(12), padding: rs(16), marginBottom: rs(12), borderWidth: 1,
  },
  categoryCardName: { fontFamily: FONTS.bold, fontSize: rs(14), marginBottom: rs(6) },
  draftToggleBtn: { width: rs(28), height: rs(28), borderRadius: rs(14), justifyContent: 'center', alignItems: 'center' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  modalContainer: { width: '100%', borderRadius: rs(16), padding: rs(24), borderWidth: 1, alignItems: 'center' },
  modalText: { fontFamily: FONTS.medium, fontSize: rs(15), textAlign: 'center', lineHeight: rs(22), marginBottom: rs(24) },
  modalButton: { paddingVertical: rs(12), paddingHorizontal: rs(32), borderRadius: rs(8), alignItems: 'center', width: '100%' },
  modalButtonText: { fontFamily: FONTS.bold, fontSize: rs(14), color: '#FFFFFF' },
});

export default CategoriesScreen;
