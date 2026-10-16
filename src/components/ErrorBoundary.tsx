import type { PropsWithChildren } from 'react';
import { Component, ErrorInfo } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <Text variant="headlineSmall" style={{ fontWeight: '800', textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text variant="bodyMedium" style={{ color: '#666', textAlign: 'center' }}>
            {error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <Button mode="contained" onPress={this.reset}>Try again</Button>
        </View>
      );
    }
    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  }
  WithErrorBoundary.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WithErrorBoundary;
}