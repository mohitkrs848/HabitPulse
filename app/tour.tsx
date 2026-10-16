import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabitStore } from '../src/hooks/useHabitStore';

type Step = { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; title: string; body: string };

const STEPS: Step[] = [
  { icon: 'shield-lock-outline', title: 'Welcome to HabitPulse', body: 'Your habits stay on this device. No account, no ads, no tracking.' },
  { icon: 'plus-circle-outline', title: 'Add your first habit', body: 'Open the Habits tab and tap + to create a habit. Pick a schedule: daily, hourly, weekly target, specific weekdays, or every N days.' },
  { icon: 'check-circle-outline', title: 'Check in each day', body: 'Use the Today tab to mark habits done with one tap. Tap again to undo, and add a note if you like.' },
  { icon: 'bell-outline', title: 'Set reminders', body: 'Add one or more reminder times inside any habit. Reminders need a development build, not Expo Go.' },
  { icon: 'chart-line', title: 'Watch your progress', body: 'Insights shows streaks, charts, and a calendar heatmap. Back up your data anytime from Settings.' },
];

export default function TourScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { setTourCompleted } = useHabitStore();
  const listRef = useRef<FlatList<Step>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === STEPS.length - 1;

  const finish = () => {
    setTourCompleted(true);
    if (router.canGoBack()) router.back();
    else router.replace('/today');
  };

  const next = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: 12, minHeight: 48 }}>
        {!isLast && <Button onPress={finish}>Skip</Button>}
      </View>
      <FlatList
        ref={listRef}
        data={STEPS}
        keyExtractor={(step) => step.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={item.icon} size={56} color={theme.colors.onPrimaryContainer} />
            </View>
            <Text variant="headlineSmall" style={{ fontWeight: '800', textAlign: 'center' }}>{item.title}</Text>
            <Text variant="bodyLarge" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>{item.body}</Text>
          </View>
        )}
      />
      <View style={{ padding: 24, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {STEPS.map((step, i) => (
            <View key={step.title} style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? theme.colors.primary : theme.colors.outlineVariant }} />
          ))}
        </View>
        <Button mode="contained" onPress={next}>{isLast ? 'Get started' : 'Next'}</Button>
      </View>
    </SafeAreaView>
  );
}