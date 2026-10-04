import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HabitStoreProvider, useHabitStore } from '../hooks/useHabitStore';
import { habitDarkTheme, habitLightTheme } from '../theme/paperTheme';

function ThemedNavigation() {
  const { data } = useHabitStore();
  const systemTheme = useColorScheme();
  const isDark = data.settings.theme === 'dark' || (data.settings.theme === 'system' && systemTheme === 'dark');

  return (
    <PaperProvider theme={isDark ? habitDarkTheme : habitLightTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? '#111813' : '#F6F7F1' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit/[id]" options={{ headerShown: true, title: 'Habit details', presentation: 'card' }} />
        <Stack.Screen name="habit/edit" options={{ headerShown: true, title: 'Habit details', presentation: 'modal' }} />
        <Stack.Screen name="privacy" options={{ headerShown: true, title: 'Privacy' }} />
      </Stack>
    </PaperProvider>
  );
}

export default function HabitPulseProviders() {
  return (
    <SafeAreaProvider>
      <HabitStoreProvider>
        <ThemedNavigation />
      </HabitStoreProvider>
    </SafeAreaProvider>
  );
}
