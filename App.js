import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NamesProvider } from './src/context/NamesContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { ContentProvider } from './src/context/ContentContext';
import { PlaylistProvider } from './src/context/PlaylistContext';
import { MilestoneProvider } from './src/context/MilestoneContext';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic';
import { Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { Tinos_400Regular, Tinos_700Bold } from '@expo-google-fonts/tinos';
import { Carlito_400Regular, Carlito_700Bold } from '@expo-google-fonts/carlito';
import { FontSettingsProvider } from './src/context/FontSettingsContext';
import AppNavigator from './src/navigation/AppNavigator';
import ThemedToast from './src/components/ThemedToast';
import NetworkScreen from './src/screens/NetworkScreen';
import NetInfo from '@react-native-community/netinfo';

// Keep the native splash screen visible until the app is ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isOffline, setIsOffline] = React.useState(false);

  const [fontsLoaded] = useFonts({
    'NotoNaskhArabic-Regular': NotoNaskhArabic_400Regular,
    'NotoNaskhArabic-Bold': NotoNaskhArabic_700Bold,
    Roboto_400Regular,
    Roboto_700Bold,
    Tinos_400Regular,
    Tinos_700Bold,
    Carlito_400Regular,
    Carlito_700Bold,
  });

  React.useEffect(() => {
    if (!fontsLoaded) return;

    // Hide the native splash screen as soon as the JS is ready.
    // This allows the custom animated SplashScreen to take over.
    SplashScreen.hideAsync();

    // Listen to network status changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    return () => unsubscribe();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (isOffline) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FontSettingsProvider>
          <ThemeProvider>
            <NetworkScreen onConnectionRestored={() => setIsOffline(false)} />
            <ThemedToast />
          </ThemeProvider>
        </FontSettingsProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FontSettingsProvider>
        <NavigationContainer>
          <ThemeProvider>
            <AuthProvider>
              <LanguageProvider>
                <NamesProvider>
                  <MilestoneProvider>
                    <ContentProvider>
                      <PlaylistProvider>
                        <AppNavigator />
                        <ThemedToast />
                      </PlaylistProvider>
                    </ContentProvider>
                  </MilestoneProvider>
                </NamesProvider>
              </LanguageProvider>
            </AuthProvider>
          </ThemeProvider>
        </NavigationContainer>
      </FontSettingsProvider>
    </GestureHandlerRootView>
  );
}

