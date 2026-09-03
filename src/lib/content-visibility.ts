/**
 * The one place that decides whether a content record may be published.
 *
 * Every registry consumer goes through `publishable()`. Nothing filters on
 * `contentStatus` by hand, so the rule cannot be applied inconsistently in one
 * page and forgotten in another.
 */
import type { ContentMode } from '../config/content-mode';
import type { ContentStatus } from '../content/types';

export interface PublishableRecord {
  slug: string;
  contentStatus: ContentStatus;
}

export function isPublishable(
  record: PublishableRecord,
  mode: ContentMode,
  draftAllowList: readonly string[],
): boolean {
  if (record.contentStatus === 'approved') return true;
  // Nothing unapproved survives a production build, ever.
  if (mode === 'production') return false;
  if (record.contentStatus === 'sample') return true;
  return draftAllowList.includes(record.slug);
}

export function publishable<T extends PublishableRecord>(
  records: readonly T[],
  mode: ContentMode,
  draftAllowList: readonly string[],
): T[] {
  return records.filter((record) => isPublishable(record, mode, draftAllowList));
}

/** The visible label a non-approved record must carry in a review build. */
export function reviewLabel(status: ContentStatus): string | null {
  switch (status) {
    case 'sample':
      return 'Concept preview';
    case 'draft':
      return 'Internal draft - not for publication';
    case 'approved':
      return null;
  }
}
