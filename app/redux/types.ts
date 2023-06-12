import { Reducer } from 'redux';

export type PersistableReducer<R extends Reducer> = R extends Reducer<
  infer S
  // infer A,
  // infer PreloadedState
>
  ? R & {
      dehydrate?: (state: S) => any;
      rehydrate?: (dehydratedState: any) => S;
    }
  : never;
