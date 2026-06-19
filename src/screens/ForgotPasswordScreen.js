import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Dimensions, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const COUNTRIES = [
  { code: '+91',  name: 'India' },
  { code: '+1',   name: 'USA/CA' },
  { code: '+44',  name: 'UK' },
  { code: '+971', name: 'UAE' },
  { code: '+92',  name: 'Pakistan' },
  { code: '+60',  name: 'Malaysia' },
  { code: '+966', name: 'Saudi Arabia' },
];

const OTP_LENGTH = 6;

const DecorativeBackground = ({ isDark }) => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    {/* Soft top-left glow */}
    <View style={[styles.topLeftGlow, isDark && { backgroundColor: '#00ACC1', opacity: 0.05 }]} />
    
    {/* Soft top-right grid of dots */}
    <View style={styles.topRightDots}>
      <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <Circle
              key={`${r}-${c}`}
              cx={20 + c * 16}
              cy={20 + r * 16}
              r={2}
              fill="#03B7CE"
              opacity={isDark ? 0.08 - (r + c) * 0.005 : 0.15 - (r + c) * 0.01}
            />
          ))
        )}
      </Svg>
    </View>
  </View>
);

const ForgotPasswordScreen = ({ navigation }) => {
  const { checkPhone, sendOTP, verifyOTP, resetPassword, login } = useAuth();
  const { isDark, colors } = useAppTheme();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'newPassword'

  // Phone step
  const [country, setCountry]     = useState(COUNTRIES[0]);
  const [phone, setPhone]         = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [fullPhone, setFullPhone] = useState('');

  // OTP step
  const [otpValue, setOtpValue]   = useState('');
  const [otpFocused, setOtpFocused] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const otpRef = useRef(null);

  // New password step
  const [newPassword, setNewPassword]             = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [showNewPassword, setShowNewPassword]     = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwFocused, setPwFocused]                 = useState(null);
  const confirmRef = useRef(null);

  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer]         = useState(30);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    let intervalId;
    if (step === 'otp' && timer > 0) {
      intervalId = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, timer]);

  useEffect(() => {
    // Trigger animation when step changes
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, [step]);

  const handleBack = () => {
    if (step === 'otp')         return setStep('phone');
    if (step === 'newPassword') return setStep('otp');
    navigation.goBack();
  };

  // ── Step 1: send OTP ─────────────────────────────────────────────────────

  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      Toast.show({ type: 'error', text1: 'Invalid Number', text2: 'Please enter a valid phone number.' });
      return;
    }
    const fp = `${country.code}${digits}`;

    setLoading(true);
    const check = await checkPhone(fp);
    if (!check.success) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Error', text2: check.message });
      return;
    }
    if (!check.exists) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Not Registered', text2: 'This number is not registered. Please sign up first.' });
      return;
    }

    const result = await sendOTP(fp);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Could Not Send OTP', text2: result.message });
      return;
    }
    setFullPhone(fp);
    setOtpValue('');
    setStep('otp');
    setTimer(30);
    Toast.show({ type: 'success', text1: 'OTP Sent', text2: `Code sent to ${fp}` });
  };

  // ── Step 2: verify OTP ───────────────────────────────────────────────────

  const handleVerifyOTP = async (code) => {
    setLoading(true);
    const result = await verifyOTP(fullPhone, code);
    setLoading(false);
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Wrong Code', text2: result.message });
      return;
    }
    setVerificationToken(result.verificationToken);
    setStep('newPassword');
  };

  const handleOtpChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpValue(digits);
    if (digits.length === OTP_LENGTH) handleVerifyOTP(digits);
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    const result = await sendOTP(fullPhone);
    setResending(false);
    if (result.success) {
      Toast.show({ type: 'success', text1: 'Code Sent', text2: 'OTP has been resent.' });
      setTimer(30);
    }
  };

  // ── Step 3: reset password ────────────────────────────────────────────────

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Incomplete', text2: 'Please fill in both password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mismatch', text2: 'Passwords do not match.' });
      return;
    }
    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!hasMinLength || !hasNumber || !hasSpecialChar) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password must meet all complexity requirements.' });
      return;
    }
    setLoading(true);
    const result = await resetPassword(verificationToken, newPassword);
    if (!result.success) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Reset Failed', text2: result.message });
      return;
    }
    const loginResult = await login(fullPhone, newPassword);
    setLoading(false);
    if (!loginResult.success) {
      Toast.show({ type: 'error', text1: 'Login Failed', text2: 'Password reset but could not sign in. Please log in manually.' });
      navigation.navigate('Login', { identifier: fullPhone });
      return;
    }
    Toast.show({ type: 'success', text1: 'Welcome back!', text2: 'Password reset and signed in successfully.' });
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderPhone = () => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/lock.png')}
          style={styles.lockImage}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>
          Forgot <Text style={styles.titleAccent}>Password?</Text>
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>
          Don’t worry! Enter your mobile number{'\n'}and we’ll send you a verification code.
        </Text>
      </View>

      <View style={[
        styles.card,
        {
          backgroundColor: isDark ? '#111111' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
        }
      ]}>
        <Text style={[styles.label, { color: isDark ? '#E2E8F0' : '#0F203C' }]}>Mobile Number</Text>
        <View style={[
          styles.inputRow,
          {
            backgroundColor: isDark ? '#161616' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'
          },
          phoneFocused && (isDark ? { borderColor: '#00ACC1', backgroundColor: '#191919' } : styles.inputRowFocused)
        ]}>
          <TouchableOpacity style={styles.countryBtn} onPress={() => setShowPicker(v => !v)} activeOpacity={0.7}>
            <Text style={[styles.countryCode, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>{country.code}</Text>
            <Ionicons name="chevron-down" size={14} color="#00ACC1" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <View style={[styles.inputDivider, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]} />
          <TextInput
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#0F203C' }]}
            placeholder="Enter mobile number"
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={handleSendOTP}
            selectionColor="#03B7CE"
          />
          <Ionicons name="phone-portrait-outline" size={20} color="#00ACC1" style={styles.inputIcon} />
        </View>

        {showPicker && (
          <View style={[styles.picker, isDark && { backgroundColor: '#161616', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <ScrollView style={styles.pickerScroll} nestedScrollEnabled={true}>
              {COUNTRIES.map(c => (
                <TouchableOpacity key={c.code} style={styles.pickerItem} onPress={() => { setCountry(c); setShowPicker(false); }}>
                  <Text style={[styles.pickerCode, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>{c.code}</Text>
                  <Text style={[styles.pickerName, { color: isDark ? '#A0AEC0' : '#718096' }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity onPress={handleSendOTP} disabled={loading} activeOpacity={0.85} style={styles.buttonWrapper}>
          <LinearGradient
            colors={['#00BAD4', '#0097AB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Send OTP</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonIcon} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.rememberRow}>
        <View style={[styles.rememberLine, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        <Text style={[styles.rememberText, isDark && { color: '#94A3B8' }]}>Remember your password?</Text>
        <View style={[styles.rememberLine, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
      </View>

      <TouchableOpacity onPress={handleBack} style={styles.backLink} activeOpacity={0.7}>
        <Text style={styles.backLinkText}>Back to Sign In</Text>
        <Ionicons name="arrow-forward" size={16} color="#00ACC1" style={styles.backLinkIcon} />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderOTP = () => {
    const formattedTimer = `00:${timer < 10 ? `0${timer}` : timer}`;
    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/verify.png')}
            style={styles.lockImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>
            Verify <Text style={{ color: '#03B7CE' }}>OTP</Text>
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={{ color: '#03B7CE', fontWeight: '700' }}>{fullPhone}</Text>
          </Text>
        </View>

        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? '#111111' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
          }
        ]}>
          <TouchableOpacity activeOpacity={1} onPress={() => otpRef.current?.focus()} style={styles.otpRow}>
            {Array(OTP_LENGTH).fill(0).map((_, i) => {
              const isCursor = otpFocused && otpValue.length === i;
              const isFilled = i < otpValue.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: isDark ? '#161616' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    },
                    isCursor && { borderColor: '#03B7CE', borderWidth: 2 },
                    isFilled && { borderColor: isDark ? '#03B7CE' : '#E2E8F0' }
                  ]}
                >
                  {isCursor ? (
                    <Text style={[styles.otpDigit, { color: '#03B7CE' }]}>|</Text>
                  ) : (
                    <Text style={[
                      styles.otpDigit,
                      { color: isDark ? '#FFFFFF' : '#0F203C' },
                      otpValue[i] === undefined && { color: isDark ? '#4A5568' : '#718096', fontSize: 28, marginTop: -4 }
                    ]}>
                      {otpValue[i] !== undefined ? otpValue[i] : '•'}
                    </Text>
                  )}
                </View>
              );
            })}
            <TextInput
              ref={otpRef}
              style={styles.hiddenInput}
              value={otpValue}
              onChangeText={handleOtpChange}
              onFocus={() => setOtpFocused(true)}
              onBlur={() => setOtpFocused(false)}
              maxLength={OTP_LENGTH}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoFocus
              caretHidden
            />
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={[styles.resendPromptText, { color: isDark ? '#A0AEC0' : '#718096', textAlign: 'center' }]}>
                Resend OTP in <Text style={{ color: '#03B7CE', fontWeight: '700' }}>{formattedTimer}</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
                {resending ? (
                  <ActivityIndicator size="small" color="#03B7CE" />
                ) : (
                  <Text style={styles.resendLinkText}>Resend OTP</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => handleVerifyOTP(otpValue)}
            disabled={loading || otpValue.length < OTP_LENGTH}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#00BAD4', '#0097AB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Verify OTP</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleBack} style={styles.backLink} activeOpacity={0.7}>
          <Text style={styles.backLinkText}>Back to Phone</Text>
          <Ionicons name="arrow-forward" size={16} color="#00ACC1" style={styles.backLinkIcon} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderNewPassword = () => {
    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const score = (hasMinLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecialChar ? 1 : 0);

    let strengthText = '';
    let strengthColor = '#E2E8F0';
    if (score === 1) {
      strengthText = 'Weak';
      strengthColor = '#EF4444';
    } else if (score === 2) {
      strengthText = 'Medium';
      strengthColor = '#F59E0B';
    } else if (score === 3) {
      strengthText = 'Strong';
      strengthColor = '#03B7CE';
    }

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/lockwithkey.png')}
            style={styles.lockImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F203C' }]}>
            Create New <Text style={{ color: '#03B7CE' }}>Password</Text>
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>
            Your new password must be{'\n'}different from previous passwords.
          </Text>
        </View>

        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? '#111111' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'
          }
        ]}>
          {/* New Password Input */}
          <View style={[
            styles.inputRowCard,
            {
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'
            },
            pwFocused === 'new' && { borderColor: '#00ACC1', borderWidth: 1.5 }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#64748B' : '#7A8FA6'} style={styles.inputCardIcon} />
            <View style={styles.inputCardContent}>
              <Text style={[styles.inputCardLabel, { color: isDark ? '#64748B' : '#718096' }]}>New Password</Text>
              <TextInput
                style={[styles.inputCardField, { color: isDark ? '#FFFFFF' : '#0F203C' }]}
                placeholder="••••••••"
                placeholderTextColor={isDark ? '#4A5568' : '#A0AEC0'}
                value={newPassword}
                onChangeText={setNewPassword}
                onFocus={() => setPwFocused('new')}
                onBlur={() => setPwFocused(null)}
                secureTextEntry={!showNewPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                selectionColor="#03B7CE"
              />
            </View>
            <TouchableOpacity onPress={() => setShowNewPassword(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
              <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={isDark ? '#64748B' : '#7A8FA6'} />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={[
            styles.inputRowCard,
            {
              backgroundColor: isDark ? '#161616' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              marginTop: 16
            },
            pwFocused === 'confirm' && { borderColor: '#00ACC1', borderWidth: 1.5 }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#64748B' : '#7A8FA6'} style={styles.inputCardIcon} />
            <View style={styles.inputCardContent}>
              <Text style={[styles.inputCardLabel, { color: isDark ? '#64748B' : '#718096' }]}>Confirm Password</Text>
              <TextInput
                ref={confirmRef}
                style={[styles.inputCardField, { color: isDark ? '#FFFFFF' : '#0F203C' }]}
                placeholder="••••••••"
                placeholderTextColor={isDark ? '#4A5568' : '#A0AEC0'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setPwFocused('confirm')}
                onBlur={() => setPwFocused(null)}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
                selectionColor="#03B7CE"
              />
            </View>
            <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={styles.eyeBtn} activeOpacity={0.7}>
              <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={isDark ? '#64748B' : '#7A8FA6'} />
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator */}
          <View style={styles.strengthContainer}>
            <View style={styles.strengthHeader}>
              <Text style={[styles.strengthTitle, { color: isDark ? '#A0AEC0' : '#718096' }]}>Password Strength</Text>
              <Text style={[styles.strengthLabel, { color: score > 0 ? strengthColor : (isDark ? '#4A5568' : '#A0AEC0') }]}>
                {score > 0 ? strengthText : 'Too Short'}
              </Text>
            </View>
            <View style={styles.strengthBarsRow}>
              {Array.from({ length: 4 }).map((_, i) => {
                const filled = score === 1 ? i === 0 : score === 2 ? i < 2 : score === 3 ? i < 4 : false;
                return (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: isDark ? '#1F2937' : '#E5E7EB' },
                      filled && { backgroundColor: strengthColor }
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Requirements Checklist */}
          <View style={styles.requirementsContainer}>
            <View style={styles.requirementRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={hasMinLength ? '#03B7CE' : (isDark ? '#1F2937' : '#E5E7EB')}
              />
              <Text style={[styles.requirementText, { color: isDark ? '#A0AEC0' : '#475569' }, hasMinLength && { color: isDark ? '#FFFFFF' : '#0F203C' }]}>
                Minimum 8 characters
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={hasNumber ? '#03B7CE' : (isDark ? '#1F2937' : '#E5E7EB')}
              />
              <Text style={[styles.requirementText, { color: isDark ? '#A0AEC0' : '#475569' }, hasNumber && { color: isDark ? '#FFFFFF' : '#0F203C' }]}>
                At least 1 number
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={hasSpecialChar ? '#03B7CE' : (isDark ? '#1F2937' : '#E5E7EB')}
              />
              <Text style={[styles.requirementText, { color: isDark ? '#A0AEC0' : '#475569' }, hasSpecialChar && { color: isDark ? '#FFFFFF' : '#0F203C' }]}>
                At least 1 special character
              </Text>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity onPress={handleResetPassword} disabled={loading} activeOpacity={0.85} style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#00BAD4', '#0097AB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Reset Password</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleBack} style={styles.backLink} activeOpacity={0.7}>
          <Text style={styles.backLinkText}>Back to Verification</Text>
          <Ionicons name="arrow-forward" size={16} color="#00ACC1" style={styles.backLinkIcon} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={isDark ? ['#041012', '#080E10', '#050505'] : ['#EBF8FA', '#F4FDFE', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      <DecorativeBackground isDark={isDark} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Fixed elements - Back button */}
          <TouchableOpacity
            style={[
              styles.backBtn,
              isDark && { backgroundColor: '#111111', shadowColor: '#000', shadowOpacity: 0.1 }
            ]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#00ACC1" />
          </TouchableOpacity>

          {step === 'phone'       && renderPhone()}
          {step === 'otp'         && renderOTP()}
          {step === 'newPassword' && renderNewPassword()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  kav:  { flex: 1 },

  // New Password Custom Styles
  inputRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 60,
  },
  inputCardIcon: {
    marginRight: 12,
  },
  inputCardContent: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  inputCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCardField: {
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
    margin: 0,
    height: 20,
  },
  strengthContainer: {
    marginTop: 16,
    width: '100%',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  strengthTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  requirementsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '500',
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.06,
    paddingBottom: 36,
  },

  // Back Button
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#0F203C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Decorative Background
  topLeftGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#03B7CE',
    opacity: 0.08,
  },
  topRightDots: {
    position: 'absolute',
    top: 20,
    right: -20,
  },

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lockImage: {
    width: 200,
    height: 170,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F203C',
    textAlign: 'center',
    marginBottom: 6,
  },
  titleAccent: {
    color: '#00BAD4',
  },
  subtitle: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 16,
  },

  // Card styles
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F203C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F203C',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    position: 'relative',
  },
  inputRowFocused: {
    borderColor: '#00ACC1',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  countryCode: {
    color: '#0F203C',
    fontSize: 14,
    fontWeight: '600',
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#0F203C',
    fontSize: 14,
    height: '100%',
  },
  inputIcon: {
    marginLeft: 6,
  },
  eyeBtn: {
    padding: 6,
  },

  // Picker
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 150,
    zIndex: 100,
  },
  pickerScroll: {
    paddingVertical: 6,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  pickerCode: { color: '#0F203C', fontSize: 13, fontWeight: '600', width: 44 },
  pickerName: { color: '#718096', fontSize: 13 },

  // OTP Styles
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  otpBox: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: '#00ACC1',
    backgroundColor: '#F4FDFE',
  },
  otpDigit: {
    color: '#0F203C',
    fontSize: 18,
    fontWeight: '700',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0,
  },

  // Resend OTP
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendPromptText: {
    color: '#718096',
    fontSize: 12,
  },
  resendLinkText: {
    color: '#00ACC1',
    fontSize: 12,
    fontWeight: '700',
  },

  // Button Wrapper
  buttonWrapper: {
    marginTop: 8,
    width: '100%',
  },
  button: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00BAD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  buttonIcon: {
    marginTop: 1,
  },

  // Divider for footer
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
    gap: 10,
  },
  rememberLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  rememberText: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '600',
  },

  // Back Link
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  backLinkText: {
    color: '#00ACC1',
    fontSize: 14,
    fontWeight: '700',
  },
  backLinkIcon: {
    marginTop: 1,
  },
});

export default ForgotPasswordScreen;
