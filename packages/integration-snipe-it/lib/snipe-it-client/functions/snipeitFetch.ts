import type { RequestInit, Response } from 'node-fetch';

import { Context } from '../types';

export default function snipeitFetch(
  ctx: Context,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return ctx.fetch(`${ctx.baseUrl}${path}`, {
    method: 'GET',
    ...init,
    headers: {
      Authorization: `Bearer ${ctx.key}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}
