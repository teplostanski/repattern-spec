// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { rehypeGithubAlerts } from 'rehype-github-alerts';
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
      rehypePlugins: [rehypeGithubAlerts],
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
