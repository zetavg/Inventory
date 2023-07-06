import React, { useContext } from 'react';
import { Button, Dimensions, SafeAreaView, View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';

// import { usePersistedState } from '@app/hooks/usePersistedState';
import { darkTheme, lightTheme } from '@app/theme';

import StorybookUIRoot from '../.storybook/Storybook';

import ErrorBoundary from './components/ErrorBoundary';
import useIsDarkMode from './hooks/useIsDarkMode';

type Props = {
  darkMode?: boolean;
  hideAdditionalControls?: boolean;
};

function WrappedStorybookUIRoot({
  // darkMode: dm1,
  hideAdditionalControls,
}: Props) {
  const setStorybookMode = useSetStorybookModeFunction();
  // const [dm2, setDarkMode] = usePersistedState('storybook_dark_mode', false);

  // const darkMode = dm1 !== undefined ? dm1 : dm2;
  const darkMode = useIsDarkMode();

  const theme = darkMode ? darkTheme : lightTheme;

  const screenHeight = Dimensions.get('screen').height;
  const windowHeight = Dimensions.get('window').height;
  const navbarHeight = screenHeight - windowHeight;

  return (
    <PaperProvider theme={theme}>
      <View
        style={
          // eslint-disable-next-line react-native/no-inline-styles
          { overflow: 'hidden', flex: 1 }
        }
      >
        <ErrorBoundary>
          <StorybookUIRoot />
        </ErrorBoundary>
        {!hideAdditionalControls && (
          <SafeAreaView
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              backgroundColor: darkTheme.colors.background,
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              marginBottom: navbarHeight,
            }}
          >
            <View
              style={
                // eslint-disable-next-line react-native/no-inline-styles
                { paddingVertical: 8 }
              }
            >
              <Button
                title="Exit Storybook mode"
                onPress={() => setStorybookMode && setStorybookMode(false)}
              />
            </View>
            {/*<View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 8,
              }}
            >
              <Text theme={darkTheme}>Dark mode </Text>
              <Switch
                theme={darkTheme}
                value={darkMode}
                onValueChange={() => setDarkMode(m => !m)}
              />
            </View>*/}
          </SafeAreaView>
        )}
      </View>
    </PaperProvider>
  );
}

export const SetStorybookModeFunctionContext = React.createContext<
  ((v: boolean) => void) | null
>(null);

export function useSetStorybookModeFunction() {
  return useContext(SetStorybookModeFunctionContext);
}

export default WrappedStorybookUIRoot;
