import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const ITEM_HEIGHT = 40;
const WHEEL_HEIGHT = ITEM_HEIGHT * 3;
const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

const pad = (value: number) => String(value).padStart(2, '0');

function Wheel({ testID, label, values, selected, onSelect }: {
  testID: string;
  label: string;
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  const theme = useTheme();
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    requestAnimationFrame(() => ref.current?.scrollTo({ y: selected * ITEM_HEIGHT, animated: false }));
    // Position the wheel once on mount; afterwards the user drives scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ScrollView
      ref={ref}
      testID={testID}
      accessibilityLabel={label}
      style={styles.wheel}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      contentContainerStyle={styles.wheelContent}
      onMomentumScrollEnd={(event) => {
        const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(values.length - 1, index));
        if (values[clamped] !== selected) onSelect(values[clamped]);
      }}
    >
      {values.map((value) => (
        <View key={value} style={styles.item}>
          <Text variant="titleMedium" style={{ fontWeight: value === selected ? '800' : '500', color: value === selected ? theme.colors.primary : theme.colors.onSurfaceVariant }}>{pad(value)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function TimeWheelPicker({ value, onChange, testID = 'time-wheel-picker' }: { value: string; onChange: (time: string) => void; testID?: string }) {
  const theme = useTheme();
  const [rawHour, rawMinute] = value.split(':');
  const hour = Math.max(0, Math.min(23, Number(rawHour) || 0));
  const minute = Math.max(0, Math.min(59, Number(rawMinute) || 0));
  return (
    <View style={styles.row} testID={testID}>
      <View pointerEvents="none" style={[styles.band, { backgroundColor: theme.colors.surfaceVariant }]} />
      <Wheel testID={`${testID}-hour`} label="Hour" values={HOURS} selected={hour} onSelect={(next) => onChange(`${pad(next)}:${pad(minute)}`)} />
      <Text variant="titleMedium" style={{ fontWeight: '800' }}>:</Text>
      <Wheel testID={`${testID}-minute`} label="Minute" values={MINUTES} selected={minute} onSelect={(next) => onChange(`${pad(hour)}:${pad(next)}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, height: WHEEL_HEIGHT },
  band: { position: 'absolute', left: 0, right: 0, top: ITEM_HEIGHT, height: ITEM_HEIGHT, borderRadius: 10, opacity: 0.55 },
  wheel: { height: WHEEL_HEIGHT },
  wheelContent: { paddingVertical: ITEM_HEIGHT },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', minWidth: 54, paddingHorizontal: 8 },
});