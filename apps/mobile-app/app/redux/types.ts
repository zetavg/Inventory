import { Reducer } from 'redux';

import { DeepPartial } from '@app/utils/types';

export type PersistableReducer<R extends Reducer> = R extends Reducer<
  infer S
  // infer A,
  // infer PreloadedState
>
  ? R & {
      dehydrate?: (state: S) => any;
      rehydrate?: (dehydratedState: any) => DeepPartial<S>;
      dehydrateSensitive?: (state: S) => any;
      rehydrateSensitive?: (dehydratedState: any) => DeepPartial<S>;
    }
  : never;
