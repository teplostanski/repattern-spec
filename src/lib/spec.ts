import type { CollectionEntry } from 'astro:content';
import { siteConfig, type Locale } from '../config/site';

export type { Locale } from '../config/site';
export type SpecEntry = CollectionEntry<'spec'>;

export const DEFAULT_LOCALE: Locale = siteConfig.i18n.defaultLocale;
export const CURRENT_VERSION = siteConfig.spec.currentVersion;

export const parseVersion = (value: string | undefined): string | undefined =>
  value?.trim() || undefined;

export const specPath = (locale: Locale, version: string): string => {
  const segments: string[] = [];
  if (locale !== DEFAULT_LOCALE) segments.push(locale);
  if (version !== CURRENT_VERSION) segments.push(version);
  return segments.length > 0 ? `/${segments.join('/')}/` : '/';
};

export const listVersions = (entries: SpecEntry[]): string[] => {
  const versions = [
    ...new Set(entries.filter((e) => !e.data.draft).map((e) => e.data.version)),
  ];
  return versions.sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );
};

export const findSpecEntry = (
  entries: SpecEntry[],
  version: string,
  locale: Locale,
): SpecEntry | undefined =>
  entries.find(
    (entry) =>
      !entry.data.draft &&
      entry.data.version === version &&
      entry.data.locale === locale,
  );

export const resolvePageVersion = (paramVersion: string | undefined): string =>
  paramVersion ?? CURRENT_VERSION;
