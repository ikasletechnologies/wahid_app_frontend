import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylist } from '../context/PlaylistContext';
import { useAppTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function PlaylistPicker({ visible, onHide, nameNumber, nameTitle }) {
  const { colors, isDark } = useAppTheme();
  const { customPlaylists, addToPlaylist, createPlaylist } = usePlaylist();

  const handlePick = async (playlistId) => {
    await addToPlaylist(playlistId, nameNumber);
    onHide();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onHide}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismiss} onPress={onHide} />
        <View style={[styles.sheet, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Add to Playlist</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{nameTitle}</Text>
          </View>

          <FlatList
            data={customPlaylists}
            keyExtractor={(p) => p.id.toString()}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="musical-notes-outline" size={40} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 12 }}>No custom playlists found</Text>
              </View>
            }
            renderItem={({ item }) => {
              const alreadyHas = item.nameNumbers?.includes(nameNumber);
              return (
                <TouchableOpacity
                  style={[
                    styles.item,
                    { backgroundColor: isDark ? '#1a1a1a' : '#f8f8f8' },
                    alreadyHas && { opacity: 0.6 }
                  ]}
                  onPress={() => !alreadyHas && handlePick(item.id)}
                  disabled={alreadyHas}
                >
                  <LinearGradient colors={['#1a0d3a', '#3a1a6e']} style={styles.icon}>
                    <Ionicons name="musical-notes" size={16} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                  {alreadyHas && <Text style={styles.added}>Added</Text>}
                  {!alreadyHas && <Ionicons name="add-circle-outline" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onHide}>
            <Text style={[styles.closeLabel, { color: colors.textMuted }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  added: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
  closeBtn: {
    alignItems: 'center',
    paddingTop: 12,
  },
  closeLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
