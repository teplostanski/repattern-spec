import { getCollection, render, type CollectionEntry } from 'astro:content';
import {
  findSpecEntry,
  parseVersion,
  resolvePageVersion,
  type Locale,
} from './spec';

export type SpecPageData = {
  entry: CollectionEntry<'spec'>;
  Content: Awaited<ReturnType<typeof render>>['Content'];
  pageVersion: string;
};

export const loadSpecPage = async (
  locale: Locale,
  versionParam?: string,
): Promise<SpecPageData | null> => {
  const pageVersion = resolvePageVersion(parseVersion(versionParam));
  const allEntries = await getCollection('spec');
  const entry = findSpecEntry(allEntries, pageVersion, locale);

  if (!entry) {
    return null;
  }

  const { Content } = await render(entry);

  return { entry, Content, pageVersion };
};

export const loadSpecPageOrThrow = async (
  locale: Locale,
  versionParam?: string,
): Promise<SpecPageData> => {
  const page = await loadSpecPage(locale, versionParam);
  if (!page) {
    const version = resolvePageVersion(parseVersion(versionParam));
    throw new Error(`Spec not found: src/content/spec/${version}/${locale}.md`);
  }
  return page;
};
