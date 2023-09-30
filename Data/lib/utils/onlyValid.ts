import { DataTypeName } from '../schema';
import { DataTypeWithID, InvalidDataTypeWithID } from '../types';

type MaybeDataTypeWithID<T extends DataTypeName> =
  | DataTypeWithID<T>
  | InvalidDataTypeWithID<T>;

export default function onlyValid<
  TT extends
    | MaybeDataTypeWithID<DataTypeName>
    | null
    | ReadonlyArray<MaybeDataTypeWithID<DataTypeName> | null>,
>(
  data: TT,
): TT extends ReadonlyArray<any>
  ? TT extends ReadonlyArray<MaybeDataTypeWithID<infer T>>
    ? Array<DataTypeWithID<T>>
    : never
  : TT extends MaybeDataTypeWithID<infer T>
  ? DataTypeWithID<T> | null
  : never {
  if (Array.isArray(data)) {
    return data.filter(d => d?.__valid) as any;
  }

  if (data && (data as any).__valid) {
    return data as any;
  }

  return null as any;
}
