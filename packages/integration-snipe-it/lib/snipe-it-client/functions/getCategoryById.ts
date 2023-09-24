import { z } from 'zod';

import { Category, Context } from '../types';

import snipeitFetch from './snipeitFetch';

export default async function getCategoryById(
  ctx: Context,
  id: number,
): Promise<z.infer<typeof Category> | null> {
  const response = await snipeitFetch(ctx, `/categories/${id}`);
  const data = await response.json();

  if (data?.status === 'error') {
    if (data?.messages === 'Category not found') {
      return null;
    } else {
      throw new Error(`API error: ${JSON.stringify(data)}`);
    }
  }

  const parsedData = Category.parse(data);
  return parsedData;
}
