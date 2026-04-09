import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NamesProvider } from './src/context/NamesContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ContentProvider } from './src/context/ContentContext';
import { PlaylistProvider } from './src/context/PlaylistContext';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import ThemedToast from './src/components/ThemedToast';

// Keep the native splash screen visible until the app is ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  React.useEffect(() => {
    // Hide the native splash screen as soon as the JS is ready.
    // This allows the custom animated SplashScreen to take over.
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <NamesProvider>
                <ContentProvider>
                  <PlaylistProvider>
                    <AppNavigator />
                    <ThemedToast />
                  </PlaylistProvider>
                </ContentProvider>
              </NamesProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
