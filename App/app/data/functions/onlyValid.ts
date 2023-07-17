import { DataTypeName } from '../schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

type MaybeDataTypeWithAdditionalInfo<T extends DataTypeName> =
  | DataTypeWithAdditionalInfo<T>
  | InvalidDataTypeWithAdditionalInfo<T>;

export default function onlyValid<
  TT extends
    | MaybeDataTypeWithAdditionalInfo<DataTypeName>
    | ReadonlyArray<MaybeDataTypeWithAdditionalInfo<DataTypeName>>,
>(
  data: TT,
): TT extends ReadonlyArray<any>
  ? TT extends ReadonlyArray<MaybeDataTypeWithAdditionalInfo<infer T>>
    ? Array<DataTypeWithAdditionalInfo<T>>
    : never
  : TT extends MaybeDataTypeWithAdditionalInfo<infer T>
  ? DataTypeWithAdditionalInfo<T> | null
  : never {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.filter(d => d.__valid) as any;
  }

  if ((data as any).__valid) {
    return data as any;
  }

  return null as any;
}
