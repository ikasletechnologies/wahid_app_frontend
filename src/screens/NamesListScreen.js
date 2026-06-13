import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNames } from '../context/NamesContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';
import TimeBasedBackground from '../components/TimeBasedBackground';
import { FONTS } from '../theme';

const NamesListScreen = ({ navigation, route }) => {
  const { names, learnedIds, masteredIds, draftIds } = useNames();
  const { favouriteIds } = usePlaylist();
  const { isDark, colors } = useAppTheme();
  
  const statusFilter = route.params?.statusFilter || 'all'; // 'learned', 'mastered', 'remaining', 'favorites', 'drafts'

  const listData = useMemo(() => {
    let result = names;
    if (statusFilter === 'learned') {
      result = result.filter(n => learnedIds.includes(n.number) && !masteredIds.includes(n.number));
    } else if (statusFilter === 'mastered') {
      result = result.filter(n => masteredIds.includes(n.number));
    } else if (statusFilter === 'remaining') {
      result = result.filter(n => !learnedIds.includes(n.number) && !masteredIds.includes(n.number));
    } else if (statusFilter === 'favorites') {
      result = result.filter(n => favouriteIds && favouriteIds.has(n.number || n.id));
    } else if (statusFilter === 'drafts') {
      result = result.filter(n => draftIds && draftIds.includes(n.number || n.id));
    }
    return result;
  }, [names, learnedIds, masteredIds, draftIds, favouriteIds, statusFilter]);

  let title = 'Names List';
  if (statusFilter === 'learned') title = 'Learned Names';
  else if (statusFilter === 'mastered') title = 'Mastered Names';
  else if (statusFilter === 'remaining') title = 'Remaining Names';
  else if (statusFilter === 'favorites') title = 'Favorite Names';
  else if (statusFilter === 'drafts') title = 'Draft Names';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: 'transparent' }]} edges={['top']}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? "light-content" : "dark-content"} />
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>{title} ({listData.length})</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={listData}
              keyExtractor={(item) => item.number.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.nameListRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    const nameObj = { ...item, id: item.id ?? item.number };
                    navigation.navigate('NameDetail', { name: nameObj, initialStepIndex: 0 });
                  }}
                >
                  <View style={[styles.nameListNumBubble, { backgroundColor: isDark ? '#334155' : '#e0f2fe' }]}>
                    <Text style={[styles.nameListNumText, { color: '#06b6d4' }]}>{item.number}</Text>
                  </View>
                  <View style={styles.nameListTextCol}>
                    <Text style={[styles.nameListTrans, { color: colors.text }]}>{item.transliteration}</Text>
                    <Text style={[styles.nameListMeaning, { color: colors.textMuted }]}>{item.meaning}</Text>
                  </View>
                  <Text style={[styles.nameListArabic, { color: colors.text }]}>{item.arabic}</Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </TimeBasedBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nameListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  nameListNumBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameListNumText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  nameListTextCol: {
    flex: 1,
  },
  nameListTrans: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  nameListMeaning: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    marginTop: 2,
  },
  nameListArabic: {
    fontFamily: FONTS.arabic,
    fontSize: 16,
    marginLeft: 10,
  },
});

export default NamesListScreen;
