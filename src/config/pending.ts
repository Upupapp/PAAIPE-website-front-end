/**
 * The pending register — source of truth.
 *
 * `docs/PENDING.md` is GENERATED from this file by `npm run pending:write`, and
 * `src/tests/pending.test.ts` fails if the two disagree.
 *
 * Why generated: the register was hand-edited as a Markdown table for eight
 * tabs, and every edit was a literal string patch. Prettier re-pads the table
 * columns on each format run, so the anchors stopped matching and the edits
 * silently did nothing. The register sat frozen at its Tab 01 state while
 * reporting itself current — a stale register is worse than none, because it is
 * trusted.
 */
export type PendingState =
  'DONE' | 'IN PROGRESS' | 'BLOCKED' | 'OWNER DECISION' | 'NOT REACHED' | 'RESOLVED';

export interface PendingItem {
  id: string;
  state: PendingState;
  item: string;
  reason: string;
}

/** Front-end work. Ours to do, with the reason it is not done. */
export const FRONTEND_ITEMS: readonly PendingItem[] = [
  {
    id: 'F-1',
    state: 'DONE',
    item: 'Brand tokens, LogoLockup, 15 UI primitives, internal style guide, contrast gate',
    reason: 'Tab 02. See `brand-usage.md`',
  },
  {
    id: 'F-2',
    state: 'DONE',
    item: 'Typed, schema-validated content registries',
    reason: 'Tab 03. See `content-architecture.md`',
  },
  {
    id: 'F-3',
    state: 'DONE',
    item: 'Header, responsive navigation, mobile drawer, footer, announcement bar, branded 404',
    reason: 'Tab 04. See `shell-and-navigation.md`',
  },
  {
    id: 'F-4',
    state: 'DONE',
    item: 'Page content for every route',
    reason:
      '**Complete.** Every public route now renders real content from the registry. Tabs 11–16 refine motion, accessibility, SEO, testing and handoff rather than adding pages',
  },
  {
    id: 'F-5',
    state: 'NOT REACHED',
    item: '`site`, canonical URLs, sitemap, robots, full JSON-LD',
    reason: 'Tab 14. Blocked in practice on B-7 — no production origin',
  },
  {
    id: 'F-6',
    state: 'IN PROGRESS',
    item: 'Built-bundle secret and privacy scan',
    reason:
      '`npm run verify:leak` scans both the review and production bundles (Tab 07). Tab 15 owns the wider sweep',
  },
  {
    id: 'F-7',
    state: 'NOT REACHED',
    item: 'Performance budgets, Lighthouse runs, real-user monitoring plan',
    reason:
      'Tabs 14–15. Nothing has been measured yet, so no budget is claimed to pass or to fail — every number reported in this repository so far is correctness, not speed',
  },
  {
    id: 'F-8',
    state: 'OWNER DECISION',
    item: 'TypeScript pinned to 6.0.3, not 7.0.2',
    reason:
      '`@astrojs/check@0.9.10` peer range is `^5 || ^6`; TS 7 fails resolution. Revisit when it supports TS 7',
  },
  {
    id: 'F-9',
    state: 'NOT REACHED',
    item: 'Keyboard tab-order test on mobile WebKit',
    reason:
      'Deliberately skipped: emulated mobile WebKit has no keyboard focus ring, so it measures the harness. Tab 13 covers real-device paths',
  },
  {
    id: 'F-10',
    state: 'DONE',
    item: 'Optical centring for both logos',
    reason:
      'Tab 02. `align="optical"` compensates with exact negative margins; the artwork is not cropped',
  },
  {
    id: 'F-11',
    state: 'NOT REACHED',
    item: 'Favicon, `apple-touch-icon` and web-manifest wiring',
    reason:
      'Tab 14 owns the document head. Renditions exist. The square artwork is portrait and above centre, so a favicon must use `align="optical"` or render low-heavy',
  },
  {
    id: 'F-12',
    state: 'OWNER DECISION',
    item: 'Whether `/internal/style-guide` ships in the production build',
    reason:
      'It is `internal`: excluded from `INDEXABLE_ROUTES`, rendered `noindex`, never linked. Useful to reviewers on a preview URL. Tab 14 must decide',
  },
  {
    id: 'F-13',
    state: 'BLOCKED',
    item: 'Approved typeface wiring (self-hosted WOFF2, `font-display`)',
    reason:
      'Blocked on B-5. A system stack is interim: local, zero network requests, one declaration to swap',
  },
  {
    id: 'F-14',
    state: 'BLOCKED',
    item: 'No content is `approved`',
    reason:
      'Every event and resource fixture is `sample`, so a production build publishes zero detail pages and no `Event` structured data. Unblocks when PAAIPE approves real articles and sessions',
  },
  {
    id: 'F-15',
    state: 'DONE',
    item: '`ContentBlock` rendering for resource article bodies',
    reason:
      'Tab 08. Paragraph, heading and list blocks render; no approved body copy exists, so the template shows an honest note',
  },
  {
    id: 'F-16',
    state: 'DONE',
    item: 'Members-only synopsis panel and locked event panel',
    reason:
      'Tabs 07–08. Both render from a view object that does not carry the private fields at all',
  },
  {
    id: 'F-17',
    state: 'DONE',
    item: 'Client-side route transitions and post-navigation focus management',
    reason:
      'Done in Tab 11. Astro ClientRouter with fallback="none"; the header persists across navigation and focus moves to the new main with preventScroll',
  },
  {
    id: 'F-18',
    state: 'OWNER DECISION',
    item: 'The announcement bar is dismissible — the one use of browser storage',
    reason:
      'Tab 04 permits it explicitly. Bounded to `src/lib/dismissal.ts`, key from a closed union, value always `1`, enforced by four scope tests. Say if you would rather it were not dismissible',
  },
  {
    id: 'F-19',
    state: 'NOT REACHED',
    item: 'Social preview image and the wider metadata system',
    reason:
      'Tab 14. Open Graph title and description exist for `/`; there is no `og:image` because no approved social image exists (B-6)',
  },
  {
    id: 'F-20',
    state: 'NOT REACHED',
    item: 'URL-addressable filter state on `/events` and `/resources`',
    reason:
      'Allowed "if appropriate". Deferred: with nothing published, neither filter is rendered at all',
  },
  {
    id: 'F-21',
    state: 'DONE',
    item: 'This register is generated, not hand-edited',
    reason:
      'It sat frozen at its Tab 01 state for seven tabs because every edit was a literal patch against a table Prettier keeps re-padding. Now generated from `src/config/pending.ts` with a test asserting the two agree',
  },
];

/** Decisions and inputs only PAAIPE can supply. */
export const OWNER_ITEMS: readonly PendingItem[] = [
  {
    id: 'B-1',
    state: 'RESOLVED',
    item: 'Logo checksums do not match the master command',
    reason:
      'Owner ruled 2026-09-03 that the uploaded logos are authoritative and the document checksums are stale. The gate is pinned to the supplied files and still reports the divergence every run',
  },
  {
    id: 'B-2',
    state: 'OWNER DECISION',
    item: 'Title separator: Tab 14 uses `-`, Tabs 05–10 use `|`',
    reason: 'Hyphen adopted, because Tab 14 is the stated route-metadata baseline. Confirm',
  },
  {
    id: 'B-3',
    state: 'OWNER DECISION',
    item: 'Titles derived for `/benefits`, both `[slug]` templates and `/404`',
    reason: 'Absent from the Tab 14 baseline table',
  },
  {
    id: 'B-4',
    state: 'BLOCKED',
    item: 'No external destination is configured (all seven `PUBLIC_*` values)',
    reason:
      'All six handoffs resolve through one resolver and render honest unavailable states meanwhile. The site is correct, but every action does nothing. Unblocks Tabs 09–10 sign-off',
  },
  {
    id: 'B-5',
    state: 'BLOCKED',
    item: 'No approved typeface with a self-hosting licence',
    reason: 'A system stack is in place meanwhile (F-13)',
  },
  {
    id: 'B-6',
    state: 'BLOCKED',
    item: 'No approved imagery in `public/media/`',
    reason:
      'The node-field / orbit / grid motif is built, but the **Philippine map contour is deliberately not drawn** — approximating a national outline is a credibility risk for a Philippine association. `NetworkField` exposes a `map` slot for an approved asset',
  },
  {
    id: 'B-7',
    state: 'BLOCKED',
    item: 'Production origin unknown, so `PUBLIC_SITE_URL` has no real value',
    reason:
      'No canonical tag is emitted at all: one pointing at a guessed origin would de-index the real page. Unblocks Tab 14',
  },
  {
    id: 'B-8',
    state: 'BLOCKED',
    item: 'Hosting owner, release method, rollback and incident contacts unnamed',
    reason:
      'Unblocks the Tab 16 operations gate. Needed before any release: who owns the hosting account, how a release is published atomically, how it is rolled back, and who is contacted when it breaks',
  },
  {
    id: 'B-9',
    state: 'BLOCKED',
    item: 'Legal text for `/privacy` and `/terms` not approved',
    reason: 'Both pages stay DRAFT FOR REVIEW; the schema refuses a draft policy with no banner',
  },
  {
    id: 'B-10',
    state: 'OWNER DECISION',
    item: 'Status colours are derived, not brand',
    reason:
      'The master command supplies no status palette and form validation cannot be built without one. `#B3261E` / `#0F6E4F` / `#8A5A00`, each clearing 4.5:1 as text on white and as a surface under white text. Approve or replace',
  },
  {
    id: 'B-11',
    state: 'OWNER DECISION',
    item: 'Electric blue cannot carry a white label',
    reason:
      'White on `--paaipe-blue #0878F9` measures 4.14:1, below AA, so primary actions use navy. Shifting blue 8% toward navy — `#0872EE` — reaches 4.51:1 and would make an electric-blue action legal',
  },
  {
    id: 'B-12',
    state: 'OWNER DECISION',
    item: 'Tab 05 names a programme Tab 06 does not',
    reason:
      '"Community Conversations" appears in the home preview but not in Tab 06\'s six programmes. Added with Tab 05\'s approved copy, giving seven. Confirm it belongs in the full list',
  },
  {
    id: 'B-13',
    state: 'OWNER DECISION',
    item: 'Bare hyphens where an em dash may be intended',
    reason:
      '"the AI future-not simply watch it happen", "Discover PAAIPE-a professional community", "community-helping people", "working with-or preparing for-artificial intelligence". Reproduced exactly as supplied rather than silently corrected — the slogan proves the source preserves typographic characters where it means them',
  },
  {
    id: 'B-14',
    state: 'OWNER DECISION',
    item: 'Two different value lists',
    reason:
      'Tab 03: five single words. Tab 06: five named values with descriptions. Only "Practical" overlaps. Both kept; About uses Tab 06\'s',
  },
  {
    id: 'B-15',
    state: 'OWNER DECISION',
    item: 'Two different audience lists',
    reason:
      "Tab 03: five categories. Tab 06: seven entries. Both kept; About uses Tab 06's, the home audience strip uses Tab 03's",
  },
  {
    id: 'B-16',
    state: 'OWNER DECISION',
    item: 'Two different resource-format vocabularies',
    reason:
      "Tab 03's schema enum is `guide / insight / replay / template / checklist`; Tab 08 lists Explainer, Guide, Checklist, Video, Event recap, Template, External reference. The enum stays authoritative for the type",
  },
];

/** Recorded so an omission is never read as an oversight. */
export const DELIBERATE_OMISSIONS: readonly string[] = [
  'No `.github/workflows`. Standing repository rule: no CI workflow that consumes tokens. Gates run locally via `npm run check`.',
  'No deployment, domain, hosting or production service is configured. The master command requires a separate written release command.',
  '`npm run check` omits `test:e2e` so it does not require browser binaries. Run it explicitly before handing a tab over.',
  '`public/media/` is empty. No approved imagery has been supplied (B-6).',
  'The Philippine map contour is not drawn. A slot exists for an approved asset rather than an approximation.',
  'The logo artwork was not cropped to even its asymmetric safe space. Tab 02 forbids cropping; the measurement is recorded so the fix happens in CSS.',
  'No `1200x418` horizontal logo rendition. It is the only other exact scale below 1:1, weighs 254 KiB — over budget — and has no consumer.',
  'No WebP/AVIF logo variants. PNG keeps the artwork lossless and current weights are inside budget.',
  '`--paaipe-blue` is not the primary action fill. It measures 4.14:1 against white, below AA (B-11).',
  'No dark-mode palette. One light system is specified; inventing a second set of brand colours is out of scope.',
  'The speaker and partner registries are empty on purpose. A name, portrait, quote or logo there is a claim about a real party nobody has agreed to.',
  "No social link renders. No account has been supplied, and a guessed handle could point at somebody else's profile.",
  'No event carries a date. None has been approved; an invented date is a commitment nobody made.',
  'Astro Content Collections were not used. This is structured registry data, not authored markdown.',
  'The home insights cards and the resources "In preparation" cards are not links. Nothing is published, so nothing may be opened.',
  'The updates signup has no `<form>`. With no endpoint, a form element could only ever produce a false success.',
  'No `Event` structured data is emitted. Nothing is approved, and marking up an event that does not exist would put a fabricated listing into search results.',
  'The events and resources filters are not rendered while their lists are empty. A control that can only do nothing is its own kind of dishonesty.',
  'No canonical tag is emitted. `PUBLIC_SITE_URL` is unset (B-7), and a canonical pointing at a guessed origin would de-index the real page.',
];

export const ALL_PENDING = [...FRONTEND_ITEMS, ...OWNER_ITEMS];
