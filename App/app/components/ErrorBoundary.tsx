import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import logger from '@app/logger';

import filterObjectKeys from '@app/utils/filterObjectKeys';

import Text from '@app/components/Text';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: unknown;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    let details = '';
    if (info && typeof info === 'object') {
      details += `Component stack:\n${(info as any).componentStack}\n`;
      const processedKeys = ['componentStack'];
      details +=
        'More info:\n' +
        JSON.stringify(
          Object.fromEntries(
            Object.entries(info).filter(
              ([k, _v]) => !processedKeys.includes(k),
            ),
          ),
          null,
          2,
        );
    } else {
      details += JSON.stringify(info, null, 2);
    }
    logger.error(error, {
      module: 'UIErrorBoundary',
      details,
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      const { fallback } = this.props;
      if (!fallback || typeof fallback === 'string') {
        let errorMessage = '';
        if (this.state.error instanceof Error) {
          errorMessage = this.state.error.message;
        }

        return (
          <SafeAreaView style={styles.defaultFallbackContainer}>
            <Text>
              {fallback || `Error: ${errorMessage || 'unknown error'}`}
            </Text>
          </SafeAreaView>
        );
      }

      return fallback;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  defaultFallbackContainer: {
    flex: 1,
  },
});
