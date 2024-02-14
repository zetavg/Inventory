import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const baseTheme = {
  version: 3,
  // roundness: 2,
} as const;

export const lightTheme = {
  ...MD3LightTheme,
  ...baseTheme,
  colors: {
    ...MD3LightTheme.colors,
    // primary: '#3498db',
    // secondary: '#f1c40f',
    // tertiary: '#a1b2c3',
  },
} as const;

export const darkTheme = {
  ...MD3DarkTheme,
  ...baseTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // primary: '#3498db',
    // secondary: '#f1c40f',
    // tertiary: '#a1b2c3',
  },
} as const;
