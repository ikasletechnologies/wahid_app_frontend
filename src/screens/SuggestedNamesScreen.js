import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Text from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import { useAppTheme } from '../context/ThemeContext';
import { FONTS } from '../theme';

const { width: SW } = Dimensions.get('window');
const rs = (size) => Math.round(size * (SW / 393));

const SuggestedNamesScreen = ({ navigation }) => {
  const { names, draftIds, learnedIds, masteredIds, markAsDraft, removeDraft } = useNames();
  const { isDark } = useAppTheme();
  
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

  // Compute activeDraftIds the same way as HomeScreen
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

  const bg = isDark ? '#0F172A' : '#F0FBFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#F0F4F8' : '#0F172A';
  const textSec = isDark ? '#94A3B8' : '#475569';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2EEF0';
  const teal = '#00ADC1';

  const renderSuggestRow = ({ item }) => {
    const isDraft = activeDraftIds.includes(item.number);
    const isLearned = learnedIds.includes(item.number) || masteredIds.includes(item.number);
    const showTick = isDraft || isLearned;
    
    return (
      <View style={[styles.suggestRow, { borderBottomColor: borderColor }]}>
        <View style={styles.suggestTextCol}>
          <Text style={[styles.suggestArabic, { color: teal }]}>{item.arabic || ''}</Text>
          <Text style={[styles.suggestTrans, { color: textPrimary }]}>{item.transliteration || ''}</Text>
          <Text style={[styles.suggestMeaning, { color: textSec }]}>{item.meaning || ''}</Text>
        </View>
        <View style={styles.suggestRight}>
          <TouchableOpacity
            style={[styles.checkBtn, { backgroundColor: teal, opacity: isLearned ? 0.7 : 1 }]}
            activeOpacity={isLearned ? 1 : 0.8}
            onPress={() => {
              if (isLearned) return;
              if (isDraft) {
                removeDraft(item.number);
              } else {
                if (visibleDraftsCount >= 4) {
                  setDraftLimitModalVisible(true);
                } else {
                  markAsDraft(item.number);
                }
              }
            }}
          >
            <Ionicons name={showTick ? 'checkmark' : 'add'} size={rs(16)} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(24)} color={teal} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Suggested for You</Text>
        <View style={{ width: rs(40) }} />
      </View>

      <FlatList
        data={names}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderSuggestRow}
        contentContainerStyle={[styles.listContent, { backgroundColor: cardBg, borderColor: borderColor }]}
        showsVerticalScrollIndicator={false}
      />

      {/* --- Custom Modal for Draft Limit --- */}
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
  listContent: { 
    marginHorizontal: rs(20), paddingHorizontal: rs(16), borderRadius: rs(16), borderWidth: 1, paddingBottom: rs(20), marginTop: rs(8), marginBottom: rs(40)
  },
  suggestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: rs(12), borderBottomWidth: 1, gap: rs(12) },
  suggestTextCol: { flex: 1 },
  suggestArabic: { fontFamily: FONTS.bold, fontSize: rs(13) },
  suggestTrans: { fontFamily: FONTS.bold, fontSize: rs(14), lineHeight: rs(18) },
  suggestMeaning: { fontFamily: FONTS.regular, fontSize: rs(12) },
  suggestRight: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  checkBtn: { width: rs(32), height: rs(32), borderRadius: rs(16), justifyContent: 'center', alignItems: 'center' },
  
  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: rs(24) },
  modalContainer: { width: '100%', borderRadius: rs(16), padding: rs(24), borderWidth: 1, alignItems: 'center' },
  modalText: { fontFamily: FONTS.medium, fontSize: rs(15), textAlign: 'center', lineHeight: rs(22), marginBottom: rs(24) },
  modalButton: { paddingVertical: rs(12), paddingHorizontal: rs(32), borderRadius: rs(8), alignItems: 'center', width: '100%' },
  modalButtonText: { fontFamily: FONTS.bold, fontSize: rs(14), color: '#FFFFFF' },
});

export default SuggestedNamesScreen;
