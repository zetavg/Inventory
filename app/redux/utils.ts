import {
  Action,
  ActionFromReducersMapObject,
  combineReducers,
  PreloadedStateShapeFromReducersMapObject,
  Reducer,
  StateFromReducersMapObject,
} from 'redux';
import { createTransform, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActionCreatorWithoutPayload,
  ActionCreatorWithPayload,
  PayloadAction,
} from '@reduxjs/toolkit';

export function combineAndPersistReducers<M>(
  reducers: M,
  key: string = 'root-state',
): M[keyof M] extends Reducer<any, any, any> | undefined
  ? Reducer<
      StateFromReducersMapObject<M>,
      ActionFromReducersMapObject<M>,
      Partial<PreloadedStateShapeFromReducersMapObject<M>>
    >
  : never {
  const combinedReducer = combineReducers(reducers);

  const Transform = createTransform(
    // transform state on its way to being serialized and persisted.
    (inboundState, k) => {
      const reducer = (reducers as any)[k];
      if (!reducer) return;

      if (typeof reducer.dehydrate === 'function') {
        return reducer.dehydrate(inboundState);
      }
    },
    // transform state being rehydrated
    (outboundState, k) => {
      const reducer = (reducers as any)[k];
      if (!reducer) return;

      if (typeof reducer.rehydrate === 'function') {
        return reducer.rehydrate(outboundState);
      }
    },
  );

  return persistReducer(
    {
      key,
      transforms: [Transform],
      storage: AsyncStorage,
      timeout: 50000,
    },
    combinedReducer as any,
  ) as any;
}

export function mapActionReducers<
  S,
  T extends Record<
    string,
    ActionCreatorWithoutPayload | ActionCreatorWithPayload<any>
  >,
>(
  actionCreators: T,
  fn: <U extends keyof T>(
    actionCreator: T[U],
  ) => (state: S, action: PayloadAction<any> & Action) => any,
): {
  [K in keyof T]: T[K] extends ActionCreatorWithPayload<infer P>
    ? (state: S, action: PayloadAction<P>) => any
    : (state: S) => any;
} {
  return Object.fromEntries(
    Object.entries(actionCreators).map(([key, actionCreator]) => [
      key,
      fn(actionCreator as any),
    ]),
  ) as any;
}

export function mapSelectors<S, T extends Record<string, (s: any) => any>>(
  selectors: T,
  fn: <U extends keyof T>(
    selector: T[U],
  ) => (state: S) => ReturnType<T[string] /* T[U] does not work */>,
): { [K in keyof T]: (s: S) => ReturnType<T[K]> } {
  return Object.fromEntries(
    Object.entries(selectors).map(([key, selector]) => [
      key,
      fn(selector as any),
    ]),
  ) as any;
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export function combine<T extends Array<Record<string, any>>>(
  ...objs: T
): UnionToIntersection<T[number]> {
  const keys = new Set<string>();
  for (const obj of objs) {
    for (const key in obj) {
      if (keys.has(key)) {
        throw new Error(`[redux/utils combine]: Collision detected: '${key}'.`);
      } else {
        keys.add(key);
      }
    }
  }

  return Object.assign({}, ...objs);
}
