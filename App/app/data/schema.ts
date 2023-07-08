import { z } from 'zod';

import { schema } from './generated-schema';

export default schema;

export const plurals: Record<keyof typeof schema, string> = {
  collection: 'collections',
};

export type DataType<T extends keyof typeof schema> = z.infer<
  (typeof schema)[T]
>;
