import { describe, expect, it } from 'vitest';
import { canonicalUrl, publicResourceFields, relatedPublic } from '../lib/resources';
import {
  MEMBER_RESOURCE_LOCK,
  RESOURCES_INDEX,
  RESOURCE_EMPTY_STATES,
  RESOURCE_FORMAT_VOCABULARY,
  RESOURCE_PREVIEWS,
  RESOURCE_TOPICS,
  allResources,
  DISCLAIMERS,
} from '../content';
import type { PublicResource } from '../content/types';

const publicResource: PublicResource = {
  slug: 'public-one',
  title: 'A public resource',
  excerpt: 'A synopsis.',
  visibility: 'public',
  contentStatus: 'approved',
  format: 'guide',
  topics: ['AI Foundations'],
  publicBody: [{ type: 'paragraph', text: 'Body copy.' }],
  cover: { kind: 'placeholder', tone: 'navy' },
  publishedAt: '2026-05-01',
};

const memberResource: PublicResource = {
  slug: 'member-one',
  title: 'A members-only resource',
  excerpt: 'A synopsis.',
  visibility: 'members-only',
  contentStatus: 'approved',
  format: 'template',
  topics: ['Practical Adoption'],
  cover: { kind: 'placeholder', tone: 'surface' },
};

describe('publicResourceFields is the privacy boundary', () => {
  it('exposes only the synopsis fields for a members-only resource', () => {
    const view = publicResourceFields(memberResource);
    // Cover, title, synopsis, topics, format - and the locked flag.
    expect(Object.keys(view).sort()).toEqual(
      ['slug', 'title', 'summary', 'topics', 'format', 'cover', 'locked'].sort(),
    );
    expect(view.locked).toBe(true);
  });

  it('carries NO body field at all for a locked resource', () => {
    // Absent, not empty: a template cannot render what the object lacks.
    expect('body' in publicResourceFields(memberResource)).toBe(false);
    expect('publishedAt' in publicResourceFields(memberResource)).toBe(false);
  });

  it('exposes body and dates for a public resource', () => {
    const view = publicResourceFields(publicResource);
    expect(view.locked).toBe(false);
    expect(view.body).toHaveLength(1);
    expect(view.publishedAt).toBe('2026-05-01');
  });

  it('does not leak a members-only body even if the record somehow had one', () => {
    // The schema forbids this combination, so this is defence in depth.
    const rogue = { ...memberResource, publicBody: publicResource.publicBody } as PublicResource;
    expect('body' in publicResourceFields(rogue)).toBe(false);
  });
});

describe('related resources', () => {
  it('offers only PUBLIC resources sharing a topic', () => {
    const pool: PublicResource[] = [
      publicResource,
      { ...publicResource, slug: 'public-two' },
      { ...memberResource, topics: ['AI Foundations'] },
    ];
    const related = relatedPublic(publicResource, pool);
    expect(related.map((r) => r.slug)).toEqual(['public-two']);
  });

  it('never suggests the resource being viewed', () => {
    expect(relatedPublic(publicResource, [publicResource])).toEqual([]);
  });
});

describe('canonical URL', () => {
  it('returns null while no site origin is configured', () => {
    // A canonical tag pointing at a guessed origin tells a crawler the wrong
    // authoritative address, which is worse than emitting none.
    expect(canonicalUrl('/resources/x', undefined)).toBeNull();
    expect(canonicalUrl('/resources/x', '')).toBeNull();
  });

  it('builds an absolute URL on the public route once configured', () => {
    expect(canonicalUrl('/resources/x', 'https://paaipe.example.org')).toBe(
      'https://paaipe.example.org/resources/x',
    );
  });
});

describe('preview announcements promise nothing that exists', () => {
  it('shows six items, each marked Coming soon', () => {
    expect(RESOURCE_PREVIEWS).toHaveLength(6);
    for (const preview of RESOURCE_PREVIEWS) {
      expect(preview.status).toBe('Coming soon');
    }
  });

  it('gives no preview a slug, href or date', () => {
    for (const preview of RESOURCE_PREVIEWS) {
      expect(Object.keys(preview).sort()).toEqual(['description', 'status', 'title', 'topic']);
    }
  });

  it('uses only approved topic names', () => {
    for (const preview of RESOURCE_PREVIEWS) {
      expect(RESOURCE_TOPICS as readonly string[]).toContain(preview.topic);
    }
  });
});

describe('approved copy', () => {
  it('carries the index intro, search and filter labels exactly', () => {
    expect(RESOURCES_INDEX.searchLabel).toBe('Search topics, guides and insights');
    expect(RESOURCES_INDEX.filterLabel).toBe('Explore by topic');
    expect(RESOURCES_INDEX.intro).toContain('Explore clear explanations');
  });

  it('offers the seven approved topic filters', () => {
    expect(RESOURCE_TOPICS).toHaveLength(7);
  });

  it('lists the seven format names Tab 08 supplies', () => {
    expect(RESOURCE_FORMAT_VOCABULARY).toHaveLength(7);
    expect(RESOURCE_FORMAT_VOCABULARY).toContain('External reference');
  });

  it('states the members-only lock copy with no asset reference', () => {
    expect(MEMBER_RESOURCE_LOCK.heading).toBe('Available to verified PAAIPE members');
    const text = JSON.stringify(MEMBER_RESOURCE_LOCK);
    expect(text).not.toMatch(/https?:|\.pdf|\.zip|\.mp4|download|signed|token/i);
  });

  it('gives both empty states honest copy', () => {
    expect(RESOURCE_EMPTY_STATES.noResults.action).toBe('Clear Filters');
    expect(RESOURCE_EMPTY_STATES.memberPreview.heading).toBe(
      'More learning is available inside the Members Portal.',
    );
  });

  it('carries the educational disclaimer verbatim', () => {
    expect(DISCLAIMERS.educational).toContain('should not be treated as legal, financial, medical');
  });
});

describe('no resource claims authorship or publication', () => {
  it('gives no unapproved resource a publication date', () => {
    for (const resource of allResources) {
      if (resource.contentStatus !== 'approved') {
        expect(resource.publishedAt, resource.slug).toBeUndefined();
      }
    }
  });

  it('names no author anywhere in the registry', () => {
    const text = JSON.stringify(allResources);
    expect(text).not.toMatch(/"author"|"byline"|"writtenBy"/i);
  });

  it('references no downloadable asset', () => {
    const text = JSON.stringify(allResources);
    expect(text).not.toMatch(/\.pdf|\.docx|\.zip|\.mp4|\/downloads?\//i);
  });
});
