import type { RootState } from '@app/redux/store';

export const selectSettings = (state: RootState) =>
  state.profiles.activeProfile
    ? state.settings[state.profiles.activeProfile]
    : undefined;
