import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS, FONTS, SIZES, SPACE, RADIUS } from '../theme';

const { width } = Dimensions.get('window');

/**
 * ConfirmDialog — Reusable themed confirmation modal
 *
 * Props:
 *   visible       {bool}     — controls modal visibility
 *   title         {string}   — headline text
 *   message       {string}   — body text
 *   icon          {string}   — Ionicons name for the top icon
 *   iconColor     {string}   — color of the icon (default: '#ff6b6b')
 *   confirmLabel  {string}   — confirm button label (default: 'Confirm')
 *   cancelLabel   {string}   — cancel button label (default: 'Cancel')
 *   confirmColor  {string}   — confirm button color (default: '#ff6b6b')
 *   onConfirm     {func}     — called on confirm press
 *   onCancel      {func}     — called on cancel press
 */
const ConfirmDialog = ({
  visible,
  title = 'Are you sure?',
  message,
  icon = 'alert-circle-outline',
  iconColor = '#ff6b6b',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = '#ff6b6b',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>

      {/* Dialog Card */}
      <View style={styles.centeredView}>
        <View style={styles.card}>
          {/* Decorative top border */}
          <View style={[styles.topAccent, { backgroundColor: iconColor + '40' }]} />

          {/* Icon Badge */}
          <View style={[styles.iconBadge, { backgroundColor: iconColor + '15', borderColor: iconColor + '30' }]}>
            <Ionicons name={icon} size={28} color={iconColor} />
          </View>

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmColor + '15', borderColor: confirmColor + '40' }]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={14} color={confirmColor} style={{ marginRight: 6 }} />
              <Text style={[styles.confirmLabel, { color: confirmColor }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACE.xl,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(20, 22, 32, 0.98)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.lg,
    paddingHorizontal: SPACE.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACE.md,
    marginTop: SPACE.xs,
  },
  title: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    color: COLORS.muted,
    fontSize: SIZES.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACE.xs,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: SPACE.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  cancelLabel: {
    color: COLORS.muted,
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
    letterSpacing: 0.5,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmLabel: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.sm,
    letterSpacing: 0.5,
  },
});

export default ConfirmDialog;
