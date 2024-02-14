import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePersistedState = <T>(
  key: string,
  initialState: T | (() => T),
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const [state, setState] = useState(initialState);
  const [initialized, setInitialized] = useState(false);

  React.useEffect(() => {
    async function fetchData() {
      const value = await AsyncStorage.getItem(`@use_persisted_state/${key}`);

      if (value !== null) {
        setState(JSON.parse(value));
      }

      setInitialized(true);
    }

    fetchData();
  }, [key]);

  React.useEffect(() => {
    AsyncStorage.setItem(`@use_persisted_state/${key}`, JSON.stringify(state));
  }, [key, state]);

  return [state, setState, initialized];
};
