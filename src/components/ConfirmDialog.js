import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const ConfirmDialog = ({
  visible,
  title = 'Are you sure?',
  message,
  icon = 'alert-circle-outline',
  iconColor = '#ff4d4d',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = '#ff4d4d',
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
      {/* Blurred backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel}>
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>

      {/* Dialog card */}
      <View style={styles.centeredView}>
        <View style={styles.card}>

          {/* Neumorphic icon ring — same style as profile setting icons */}
          <View style={styles.iconOuterRing}>
            <View style={styles.iconInnerCircle}>
              <Ionicons name={icon} size={26} color={iconColor} />
            </View>
          </View>

          <Text style={styles.title}>{title.toUpperCase()}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmColor + '22' }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <View style={[styles.confirmIconWrap, { backgroundColor: confirmColor + '18' }]}>
                <Ionicons name={icon} size={14} color={confirmColor} />
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },

  /* Neumorphic outer ring */
  iconOuterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBEBEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#EBECF0',
    shadowColor: '#B0B0BE',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 20,
  },
  iconInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F4F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  message: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  /* Cancel — dark charcoal */
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D4DEE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    color: '#4A5568',
    fontWeight: '600',
    fontSize: 14,
  },

  /* Confirm — soft pink with icon */
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ConfirmDialog;
