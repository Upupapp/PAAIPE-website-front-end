/**
 * The /resources library: one list of cards built from three sources.
 *
 *  - links: published resources that live on another site (`RESOURCE_LINKS`);
 *  - articles: publishable `PublicResource` records - approved ones only in a
 *    production build, sample fixtures too in a review build;
 *  - previews: announcements of what is being prepared (`RESOURCE_PREVIEWS`).
 *
 * Pure, so the page stays a template and these rules are unit tested rather
 * than trusted: an announcement never carries an action, a sample is never
 * labelled Published, a link that leaves the site always names its host, and
 * every card's format is a vocabulary name the filter can offer.
 */
import type { ResourceFormatName } from '../content/resources';
import type { PublicResource, ResourceFormat } from '../content/types';

export type LibraryStatus = 'published' | 'members-only' | 'sample' | 'coming-soon';

export interface LibraryAction {
  href: string;
  label: string;
  /** Set only for a link that leaves this site, and then always. */
  host?: string;
}

export interface LibraryItem {
  title: string;
  description: string;
  topic: string;
  format: ResourceFormatName;
  /** What you get, as the card's head pill says it: "PDF", "Video · 1 min". */
  medium: string;
  /** How you get it, as the card's first line says it. */
  detail: string;
  status: LibraryStatus;
  /** Absent on an announcement: nothing exists to open. */
  action?: LibraryAction;
}

/** Tab 03's article `format` enum, as the display vocabulary names it (B-16). */
export const RESOURCE_FORMAT_DISPLAY: Readonly<Record<ResourceFormat, ResourceFormatName>> = {
  insight: 'Explainer',
  guide: 'Guide',
  checklist: 'Checklist',
  template: 'Template',
  replay: 'Video',
};

interface LinkSource {
  title: string;
  description: string;
  topic: string;
  format: ResourceFormatName;
  medium: string;
  detail: string;
  href: string;
  host: string;
  actionLabel: string;
}

interface PreviewSource {
  title: string;
  description: string;
  topic: string;
  format: ResourceFormatName;
  medium: string;
}

interface LibrarySources {
  links: readonly LinkSource[];
  articles: readonly PublicResource[];
  previews: readonly PreviewSource[];
}

/** Published first, then articles, then what is being prepared. */
export function libraryItems({ links, articles, previews }: LibrarySources): LibraryItem[] {
  const linked = links.map((link): LibraryItem => ({
    title: link.title,
    description: link.description,
    topic: link.topic,
    format: link.format,
    medium: link.medium,
    detail: link.detail,
    status: 'published',
    action: { href: link.href, label: link.actionLabel, host: link.host },
  }));

  const written = articles.map((resource): LibraryItem => {
    const format = RESOURCE_FORMAT_DISPLAY[resource.format];
    const locked = resource.visibility === 'members-only';
    let status: LibraryStatus = 'published';
    if (resource.contentStatus !== 'approved') status = 'sample';
    else if (locked) status = 'members-only';
    return {
      title: resource.title,
      description: resource.excerpt,
      topic: resource.topics.join(' · '),
      format,
      medium: 'Web page',
      detail: `Article on this site · ${format}`,
      status,
      action: { href: `/resources/${resource.slug}`, label: locked ? 'View summary' : 'Read now' },
    };
  });

  const announced = previews.map((preview): LibraryItem => ({
    title: preview.title,
    description: preview.description,
    topic: preview.topic,
    format: preview.format,
    medium: preview.medium,
    detail: `${preview.medium} · In preparation`,
    status: 'coming-soon',
  }));

  return [...linked, ...written, ...announced];
}

/** The formats that have at least one card, in vocabulary order. */
export function libraryFormats(
  items: readonly LibraryItem[],
  vocabulary: readonly ResourceFormatName[],
): ResourceFormatName[] {
  return vocabulary.filter((format) => items.some((item) => item.format === format));
}
