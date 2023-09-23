import { z } from 'zod';

import { Context, Model } from '../types';

import snipeitFetch from './snipeitFetch';

export default async function getModelById(
  ctx: Context,
  id: number,
): Promise<z.infer<typeof Model> | null> {
  const response = await snipeitFetch(ctx, `/models/${id}`);
  const data = await response.json();

  if (data?.status === 'error') {
    if (data?.messages === 'AssetModel not found') {
      return null;
    } else {
      throw new Error(`API error: ${JSON.stringify(data)}`);
    }
  }

  const parsedData = Model.parse(data);
  return parsedData;
}
