import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SplashScreen from '../screens/SplashScreen';
import PhoneScreen from '../screens/PhoneScreen';
import OTPScreen from '../screens/OTPScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';
import NameDetailScreen from '../screens/NameDetailScreen';
import NowPlayingScreen from '../screens/NowPlayingScreen';
import SuccessScreen from '../screens/SuccessScreen';
import StreakScreen from '../screens/StreakScreen';
import PersonalDetailsScreen from '../screens/PersonalDetailsScreen';

import SubscriptionScreen from '../screens/SubscriptionScreen';
import NamesListScreen from '../screens/NamesListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import LearnedScreen from '../screens/LearnedScreen';
import MasteredScreen from '../screens/MasteredScreen';
import SuggestedNamesScreen from '../screens/SuggestedNamesScreen';
import CategoriesScreen from '../screens/CategoriesScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // ── Authenticated ────────────────────────────────────────────────
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="NameDetail"
            component={NameDetailScreen}
            options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
          />
          <Stack.Screen
            name="NowPlaying"
            component={NowPlayingScreen}
            options={{ animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen
            name="Streak"
            component={StreakScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="PersonalDetails"
            component={PersonalDetailsScreen}
            options={{ animation: 'slide_from_right' }}
          />

          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationScreen}
            options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="NamesList"
            component={NamesListScreen}
            options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
          />
          <Stack.Screen
            name="SuggestedNames"
            component={SuggestedNamesScreen}
            options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
          />
          <Stack.Screen
            name="Categories"
            component={CategoriesScreen}
            options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
          />
          <Stack.Screen
            name="Learned"
            component={LearnedScreen}
            options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
          />
          <Stack.Screen
            name="Mastered"
            component={MasteredScreen}
            options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      ) : (
        // ── Unauthenticated — OTP + Login + Register flow ────────────────
        <>


          {/* Step 1: existing user → password login (Default Screen) */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Step 2: enter phone number + country code for Sign Up */}
          <Stack.Screen
            name="Phone"
            component={PhoneScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Step 3: enter 6-digit OTP (receives { phone } param) */}
          <Stack.Screen
            name="OTP"
            component={OTPScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Step 3b: new user → set username/password */}
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ animation: 'slide_from_right' }}
          />

          {/* Forgot password → OTP → reset */}
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Step 4: registration success → then completeLogin() switches to auth stack */}

          <Stack.Screen
            name="Success"
            component={SuccessScreen}
            options={{ animation: 'fade', gestureEnabled: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
