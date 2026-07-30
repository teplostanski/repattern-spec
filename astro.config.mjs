// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import { rehypeGithubAlerts } from 'rehype-github-alerts';
import rehypeSlug from 'rehype-slug';
import { siteConfig } from './src/config/site.ts';

// https://astro.build/config
export default defineConfig({
  site: siteConfig.url,
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: siteConfig.i18n.defaultLocale,
        locales: {
          en: 'en-US',
          ru: 'ru-RU',
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: siteConfig.i18n.defaultLocale,
    locales: [...siteConfig.i18n.locales],
    routing: {
      prefixDefaultLocale: siteConfig.i18n.prefixDefaultLocale,
    },
  },
  markdown: {
    processor: unified({
      rehypePlugins: [
        rehypeGithubAlerts,
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'prepend',
            properties: {
              className: ['heading-anchor'],
              ariaLabel: 'Permalink',
            },
            content: {
              type: 'element',
              tagName: 'svg',
              properties: {
                ariaHidden: 'true',
                viewBox: '0 0 16 16',
                width: 16,
                height: 16,
              },
              children: [
                {
                  type: 'element',
                  tagName: 'path',
                  properties: {
                    fill: 'currentColor',
                    d: 'M7.775 3.275a.75.75 0 0 0 1.06 1.06l1.25-1.25a2 2 0 1 1 2.83 2.83l-2.5 2.5a2 2 0 0 1-2.83 0 .75.75 0 0 0-1.06 1.06 3.5 3.5 0 0 0 4.95 0l2.5-2.5a3.5 3.5 0 0 0-4.95-4.95l-1.25 1.25Zm-4.69 9.64a2 2 0 0 1 0-2.83l2.5-2.5a2 2 0 0 1 2.83 0 .75.75 0 0 0 1.06-1.06 3.5 3.5 0 0 0-4.95 0l-2.5 2.5a3.5 3.5 0 0 0 4.95 4.95l1.25-1.25a.75.75 0 0 0-1.06-1.06l-1.25 1.25a2 2 0 0 1-2.83 0Z',
                  },
                  children: [],
                },
              ],
            },
          },
        ],
        [
          rehypeExternalLinks,
          {
            target: '_blank',
            rel: ['noopener', 'noreferrer'],
          },
        ],
      ],
    }),
    shikiConfig: {
      themes: {
        light: siteConfig.markdown.shiki.light,
        dark: siteConfig.markdown.shiki.dark,
      },
      wrap: siteConfig.markdown.shiki.wrap,
    },
  },
});
