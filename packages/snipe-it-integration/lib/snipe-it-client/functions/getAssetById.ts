import { z } from 'zod';

import { Asset, Context } from '../types';

import snipeitFetch from './snipeitFetch';

export default async function getAssetById(
  ctx: Context,
  id: number,
): Promise<z.infer<typeof Asset> | null> {
  const response = await snipeitFetch(ctx, `/hardware/${id}`);
  const data = await response.json();

  if (data?.status === 'error') {
    if (data?.messages === 'Asset not found') {
      return null;
    } else {
      throw new Error(`API error: ${JSON.stringify(data)}`);
    }
  }

  const parsedData = Asset.parse(data);
  return parsedData;
}
