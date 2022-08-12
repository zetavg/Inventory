import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@app/navigation/Navigation';
import useIsDarkMode from './useIsDarkMode';

type ReturnType = {
  statusBarStyle: 'light-content' | 'dark-content';
};

const defaultConfirmFn = (confirm: () => void) => {
  Alert.alert(
    'Discard data?',
    'You have unsaved data. Are you sure to discard them and leave?',
    [
      { text: "Don't leave", style: 'cancel', onPress: () => {} },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: confirm,
      },
    ],
  );
};

function useModalClosingHandler(
  navigation: StackScreenProps<RootStackParamList>['navigation'],
  preventClose: boolean,
  confirmFn: (confirm: () => void) => void = defaultConfirmFn,
): ReturnType {
  const [closing, setClosing] = useState(false);
  const isDarkMode = useIsDarkMode();
  const statusBarStyle = (() => {
    if (!closing) {
      return 'light-content';
    }

    return isDarkMode ? 'light-content' : 'dark-content';
  })();
  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        if (!preventClose) {
          setClosing(true);
          return;
        }

        e.preventDefault();

        const confirm = () => {
          navigation.dispatch(e.data.action);
          setClosing(true);
        };

        confirmFn(confirm);
      }),
    [navigation, preventClose, confirmFn],
  );

  return { statusBarStyle };
}

export default useModalClosingHandler;
