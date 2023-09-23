import { z } from 'zod';

import { Company, Context } from '../types';

import snipeitFetch from './snipeitFetch';

export const BATCH_SIZE = 100;

const responseDataType = z.object({
  total: z.number(),
  rows: z.array(Company),
});

export default async function getCompanies(
  ctx: Context,
): Promise<Array<z.infer<typeof Company>>> {
  let total: number | undefined;
  let currentOffset = 0;
  const companies: Array<z.infer<typeof Company>> = [];

  while (typeof total !== 'number' || total > currentOffset) {
    const response = await snipeitFetch(
      ctx,
      `/companies?sort=name&order=asc&limit=${BATCH_SIZE}&offset=${currentOffset}`,
    );
    const data = await response.json();

    const parsedData = responseDataType.parse(data);

    total = parsedData.total;
    companies.push(...parsedData.rows);

    currentOffset += BATCH_SIZE;
  }

  return companies;
}
