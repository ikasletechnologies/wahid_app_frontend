import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Text from './AppText';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

const VARIANTS = {
  info: {
    iconName: 'information-circle',
    iconColor: '#0EA5E9',
    iconBg:    '#E0F2FE',
  },
  success: {
    iconName: 'checkmark-circle',
    iconColor: '#22C55E',
    iconBg:    '#DCFCE7',
  },
  warning: {
    iconName: 'warning',
    iconColor: '#F59E0B',
    iconBg:    '#FEF3C7',
  },
  error: {
    iconName: 'alert-circle',
    iconColor: '#EF4444',
    iconBg:    '#FEE2E2',
  },
};

const ToastCard = ({ text1, text2, hide, type }) => {
  const v = VARIANTS[type] || VARIANTS.info;

  return (
    <View style={{
      width: '92%',
      alignSelf: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    }}>

      {/* Icon box */}
      <View style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: v.iconBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        flexShrink: 0,
      }}>
        <Ionicons name={v.iconName} size={28} color={v.iconColor} />
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '700',
          color: '#111827',
          marginBottom: text2 ? 3 : 0,
        }}>
          {text1}
        </Text>
        {text2 ? (
          <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
            {text2}
          </Text>
        ) : null}
      </View>

      {/* Close */}
      <TouchableOpacity
        onPress={hide}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ paddingLeft: 8 }}
      >
        <Ionicons name="close" size={18} color="#9CA3AF" />
      </TouchableOpacity>

    </View>
  );
};

const ThemedToast = () => {
  const toastConfig = {
    success: (props) => <ToastCard {...props} type="success" />,
    error:   (props) => <ToastCard {...props} type="error" />,
    info:    (props) => <ToastCard {...props} type="info" />,
    warning: (props) => <ToastCard {...props} type="warning" />,
  };

  return <Toast config={toastConfig} position="top" topOffset={65} />;
};

export default ThemedToast;
