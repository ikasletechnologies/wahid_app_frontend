import React from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NamesProvider } from './src/context/NamesContext';
import AppNavigator from './src/navigation/AppNavigator';

const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={{
      width: '90%',
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(201, 168, 76, 0.3)',
      borderLeftWidth: 4,
      borderLeftColor: '#c9a84c',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6
    }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 }}>{text1}</Text>
      {text2 ? <Text style={{ fontSize: 12, color: '#A1A1AA' }}>{text2}</Text> : null}
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={{
      width: '90%',
      backgroundColor: 'rgba(26, 26, 26, 0.95)',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 68, 68, 0.3)',
      borderLeftWidth: 4,
      borderLeftColor: '#FF4444',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6
    }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 }}>{text1}</Text>
      {text2 ? <Text style={{ fontSize: 12, color: '#A1A1AA' }}>{text2}</Text> : null}
    </View>
  )
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AuthProvider>
          <LanguageProvider>
            <NamesProvider>
              <AppNavigator />
              <Toast config={toastConfig} />
            </NamesProvider>
          </LanguageProvider>
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
