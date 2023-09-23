import { z } from 'zod';
import type fetch from 'node-fetch';

export type Context = {
  fetch: typeof fetch;
  baseUrl: string;
  key: string;
};

export const Company = z.object({
  id: z.number(),
  name: z.string(),
});
