import type { RootState } from '@app/redux/store';

export const selectProfiles = (state: RootState) => state.profiles;
export const selectActiveProfileName = (state: RootState) =>
  state.profiles.activeProfile;
export const selectActiveProfileConfig = (state: RootState) =>
  state.profiles.activeProfile
    ? state.profiles.configs[state.profiles.activeProfile]
    : undefined;
export const selectActiveProfileSettings = (state: RootState) =>
  state.profiles.activeProfile
    ? state.profiles.settings[state.profiles.activeProfile]
    : undefined;
export const selectActiveProfileRuntimeData = (state: RootState) =>
  state.profiles.activeProfile
    ? state.profiles.runtimeData[state.profiles.activeProfile] || {
        ready: false,
      }
    : { ready: false };
