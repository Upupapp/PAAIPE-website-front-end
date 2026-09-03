/**
 * Resource public-field selection and related-content rules.
 *
 * `publicResourceFields` is the privacy boundary, built the same way as the
 * events one: for a members-only resource the returned object DOES NOT CARRY a
 * body field at all, so a template cannot render protected content by
 * forgetting to omit it.
 */
import type { PublicResource, ContentBlock, PublicImage } from '../content/types';

export interface PublicResourceView {
  slug: string;
  title: string;
  /** The synopsis a members-only resource is limited to. */
  summary: string;
  topics: string[];
  format: string;
  cover: PublicImage;
  locked: boolean;
  /** Public resources only. Absent - not empty - when locked. */
  body?: ContentBlock[];
  publishedAt?: string;
  updatedAt?: string;
}

export function publicResourceFields(resource: PublicResource): PublicResourceView {
  const base: PublicResourceView = {
    slug: resource.slug,
    title: resource.title,
    summary: resource.excerpt,
    topics: [...resource.topics],
    format: resource.format,
    cover: resource.cover,
    locked: resource.visibility === 'members-only',
  };

  if (base.locked) return base;

  return {
    ...base,
    body: resource.publicBody ? [...resource.publicBody] : undefined,
    publishedAt: resource.publishedAt,
    updatedAt: resource.updatedAt,
  };
}

/** Public resources sharing a topic, excluding the one being viewed. */
export function relatedPublic(
  resource: PublicResource,
  all: readonly PublicResource[],
  limit = 3,
): PublicResource[] {
  return all
    .filter(
      (candidate) =>
        candidate.slug !== resource.slug &&
        candidate.visibility === 'public' &&
        candidate.topics.some((topic) => resource.topics.includes(topic)),
    )
    .slice(0, limit);
}

/**
 * The canonical URL for a resource, or null when no site origin is configured.
 *
 * A canonical tag pointing at a guessed origin is worse than none: it tells a
 * crawler the authoritative address of a page, and a wrong one de-indexes the
 * real page. PUBLIC_SITE_URL is unset (B-7), so this returns null and the tag
 * is simply not emitted.
 */
export function canonicalUrl(path: string, siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  try {
    return new URL(path, siteUrl).toString();
  } catch {
    return null;
  }
}

/** Shown when a resource has no approved publication date - never a guess. */
export function displayDate(value: string | undefined): string | null {
  return value ?? null;
}
