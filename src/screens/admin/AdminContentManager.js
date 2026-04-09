/**
 * AdminContentManager
 *
 * Lets the admin Create / Edit / Delete content cards:
 *   • Did You Know  — title + content text
 *   • Media         — title + content + imageUrl + videoUrl + tags[]
 *   • Advertisement — title + content + imageUrl + videoUrl + ctaText + ctaUrl
 *
 * Each card is sent to POST /api/admin/content  (create)
 *                        PUT  /api/admin/content/:id  (edit)
 *                        DELETE /api/admin/content/:id  (delete)
 *
 * Published cards are fetched by the user app via GET /api/content
 * and injected into the Names feed by ContentContext + NamesScreen composeFeed().
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';
import { useContent } from '../../context/ContentContext';
import http from '../../config/http';
import { ENDPOINTS } from '../../config/api';
import { FONTS, SIZES, SPACE, RADIUS } from '../../theme';

const GOLD = '#c9a84c';

const CARD_TYPES = [
  { key: 'did_you_know',  label: 'Did You Know', icon: 'bulb-outline',     color: GOLD         },
  { key: 'media',         label: 'Media',         icon: 'image-outline',    color: '#0ea5e9'    },
  { key: 'advertisement', label: 'Advertisement', icon: 'megaphone-outline',color: '#ec4899'    },
];

const TYPE_COLORS = {
  did_you_know:  GOLD,
  media:         '#0ea5e9',
  advertisement: '#ec4899',
};

// ── Empty form state ──────────────────────────────────────────────────────────
const emptyForm = {
  type:     'did_you_know',
  title:    '',
  content:  '',
  imageUrl: '',
  videoUrl: '',
  tags:     '',        // comma-separated string, converted to array on save
  ctaText:  '',
  ctaUrl:   '',
};

// ── Field configuration per card type ────────────────────────────────────────
const FIELDS = {
  did_you_know: ['title', 'content'],
  media:        ['title', 'content', 'imageUrl', 'videoUrl', 'tags'],
  advertisement:['title', 'content', 'imageUrl', 'videoUrl', 'ctaText', 'ctaUrl'],
};

const FIELD_LABELS = {
  title:    'Title',
  content:  'Content text',
  imageUrl: 'Image URL',
  videoUrl: 'Video URL',
  tags:     'Tags (comma-separated)',
  ctaText:  'Button label (e.g. Learn More)',
  ctaUrl:   'Button URL',
};

const AdminContentManager = ({ navigation }) => {
  const { colors, isDark } = useAppTheme();
  const { contentItems, reload } = useContent();

  const [saving,      setSaving]      = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);   // null = new card
  const [form,        setForm]        = useState(emptyForm);
  const [activeType,  setActiveType]  = useState(null);   // filter chip

  const visibleItems = activeType
    ? contentItems.filter(c => c.type === activeType)
    : contentItems;

  // ── Open modal for new card ──
  const openNew = useCallback((type = 'did_you_know') => {
    setEditingId(null);
    setForm({ ...emptyForm, type });
    setModalOpen(true);
  }, []);

  // ── Open modal for existing card ──
  const openEdit = useCallback((item) => {
    setEditingId(item.id);
    setForm({
      type:     item.type,
      title:    item.title    || '',
      content:  item.content  || '',
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      tags:     Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
      ctaText:  item.ctaText  || '',
      ctaUrl:   item.ctaUrl   || '',
    });
    setModalOpen(true);
  }, []);

  // ── Save (create or update) ──
  const handleSave = useCallback(async () => {
    if (!form.content.trim()) {
      Alert.alert('Validation', 'Content text is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (editingId) {
        await http.put(`${ENDPOINTS.contentAdmin}/${editingId}`, payload);
      } else {
        await http.post(ENDPOINTS.contentAdmin, payload);
      }
      setModalOpen(false);
      reload();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Could not save card.');
    } finally {
      setSaving(false);
    }
  }, [form, editingId, reload]);

  // ── Delete ──
  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Delete card',
      `Delete "${item.title || item.type}" from the feed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await http.delete(`${ENDPOINTS.contentAdmin}/${item.id}`);
              reload();
            } catch (e) {
              Alert.alert('Error', 'Could not delete card.');
            }
          },
        },
      ],
    );
  }, [reload]);

  // ── Render one content card row ──
  const renderCard = useCallback(({ item }) => {
    const color = TYPE_COLORS[item.type] || GOLD;
    const typeLabel = CARD_TYPES.find(t => t.key === item.type)?.label || item.type;
    return (
      <View style={[styles.cardRow, { borderColor: color + '30', backgroundColor: colors.glass }]}>
        <View style={[styles.cardTypeBadge, { backgroundColor: color + '18' }]}>
          <Text style={[styles.cardTypeBadgeText, { color }]}>{typeLabel}</Text>
        </View>
        <View style={styles.cardBody}>
          {!!item.title && (
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          <Text style={[styles.cardPreview, { color: colors.textMuted }]} numberOfLines={2}>
            {item.content}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={17} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={17} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [colors, openEdit, handleDelete]);

  const activeFields = FIELDS[form.type] || FIELDS.did_you_know;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Content Cards</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: GOLD }]}
          onPress={() => openNew()}
        >
          <Ionicons name="add" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* ── Type filter chips ── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={styles.filterRow}
      >
        <TouchableOpacity
          style={[styles.filterChip, { borderColor: colors.border, backgroundColor: !activeType ? GOLD + '18' : colors.glass }]}
          onPress={() => setActiveType(null)}
        >
          <Text style={[styles.filterChipText, { color: !activeType ? GOLD : colors.textMuted }]}>All</Text>
        </TouchableOpacity>
        {CARD_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.filterChip, {
              borderColor: activeType === t.key ? t.color + '55' : colors.border,
              backgroundColor: activeType === t.key ? t.color + '18' : colors.glass,
            }]}
            onPress={() => setActiveType(activeType === t.key ? null : t.key)}
          >
            <Ionicons name={t.icon} size={12} color={activeType === t.key ? t.color : colors.textMuted} />
            <Text style={[styles.filterChipText, { color: activeType === t.key ? t.color : colors.textMuted }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── List ── */}
      <FlatList
        data={visibleItems}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="layers-outline" size={44} color={colors.textDimmed} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No content cards yet.{'\n'}Tap + to create one.
            </Text>
          </View>
        )}
      />

      {/* ── Create / Edit Modal ── */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF' }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingId ? 'Edit card' : 'New card'}
                </Text>
                <TouchableOpacity onPress={() => setModalOpen(false)}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Card type selector (only on new) */}
              {!editingId && (
                <View style={styles.typeRow}>
                  {CARD_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      style={[
                        styles.typeChip,
                        { borderColor: form.type === t.key ? t.color + '70' : colors.border },
                        form.type === t.key && { backgroundColor: t.color + '18' },
                      ]}
                      onPress={() => setForm(f => ({ ...emptyForm, type: t.key }))}
                    >
                      <Ionicons name={t.icon} size={14} color={form.type === t.key ? t.color : colors.textMuted} />
                      <Text style={[styles.typeChipText, { color: form.type === t.key ? t.color : colors.textMuted }]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Dynamic fields */}
              {activeFields.map(field => (
                <View key={field} style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                    {FIELD_LABELS[field]}
                  </Text>
                  <TextInput
                    style={[
                      styles.fieldInput,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.glass },
                      field === 'content' && styles.fieldInputMulti,
                    ]}
                    value={form[field]}
                    onChangeText={val => setForm(f => ({ ...f, [field]: val }))}
                    placeholder={FIELD_LABELS[field]}
                    placeholderTextColor={colors.textDimmed}
                    multiline={field === 'content'}
                    numberOfLines={field === 'content' ? 4 : 1}
                    autoCapitalize={field.endsWith('Url') ? 'none' : 'sentences'}
                    keyboardType={field.endsWith('Url') ? 'url' : 'default'}
                  />
                </View>
              ))}

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: GOLD, opacity: saving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.saveBtnText}>{editingId ? 'Save changes' : 'Create card'}</Text>}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    gap: SPACE.sm,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
  },
  addBtn: {
    width: 36, height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Filter chips ──
  filterRow: { marginBottom: SPACE.sm },
  filterScroll: {
    paddingHorizontal: SPACE.md,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  // ── List ──
  list: { paddingHorizontal: SPACE.md, paddingBottom: 60, gap: SPACE.sm },

  // ── Card row ──
  cardRow: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACE.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACE.sm,
  },
  cardTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    minWidth: 60,
    alignItems: 'center',
  },
  cardTypeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  cardBody:    { flex: 1, gap: 3 },
  cardTitle:   { fontFamily: FONTS.bold, fontSize: SIZES.sm },
  cardPreview: { fontSize: SIZES.xs, lineHeight: 17 },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionBtn:   { padding: 6 },

  // ── Empty ──
  empty: { paddingTop: 80, alignItems: 'center', gap: SPACE.md },
  emptyText: { fontSize: SIZES.sm, textAlign: 'center', lineHeight: 22 },

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACE.lg,
    paddingBottom: 40,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACE.md,
  },
  modalTitle: { fontFamily: FONTS.bold, fontSize: SIZES.lg },

  // ── Type selector ──
  typeRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginBottom: SPACE.md,
    flexWrap: 'wrap',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  typeChipText: { fontSize: SIZES.xs, fontWeight: '700' },

  // ── Fields ──
  fieldWrap:   { marginBottom: SPACE.md },
  fieldLabel:  { fontSize: SIZES.xs, marginBottom: 6, letterSpacing: 0.4 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    fontFamily: FONTS.regular,
    fontSize: SIZES.sm,
  },
  fieldInputMulti: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACE.sm,
  },

  // ── Save button ──
  saveBtn: {
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.sm,
  },
  saveBtnText: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.base,
    color: '#000',
    letterSpacing: 0.3,
  },
});

export default AdminContentManager;
