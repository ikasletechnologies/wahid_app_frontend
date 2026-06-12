import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import SplashScreen    from '../screens/SplashScreen';
import PhoneScreen     from '../screens/PhoneScreen';
import OTPScreen       from '../screens/OTPScreen';
import LoginScreen     from '../screens/LoginScreen';
import RegisterScreen  from '../screens/RegisterScreen';
import TabNavigator    from './TabNavigator';
import NameDetailScreen from '../screens/NameDetailScreen';
import NowPlayingScreen from '../screens/NowPlayingScreen';
import SuccessScreen    from '../screens/SuccessScreen';
import StreakScreen        from '../screens/StreakScreen';
import MilestoneScreen    from '../screens/MilestoneScreen';
import PersonalDetailsScreen from '../screens/PersonalDetailsScreen';
import SettingsScreen     from '../screens/SettingsScreen';

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
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="NowPlaying"
            component={NowPlayingScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen
            name="Streak"
            component={StreakScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Milestones"
            component={MilestoneScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="PersonalDetails"
            component={PersonalDetailsScreen}
            options={{ animation: 'slide_from_right' }}
          />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            </>
      ) : (
        // ── Unauthenticated — OTP + Login + Register flow ────────────────
        <>
          {/* Step 1: enter phone number + country code */}
          <Stack.Screen name="Phone" component={PhoneScreen} />
          {/* Step 2: enter 6-digit OTP (receives { phone } param) */}
          <Stack.Screen
            name="OTP"
            component={OTPScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Step 3a: existing user → password login */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animation: 'slide_from_right' }}
          />
          {/* Step 3b: new user → set username/password */}
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
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
