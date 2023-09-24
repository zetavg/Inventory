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
  created_at: z.object({
    datetime: z.string(),
    formatted: z.string(),
  }),
  updated_at: z.object({
    datetime: z.string(),
    formatted: z.string(),
  }),
});

export const Model = z.object({
  id: z.number(),
  name: z.string(),
  category: z.object({
    id: z.number(),
    name: z.string(),
  }),
  created_at: z.object({
    datetime: z.string(),
    formatted: z.string(),
  }),
  updated_at: z.object({
    datetime: z.string(),
    formatted: z.string(),
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
  created_at: z.object({
    datetime: z.string(),
    formatted: z.string(),
  }),
  updated_at: z.object({
    datetime: z.string(),
    formatted: z.string(),
  }),
});
