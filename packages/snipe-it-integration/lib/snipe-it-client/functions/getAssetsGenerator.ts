import { z } from 'zod';

import { Asset, Context } from '../types';

import snipeitFetch from './snipeitFetch';

export const BATCH_SIZE = 100;

const responseDataType = z.object({
  total: z.number(),
  rows: z.array(Asset),
});

export default async function* getAssetsGenerator(
  ctx: Context,
  company_id?: number,
): AsyncGenerator<
  { total: number; current: number; asset: z.infer<typeof Asset> },
  void,
  void
> {
  let total: number | undefined;
  let currentOffset = 0;

  while (typeof total !== 'number' || total > currentOffset) {
    let path = `/hardware?sort=updated_at&order=desc&limit=${BATCH_SIZE}&offset=${currentOffset}`;
    if (company_id) {
      path += '&company_id=' + company_id;
    }
    const response = await snipeitFetch(ctx, path);
    const data = await response.json();

    const parsedData = responseDataType.parse(data);

    total = parsedData.total;

    let i = 0;
    for (const asset of parsedData.rows) {
      yield {
        total,
        current: 1 + currentOffset + i,
        asset,
      };
      i += 1;
    }

    currentOffset += BATCH_SIZE;
  }
}
