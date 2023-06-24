import {
  Action,
  ActionFromReducersMapObject,
  combineReducers,
  PreloadedStateShapeFromReducersMapObject,
  Reducer,
  StateFromReducersMapObject,
} from 'redux';
import {
  ActionCreatorWithoutPayload,
  ActionCreatorWithPayload,
  PayloadAction,
} from '@reduxjs/toolkit';
import { createTransform, persistReducer } from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';

import AsyncStorage from '@react-native-async-storage/async-storage';

const sensitiveStorage = createSensitiveStorage({
  keychainService: 'app',
  sharedPreferencesName: 'shared_preferences',
});

function deepMerge(a: unknown, b: unknown) {
  if (b === undefined) return a;
  if (
    a === null ||
    Array.isArray(a) ||
    typeof a !== 'object' ||
    b === null ||
    Array.isArray(b) ||
    typeof b !== 'object'
  ) {
    return b;
  }

  const result: any = { ...a };

  Object.keys(b).forEach(key => {
    if (key in a) {
      result[key] = deepMerge((a as any)[key], (b as any)[key]);
    } else {
      result[key] = (b as any)[key];
    }
  });

  return result;
}

function autoMergeDeep<S>(
  inboundState: S,
  originalState: S,
  reducedState: S,
  { debug }: any,
): S {
  const newState = { ...reducedState };
  // only rehydrate if inboundState exists and is an object
  if (inboundState && typeof inboundState === 'object') {
    const keys: (keyof S)[] = Object.keys(inboundState) as any;
    keys.forEach(key => {
      // ignore _persist data
      if (key === '_persist') return;
      if (key === '_rehydrated_keys') return;
      // if reducer modifies substate, skip auto rehydration
      if (originalState[key] !== reducedState[key]) {
        if (process.env.NODE_ENV !== 'production' && debug)
          console.log(
            'redux-persist/stateReconciler: sub state for key `%s` modified, skipping.',
            key,
          );
        return;
      }
      if (isPlainEnoughObject(reducedState[key])) {
        newState[key] = deepMerge(newState[key], inboundState[key]);
        return;
      }
      // otherwise hard set
      newState[key] = inboundState[key];
    });
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    debug &&
    inboundState &&
    typeof inboundState === 'object'
  )
    console.log(
      `redux-persist/stateReconciler: rehydrated keys '${Object.keys(
        inboundState,
      ).join(', ')}'`,
    );

  return newState;
}

function isPlainEnoughObject(o: unknown) {
  return o !== null && !Array.isArray(o) && typeof o === 'object';
}

export function combineAndPersistReducers<M>(
  reducers: M,
  key: string = 'state',
): M[keyof M] extends Reducer<any, any, any> | undefined
  ? Reducer<
      StateFromReducersMapObject<M>,
      ActionFromReducersMapObject<M>,
      Partial<PreloadedStateShapeFromReducersMapObject<M>>
    >
  : never {
  const sensitivePersistedReducers: typeof reducers = Object.fromEntries(
    Object.entries(reducers as any).map(([k, r]: any) => {
      if (r.dehydrateSensitive && r.rehydrateSensitive) {
        const sKey = `${key}/${k}-sensitive`;
        const TransformSensitive = createTransform(
          // transform state on its way to being serialized and persisted.
          (inboundState, kk) => {
            const returnValue = r.dehydrateSensitive({ [kk]: inboundState })[
              kk
            ];
            // console.warn(
            //   `[persist-sensitive][${sKey}] inbound`,
            //   kk,
            //   inboundState,
            //   returnValue,
            // );
            return returnValue;
          },
          // transform state being rehydrated
          (outboundState, kk) => {
            const returnValue = r.rehydrateSensitive({ [kk]: outboundState })[
              kk
            ];
            // console.warn(
            //   `[persist-sensitive][${sKey}] outbound`,
            //   kk,
            //   outboundState,
            //   returnValue,
            // );
            return returnValue;
          },
        );

        return [
          k,
          persistReducer(
            {
              key: sKey,
              transforms: [TransformSensitive],
              storage: sensitiveStorage,
              stateReconciler: autoMergeDeep,
              timeout: 50000,
            },
            // null,
            r,
          ),
        ];
      }
      return [k, r];
    }),
  ) as any;

  const combinedReducer = combineReducers({
    ...sensitivePersistedReducers,
    _rehydrated_keys: (s: any, a: any) => {
      let newState = s || [];

      if (!Array.isArray(newState)) {
        if (typeof newState === 'object') {
          newState = Object.values(newState);
        } else {
          newState = [];
        }
      }

      if (a.type === 'persist/REHYDRATE') {
        if (!newState.includes(a.key)) {
          newState = [...newState, a.key];
        }
      }

      return newState;
    },
  });

  const theReducer: typeof combinedReducer = ((...args: any) => {
    const [_state, action] = args;
    if (action.type === '__GLOBAL_SET_STATE__') {
      return action.payload;
    }

    const newState = (combinedReducer as any)(...args);
    return newState;
  }) as any;

  const Transform = createTransform(
    // transform state on its way to being serialized and persisted.
    (inboundState, k) => {
      const reducer = (reducers as any)[k];
      if (!reducer) return;

      if (typeof reducer.dehydrate === 'function') {
        const returnValue = reducer.dehydrate(inboundState);
        // console.warn(
        //   `[persist][${key}] inbound`,
        //   k,
        //   JSON.stringify(inboundState, null, 2),
        //   JSON.stringify(returnValue, null, 2),
        // );
        return returnValue;
      }
    },
    // transform state being rehydrated
    (outboundState, k) => {
      const reducer = (reducers as any)[k];
      if (!reducer) return;

      if (typeof reducer.rehydrate === 'function') {
        const returnValue = reducer.rehydrate(outboundState);

        // console.warn(
        //   `[persist][${key}] outbound`,
        //   k,
        //   JSON.stringify(outboundState, null, 2),
        //   JSON.stringify(returnValue, null, 2),
        // );
        return returnValue;
      }
    },
  );

  return persistReducer(
    {
      key,
      transforms: [Transform],
      storage: AsyncStorage,
      stateReconciler: autoMergeDeep,
      timeout: 50000,
    },
    theReducer as any,
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
  prefix: string,
): {
  [K in keyof T]: T[K] extends ActionCreatorWithPayload<infer P>
    ? (state: S, action: PayloadAction<P>) => any
    : (state: S) => any;
} {
  return Object.fromEntries(
    Object.entries(actionCreators).map(([key, actionCreator]) => [
      `${prefix}_${key}`,
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

export function mapGroupedSelectors<
  S,
  T extends Record<string, Record<string, (s: any) => any>>,
>(
  groupedSelectors: T,
  fn: <U extends keyof T, UU extends keyof T[U]>(
    selector: any /* TODO */,
  ) => (state: S) => ReturnType<T[string][string]>,
): { [K in keyof T]: { [KK in keyof T[K]]: (s: S) => ReturnType<T[K][KK]> } } {
  return Object.fromEntries(
    Object.entries(groupedSelectors).map(([key, selectors]) => [
      key,
      mapSelectors(selectors, fn as any),
    ]),
  ) as any;
}

export function overrideActions<T extends Record<string, unknown>>(
  originalObj: T,
  overrideObj: Record<string, unknown>,
  prefix: string,
): T {
  const returnObj = { ...originalObj };
  for (const key in originalObj) {
    const keyWithPrefix = `${prefix}_${key}`;
    if (overrideObj[keyWithPrefix]) {
      returnObj[key] = overrideObj[keyWithPrefix] as any;
    }
  }

  return returnObj;
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

export function annotateOriginalActionTypes<T extends Record<string, Action>>(
  actions: T,
  originalActions: ReadonlyArray<Record<string, Action>>,
): T {
  originalActions.forEach(acs => {
    Object.entries(acs).forEach(([key, ac]) => {
      const newAc = (actions as any)[key];
      if (!newAc) return;

      newAc.originalType = (ac as any).originalType || ac.type;
    });
  });

  return actions;
}

export function filterOutCacheFromState(state: any): any {
  if (typeof state !== 'object') return state;
  return Object.fromEntries(
    Object.entries(state)
      .filter(([key]: any) => !key.startsWith('_cache'))
      .map(([k, v]) => [k, filterOutCacheFromState(v)]),
  );
}
