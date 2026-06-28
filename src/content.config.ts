import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { siteConfig } from './config/site';

const localeSchema = z.enum(siteConfig.i18n.locales);

const spec = defineCollection({
  loader: glob({
    base: './src/content/spec',
    pattern: '**/*.{md,mdx}',
    generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    locale: localeSchema,
    version: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { spec };
