export const siteConfig = {
  name: 'repattern',
  url: 'https://spec.repattern.dev',

  spec: {
    currentVersion: 'current',
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'] as const,
    prefixDefaultLocale: false,
  },

  markdown: {
    shiki: {
      light: 'github-light',
      dark: 'github-dark',
      wrap: true,
    },
  },
} as const;

export type Locale = (typeof siteConfig.i18n.locales)[number];
