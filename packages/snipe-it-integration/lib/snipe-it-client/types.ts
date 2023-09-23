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

export const Category = z.object({
  id: z.number(),
  name: z.string(),
  category_type: z.enum(['Asset']),
});

export const Model = z.object({
  id: z.number(),
  name: z.string(),
  category: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

export const Asset = z.object({
  id: z.number(),
  name: z.string(),
  asset_tag: z.string(),
  serial: z.string(),
  model: z.object({
    id: z.number(),
    name: z.string(),
  }),
  category: z.object({
    id: z.number(),
    name: z.string(),
  }),
});
