import { LayoutAnimation } from 'react-native';

export const DEFAULT_LAYOUT_ANIMATION_CONFIG = {
  ...LayoutAnimation.Presets.easeInEaseOut,
  duration: 100,
};

export const DEFAULT_LAYOUT_ANIMATION_CONFIG_SLOWER = {
  ...LayoutAnimation.Presets.easeInEaseOut,
  duration: 200,
};
