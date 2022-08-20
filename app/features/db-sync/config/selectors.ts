import { selectActiveProfileConfig } from '@app/features/profiles';
import type { RootState } from '@app/redux/store';

export const selectConfig = (state: RootState) =>
  selectActiveProfileConfig(state)?.dbSync;
