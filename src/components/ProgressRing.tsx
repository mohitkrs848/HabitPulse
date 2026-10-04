import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function ProgressRing({ progress, completed, total }: { progress: number; completed: number; total: number }) {
  const theme = useTheme();
  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, progress)) / 100);

  return (
    <View style={styles.container} accessibilityLabel={`${progress}% of habits completed today`}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.surfaceVariant} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.primary} strokeWidth={stroke} fill="none" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <View style={styles.center}>
        <Text variant="headlineMedium" style={{ fontWeight: '800' }}>{progress}%</Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{completed} of {total}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ container: { width: 132, height: 132, alignItems: 'center', justifyContent: 'center' }, center: { position: 'absolute', alignItems: 'center', gap: 1 } });
