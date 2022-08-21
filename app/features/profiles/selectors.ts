import type { RootState } from '@app/redux/store';

export const selectProfiles = (state: RootState) => state.profiles;
export const selectActiveProfileName = (state: RootState) =>
  state.profiles.activeProfile;
export const selectActiveProfileNameOrThrowError = (state: RootState) => {
  const n = state.profiles.activeProfile;
  if (!n) throw new Error('No active profile');
  return n;
};

export const selectActiveProfileConfig = (state: RootState) =>
  state.profiles.activeProfile
    ? state.profiles.configs[state.profiles.activeProfile]
    : undefined;
export const selectActiveProfileRuntimeData = (state: RootState) =>
  state.profiles.activeProfile
    ? state.profiles.runtimeData[state.profiles.activeProfile] || {
        ready: false,
      }
    : { ready: false };
