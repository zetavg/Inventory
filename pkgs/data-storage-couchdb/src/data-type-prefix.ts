import { DataTypeName } from '@invt/data/schema';

export const DATA_TYPE_PREFIX: Partial<
  Record<DataTypeName, string | undefined>
> = {
  image: 'zz20',
};

export default DATA_TYPE_PREFIX;
