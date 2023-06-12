import {
  ActionFromReducersMapObject,
  combineReducers,
  PreloadedStateShapeFromReducersMapObject,
  Reducer,
  StateFromReducersMapObject,
} from 'redux';
import { createTransform, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
