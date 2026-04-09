import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen    from '../screens/SplashScreen';
import PhoneScreen     from '../screens/PhoneScreen';
import OTPScreen       from '../screens/OTPScreen';
import TabNavigator    from './TabNavigator';
import NameDetailScreen from '../screens/NameDetailScreen';
import RegisterProfileScreen from '../screens/RegisterProfileScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // ── Authenticated ────────────────────────────────────────────────
        !user.name ? (
          <Stack.Screen name="RegisterProfile" component={RegisterProfileScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="NameDetail"
              component={NameDetailScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </>
        )
      ) : (
        // ── Unauthenticated — OTP flow ───────────────────────────────────
        <>
          {/* Step 1: enter phone number + country code */}
          <Stack.Screen name="Phone" component={PhoneScreen} />
          {/* Step 2: enter 6-digit OTP (receives { phone } param) */}
          <Stack.Screen
            name="OTP"
            component={OTPScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
