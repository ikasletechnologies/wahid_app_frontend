import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  StatusBar,
  Image,
  useWindowDimensions,
} from 'react-native';
import Text from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import TimeBasedBackground from '../components/TimeBasedBackground';
import http from '../config/http';
import { ENDPOINTS } from '../config/api';
import { useNames } from '../context/NamesContext';
import { useAuth } from '../context/AuthContext';
import RazorpayCheckout from 'react-native-razorpay';

const REGIONS = [
  { id: 'IN', label: 'India', flag: '🇮🇳', price: '₹120', currency: 'INR' },
  { id: 'AE', label: 'UAE', flag: '🇦🇪', price: '9.99 AED', currency: 'AED' },
  { id: 'GB', label: 'UK', flag: '🇬🇧', price: '£6.99', currency: 'GBP' },
];

const SubscriptionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark, colors } = useAppTheme();
  const { fetchSubscriptionStatus, refresh: refreshNames } = useNames();
  const { user } = useAuth();
  const { width: windowWidth } = useWindowDimensions();

  const scale = Math.min(Math.max(windowWidth / 393, 0.85), 1.25);
  const rs = (n) => Math.round(n * scale);
  const isTabletOrDesktop = windowWidth >= 600;

  const [selectedRegion, setSelectedRegion] = useState('IN');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, [selectedRegion]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [statusRes, plansRes] = await Promise.all([
        http.get(ENDPOINTS.subscriptionStatus),
        http.get(`${ENDPOINTS.subscriptionPlans}?region=${selectedRegion}`),
      ]);

      if (statusRes.data?.success) {
        setSubStatus(statusRes.data.data);
      }
      if (plansRes.data?.success) {
        setPlans(plansRes.data.data);
      }
    } catch (err) {
      console.warn('[SUBSCRIPTION FETCH ERROR]', err);
      const message = err.response?.data?.message
        || (err.response?.status === 401 ? 'Your session has expired. Please sign in again.' : null)
        || (err.code === 'ECONNABORTED' ? 'The server took too long to respond. Please try again.' : null)
        || 'Could not connect to the payment server. Check your internet connection and try again.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setProcessingPayment(true);
      const response = await http.post(ENDPOINTS.createOrder, { region: selectedRegion });

      if (!response.data?.success) {
        Alert.alert('Payment Error', response.data?.message || 'Failed to create payment order.');
        setProcessingPayment(false);
        return;
      }

      const orderData = response.data.data;

      if (!orderData?.keyId || !orderData?.orderId || !orderData?.amount || !orderData?.currency) {
        throw new Error('The payment server returned an incomplete order. Please contact support.');
      }

      const checkoutOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'Wahid — 99 Names',
        description: '30-Day Full Access Pass',
        prefill: {
          contact: user?.phone || '',
          email: user?.email || '',
        },
        theme: { color: colors?.primary || '#06b6d4' },
      };

      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        setProcessingPayment(false);
        Alert.alert(
          'Payment Unavailable',
          'The payment module is not available in this build. Rebuild the app (expo run:android / run:ios) after installing react-native-razorpay.'
        );
        return;
      }

      let checkoutResult;
      try {
        checkoutResult = await RazorpayCheckout.open(checkoutOptions);
      } catch (checkoutErr) {
        // User cancelled or the gateway rejected the payment — nothing to verify.
        setProcessingPayment(false);
        console.error('[RAZORPAY CHECKOUT ERROR]', checkoutErr);
        setCancelModalVisible(true);
        return;
      }

      await verifyAndActivate({
        razorpay_order_id: checkoutResult.razorpay_order_id,
        razorpay_payment_id: checkoutResult.razorpay_payment_id,
        razorpay_signature: checkoutResult.razorpay_signature,
      });
    } catch (err) {
      console.error('[CREATE ORDER ERROR]', err);
      const message = err.response?.data?.message
        || (err.response?.status === 401 ? 'Your session has expired. Please sign in again.' : null)
        || (err.code === 'ECONNABORTED' ? 'The payment server took too long to respond. Please try again.' : null)
        || err.message
        || 'Could not connect to the payment server. Check your internet connection.';
      Alert.alert('Payment Error', message);
      setProcessingPayment(false);
    }
  };

  const verifyAndActivate = async (payload) => {
    try {
      const res = await http.post(ENDPOINTS.verifyPayment, payload);

      if (res.data?.success) {
        setSuccessModalVisible(true);
        await fetchSubscriptionData();
        if (fetchSubscriptionStatus) await fetchSubscriptionStatus();
        if (refreshNames) await refreshNames();
      } else {
        Alert.alert('Verification Failed', res.data?.message || 'Payment verification could not be completed.');
      }
    } catch (err) {
      console.error('[VERIFY PAYMENT ERROR]', err);
      Alert.alert('Verification Error', err.response?.data?.message || 'Error processing payment verification.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const primaryColor = colors?.primary || '#06b6d4';
  const activePricing = plans?.pricing || { display: `${selectedRegion === 'IN' ? '₹120' : selectedRegion === 'AE' ? '9.99 AED' : '£6.99'} / month` };

  const isSubscribed = subStatus?.isSubscribed;
  const expiryDateFormatted = subStatus?.expiresAt
    ? new Date(subStatus.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <SafeAreaView style={[styles.root, { paddingBottom: insets.bottom }]} edges={['top', 'left', 'right']}>
      <TimeBasedBackground showElements={false}>
        {({ isNight }) => (
          <>
            <StatusBar barStyle={isNight ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: rs(16), paddingVertical: rs(12) }]}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={rs(24)} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text, fontSize: rs(18) }]}>Full Access Pass</Text>
              <View style={{ width: rs(28) }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={[
                styles.scrollBody,
                { paddingHorizontal: rs(16), paddingVertical: rs(12) },
                isTabletOrDesktop && styles.desktopContainer,
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Top Banner & Status */}
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    padding: rs(14),
                    borderRadius: rs(16),
                    marginBottom: rs(16),
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  {/* Left Side Content */}
                  <View style={{ flex: 1 }}>
                    {/* Sparkle icon + Title row with badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: rs(6) }}>
                      <View
                        style={[
                          styles.crownBadge,
                          {
                            width: rs(40),
                            height: rs(40),
                            borderRadius: rs(20),
                            backgroundColor: isSubscribed ? '#10B9811A' : (isDark ? 'rgba(6, 182, 212, 0.1)' : '#E0F7FA'),
                            marginRight: rs(10),
                          },
                        ]}
                      >
                        <Ionicons name="sparkles" size={rs(20)} color={isSubscribed ? '#10B981' : primaryColor} />
                      </View>
                      <Text style={[styles.statusTitle, { color: colors.text, fontSize: rs(16) }]}>
                        {isSubscribed ? '30-Day Pass Active' : 'Free Tier'}
                      </Text>
                      {!isSubscribed && (
                        <View
                          style={{
                            backgroundColor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#E0F7FA',
                            paddingHorizontal: rs(8),
                            paddingVertical: rs(3),
                            borderRadius: rs(8),
                            marginLeft: rs(8),
                            borderWidth: 1,
                            borderColor: isDark ? 'rgba(6, 182, 212, 0.3)' : primaryColor + '40',
                          }}
                        >
                          <Text style={{ color: primaryColor, fontSize: rs(10), fontWeight: '700' }}>
                            Cards 1–5 Unlocked
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Subtitle text */}
                    <Text style={[styles.statusSubtitle, { color: isDark ? '#94A3B8' : '#64748B', fontSize: rs(12), marginBottom: rs(12), lineHeight: rs(17) }]}>
                      {isSubscribed
                        ? `Full access active until ${expiryDateFormatted}`
                        : 'Unlock Cards 6 to 99 with the\n30-Day Full Access Pass'}
                    </Text>

                    {/* Progress bar */}
                    <View style={[styles.progressSection, { marginTop: rs(4) }]}>
                      <View style={styles.progressHeaderRow}>
                        <Text style={[styles.progressLabel, { color: isDark ? '#CBD5E1' : '#475569', fontSize: rs(12) }]}>Card Access Progress</Text>
                        <Text style={[styles.progressValue, { color: primaryColor, fontSize: rs(12) }]}>
                          {isSubscribed ? '99 / 99 Cards' : '5 / 99 Cards (Free)'}
                        </Text>
                      </View>
                      <View style={[styles.trackBg, { backgroundColor: isDark ? '#334155' : '#E2E8F0', height: rs(8), borderRadius: rs(4) }]}>
                        <View
                          style={[
                            styles.trackFill,
                            {
                              backgroundColor: isSubscribed ? '#10B981' : primaryColor,
                              width: isSubscribed ? '100%' : '15%',
                              borderRadius: rs(4),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Right Side — Cards Image */}
                  <View style={{ marginLeft: rs(8), justifyContent: 'center', alignItems: 'center' }}>
                    <Image
                      source={require('../../assets/subscription_cards.png')}
                      style={{ width: rs(110), height: rs(125), marginTop: rs(12) }}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>

              {/* Region Selector */}
              <View style={{ marginBottom: rs(16), display: 'none' }}>
                <Text style={[styles.sectionHeading, { color: colors.text, fontSize: rs(15), marginBottom: rs(8) }]}>
                  Select Your Country / Region
                </Text>
                <View style={[styles.regionRow, { gap: rs(8) }]}>
                  {REGIONS.map((reg) => {
                    const selected = selectedRegion === reg.id;
                    return (
                      <TouchableOpacity
                        key={reg.id}
                        style={[
                          styles.regionPill,
                          {
                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
                            borderColor: selected ? primaryColor : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                            borderWidth: selected ? 2 : 1,
                            paddingVertical: rs(8),
                            paddingHorizontal: rs(6),
                            borderRadius: rs(10),
                          },
                          selected && { backgroundColor: primaryColor + '15' },
                        ]}
                        onPress={() => setSelectedRegion(reg.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: rs(16) }}>{reg.flag}</Text>
                        <Text style={[styles.regionPillText, { color: selected ? primaryColor : isDark ? '#E2E8F0' : '#334155', fontSize: rs(11), marginTop: rs(2) }]}>
                          {reg.label}
                        </Text>
                        <Text style={[styles.regionPillPrice, { color: selected ? primaryColor : isDark ? '#94A3B8' : '#64748B', fontSize: rs(10), marginTop: rs(2) }]}>
                          {reg.price}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Main Plan Card */}
              {!!loadError && (
                <View style={[styles.errorCard, { borderRadius: rs(12), padding: rs(12), marginBottom: rs(16) }]}>
                  <Ionicons name="cloud-offline-outline" size={rs(20)} color="#DC2626" />
                  <Text style={[styles.errorText, { fontSize: rs(12) }]}>{loadError}</Text>
                  <TouchableOpacity onPress={fetchSubscriptionData} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
              <View
                style={[
                  styles.planCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#FFFFFF',
                    borderColor: primaryColor,
                    borderRadius: rs(20),
                    padding: rs(14),
                    borderWidth: 2,
                    marginBottom: rs(16),
                  },
                ]}
              >
                <View style={[styles.recommendedTag, { backgroundColor: primaryColor, top: -rs(12), paddingHorizontal: rs(12), paddingVertical: rs(4), borderRadius: rs(10) }]}>
                  <Text style={[styles.recommendedText, { fontSize: rs(10) }]}>MOST POPULAR PASS</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: rs(8), marginBottom: rs(12) }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: colors.text, fontSize: rs(20), textAlign: 'left', lineHeight: rs(28) }]}>
                      30-Day{'\n'}Full Access Pass
                    </Text>
                    <View style={[styles.priceRow, { marginTop: rs(8), justifyContent: 'flex-start' }]}>
                      <Text style={[styles.priceMain, { color: primaryColor, fontSize: rs(32) }]}>
                        {activePricing.display?.split('/')[0]?.trim() || '₹120'}
                      </Text>
                      <Text style={[styles.priceSub, { color: isDark ? '#94A3B8' : '#64748B', fontSize: rs(13) }]}> / 30 days access</Text>
                    </View>
                  </View>
                  <Image
                    source={require('../../assets/subscription_shield.png')}
                    style={{ width: rs(140), height: rs(130), alignSelf: 'flex-start', marginTop: -rs(16) }}
                    resizeMode="contain"
                  />
                </View>

                {/* Features checklist */}
                <View style={[styles.featureList, { marginBottom: rs(12) }]}>
                  {[
                    'Unlock Cards 6 to 99 completely',
                    'Deep Guided Reflections & Insights',
                    'Instant Activation with Razorpay Verification',
                  ].map((feat, idx, arr) => (
                    <View
                      key={idx}
                      style={[
                        styles.featureItem,
                        { paddingVertical: rs(6) },
                        idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
                      ]}
                    >
                      <Ionicons name="checkmark-circle" size={rs(20)} color={primaryColor} style={{ marginRight: rs(12) }} />
                      <Text style={[styles.featureText, { color: isDark ? '#E2E8F0' : '#334155', fontSize: rs(14) }]}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* Action CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.ctaButton,
                    {
                      backgroundColor: primaryColor,
                      height: rs(48),
                      borderRadius: rs(14),
                    },
                    isSubscribed && { backgroundColor: '#10B981' },
                    processingPayment && { opacity: 0.7 },
                  ]}
                  onPress={handleCreateOrder}
                  disabled={processingPayment || !!loadError || !plans}
                  activeOpacity={0.85}
                >
                  {processingPayment ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      {/* <Ionicons name={isSubscribed ? 'shield-checkmark' : 'flash'} size={rs(20)} color="#FFFFFF" style={{ marginRight: rs(8) }} /> */}
                      <Text style={[styles.ctaButtonText, { fontSize: rs(15) }]}>
                        {isSubscribed ? 'Extend 30-Day Access Pass' : 'Unlock All 99 Cards Now'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.guaranteeText, { color: isDark ? '#64748B' : '#94A3B8', fontSize: rs(11), marginTop: rs(12) }]}>
                  Secure payment verified server-side with Razorpay
                </Text>
              </View>
            </ScrollView>

            {/* Success Celebration Modal */}
            <Modal visible={successModalVisible} transparent={true} animationType="bounce" onRequestClose={() => setSuccessModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', alignItems: 'center', borderRadius: rs(20), padding: rs(24) }]}>
                  <View style={[styles.successIconCircle, { width: rs(64), height: rs(64), borderRadius: rs(32), marginBottom: rs(14) }]}>
                    <Ionicons name="checkmark-sharp" size={rs(36)} color="#FFFFFF" />
                  </View>

                  <Text style={[styles.successTitle, { color: colors.text, fontSize: rs(20), marginBottom: rs(6) }]}>Pass Activated!</Text>
                  <Text style={[styles.successSubtitle, { color: isDark ? '#94A3B8' : '#64748B', fontSize: rs(13), lineHeight: rs(18) }]}>
                    Congratulations! All 99 Divine Cards have been successfully unlocked for 30 days.
                  </Text>

                  <TouchableOpacity
                    style={[styles.ctaButton, { backgroundColor: primaryColor, width: '100%', height: rs(48), borderRadius: rs(14), marginTop: rs(16) }]}
                    onPress={() => {
                      setSuccessModalVisible(false);
                      navigation.goBack();
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.ctaButtonText, { fontSize: rs(15) }]}>Start Learning</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Cancel Notification Modal */}
            <Modal visible={cancelModalVisible} transparent={true} animationType="fade" onRequestClose={() => setCancelModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', alignItems: 'center', borderRadius: rs(20), padding: rs(24) }]}>
                  <View style={[styles.successIconCircle, { backgroundColor: '#EF4444', width: rs(64), height: rs(64), borderRadius: rs(32), marginBottom: rs(14) }]}>
                    <Ionicons name="close-sharp" size={rs(36)} color="#FFFFFF" />
                  </View>

                  <Text style={[styles.successTitle, { color: colors.text, fontSize: rs(20), marginBottom: rs(6) }]}>Payment Cancelled</Text>
                  <Text style={[styles.successSubtitle, { color: isDark ? '#94A3B8' : '#64748B', fontSize: rs(13), lineHeight: rs(18), textAlign: 'center' }]}>
                    Your payment is cancelled.
                  </Text>

                  <TouchableOpacity
                    style={[styles.ctaButton, { backgroundColor: primaryColor, width: '100%', height: rs(48), borderRadius: rs(14), marginTop: rs(16) }]}
                    onPress={() => setCancelModalVisible(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.ctaButtonText, { fontSize: rs(15) }]}>Okay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </>
        )}
      </TimeBasedBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontWeight: '700' },
  scrollBody: { flexGrow: 1 },
  desktopContainer: { maxWidth: 600, alignSelf: 'center', width: '100%' },

  statusCard: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  crownBadge: { justifyContent: 'center', alignItems: 'center' },
  statusTitle: { fontWeight: '700', marginBottom: 2 },
  statusSubtitle: { fontWeight: '400' },

  progressSection: {},
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontWeight: '600' },
  progressValue: { fontWeight: '700' },
  trackBg: { overflow: 'hidden' },
  trackFill: { height: '100%' },

  sectionHeading: { fontWeight: '700' },
  regionRow: { flexDirection: 'row' },
  regionPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionPillText: { fontWeight: '600' },
  regionPillPrice: { fontWeight: '700' },

  planCard: {
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  recommendedTag: {
    position: 'absolute',
    alignSelf: 'center',
  },
  recommendedText: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.5 },

  planTitle: { fontWeight: '800', textAlign: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  priceMain: { fontWeight: '900' },
  priceSub: { fontWeight: '600' },

  featureList: {},
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontWeight: '500', flex: 1 },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: { color: '#FFFFFF', fontWeight: '700' },
  guaranteeText: { textAlign: 'center' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { color: '#991B1B', flex: 1, lineHeight: 17 },
  retryButton: { paddingHorizontal: 8, paddingVertical: 6 },
  retryText: { color: '#0891B2', fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: { width: '100%', maxWidth: 440 },

  successIconCircle: {
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: { fontWeight: '800' },
  successSubtitle: { textAlign: 'center' },
});

export default SubscriptionScreen;
