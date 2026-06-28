import { siteConfig, type Locale } from '../config/site';

const { defaultLocale, locales } = siteConfig.i18n;

export const prefixedLocales = (): Locale[] =>
  locales.filter((locale): locale is Locale => locale !== defaultLocale);

export const localeIndexPaths = () =>
  prefixedLocales().map((locale) => ({ params: { locale } }));
