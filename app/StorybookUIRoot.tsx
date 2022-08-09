import React, { useContext } from 'react';
import { Dimensions, SafeAreaView, View } from 'react-native';
import {
  Provider as PaperProvider,
  Text,
  Button,
  Switch,
} from 'react-native-paper';
import StorybookUIRoot from '../.storybook/Storybook';
import { usePersistedState } from '@app/hooks/usePersistedState';
import { lightTheme, darkTheme } from '@app/theme';

type Props = {
  darkMode?: boolean;
  hideAdditionalControls?: boolean;
};

function WrappedStorybookUIRoot({
  darkMode: dm1,
  hideAdditionalControls,
}: Props) {
  const setStorybookMode = useSetStorybookModeFunction();
  const [dm2, setDarkMode] = usePersistedState('storybook_dark_mode', false);

  const darkMode = dm1 !== undefined ? dm1 : dm2;

  const theme = darkMode ? darkTheme : lightTheme;

  const screenHeight = Dimensions.get('screen').height;
  const windowHeight = Dimensions.get('window').height;
  const navbarHeight = screenHeight - windowHeight;

  return (
    <PaperProvider theme={theme}>
      <View style={{ overflow: 'hidden', flex: 1 }}>
        <StorybookUIRoot />
        {!hideAdditionalControls && (
          <SafeAreaView
            style={{
              backgroundColor: darkTheme.colors.background,
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              paddingVertical: 12,
              marginBottom: navbarHeight,
            }}
          >
            <Button
              mode="outlined"
              theme={darkTheme}
              onPress={() => setStorybookMode && setStorybookMode(false)}
            >
              Exit Storybook mode
            </Button>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text theme={darkTheme}>Dark mode </Text>
              <Switch
                theme={darkTheme}
                value={darkMode}
                onValueChange={() => setDarkMode(m => !m)}
              />
            </View>
          </SafeAreaView>
        )}
      </View>
    </PaperProvider>
  );
}

// eslint-disable-next-line no-spaced-func
export const SetStorybookModeFunctionContext = React.createContext<
  ((v: boolean) => void) | null
>(null);

export function useSetStorybookModeFunction() {
  return useContext(SetStorybookModeFunctionContext);
}

export default WrappedStorybookUIRoot;
