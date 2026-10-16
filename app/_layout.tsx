import HabitPulseProviders from '../src/components/HabitPulseProviders';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <HabitPulseProviders />
    </ErrorBoundary>
  );
}
