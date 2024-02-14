import { z } from 'zod';

import { Category, Context } from '../types';

import snipeitFetch from './snipeitFetch';

export const BATCH_SIZE = 100;

const responseDataType = z.object({
  total: z.number(),
  rows: z.array(Category),
});

export default async function getCategories(
  ctx: Context,
  type: 'asset' = 'asset',
): Promise<Array<z.infer<typeof Category>>> {
  let total: number | undefined;
  let currentOffset = 0;
  const categories: Array<z.infer<typeof Category>> = [];

  while (typeof total !== 'number' || total > currentOffset) {
    const response = await snipeitFetch(
      ctx,
      `/categories?category_type=${type}&sort=name&order=asc&limit=${BATCH_SIZE}&offset=${currentOffset}`,
    );
    const data = await response.json();

    const parsedData = responseDataType.parse(data);

    total = parsedData.total;
    categories.push(...parsedData.rows);

    currentOffset += BATCH_SIZE;
  }

  return categories;
}
