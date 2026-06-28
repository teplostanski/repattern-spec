export const siteConfig = {
  name: 'repattern',
  url: 'https://spec.repattern.dev',
  author: {
    en: 'Teplostanski Igor',
    ru: 'Теплостанский Игорь',
  },

  keywords: {
    en: [
      'repattern',
      'regex',
      'regular expressions',
      'JavaScript',
      'DSL',
      'schema',
      'specification',
      'RegExp',
    ],
    ru: [
      'repattern',
      'regex',
      'регулярные выражения',
      'JavaScript',
      'DSL',
      'схема',
      'спецификация',
      'RegExp',
    ],
  },

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
