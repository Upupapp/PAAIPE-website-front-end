import { POLICIES } from '../content/policies';

/**
 * The public route registry.
 *
 * Single source of truth for which routes exist, their browser title and their
 * H1. Tab 01 uses it to guarantee every listed route direct-loads with the
 * right title and one semantic main heading; Tab 14 re-uses it for the metadata
 * matrix, sitemap and canonical URLs.
 *
 * `titleSource` / `headingSource` record WHERE the approved string came from, so
 * a later tab can tell approved copy from a value we derived. `derived` values
 * are listed in docs/frontend-audit.md as awaiting PAAIPE approval.
 */
export type CopySource =
  'tab-05' | 'tab-06' | 'tab-07' | 'tab-08' | 'tab-09' | 'tab-10' | 'tab-14' | 'derived';

export interface PublicRoute {
  /** Internal review surface: never indexed, never linked from public nav. */
  internal?: true;
  /** Path as served. Dynamic routes use the literal `[slug]` segment. */
  path: string;
  title: string;
  titleSource: CopySource;
  /** Meta description. Approved copy where the master command supplies one. */
  description?: string;
  /** Social preview copy. Tab 14 generalises this; Tab 05 supplies the home values. */
  openGraph?: { title: string; description: string };
  heading: string;
  headingSource: CopySource;
  /** Which later tab owns the real implementation of this page. */
  ownedBy: string;
  /** Dynamic routes are templates; Tab 03 supplies their real entries. */
  dynamic?: true;
  /** Excluded from the sitemap and marked noindex while it is a placeholder. */
  placeholderOnly?: true;
  /**
   * A content reason to keep an otherwise-real page out of the index. Recorded
   * HERE rather than passed to the layout, so the `noindex` meta tag and the
   * sitemap cannot disagree: one flag drives both.
   *
   * For the legal pages it is DERIVED from the policy's own status rather than
   * written down, because a hardcoded flag here and a status in `POLICIES` are
   * two sources of truth for one fact, and they disagree in exactly the
   * situation nobody rehearses. Measured before this changed: setting both
   * policies to `approved` removed the draft banner and left the pages emitting
   * `noindex` with the reason `draft-content` - so PAAIPE would have adopted
   * its legal text and kept it out of every index, with the page giving a
   * reason that was no longer true.
   */
  noindexReason?: 'draft-content' | 'registration-route';
}

/**
 * `'draft-content'` while the policy is unapproved, and `undefined` once PAAIPE
 * adopts it. One fact, one place: adopting a policy is a single edit to
 * `POLICIES` and the index follows.
 */
function draftReason(slug: string): 'draft-content' | undefined {
  const policy = POLICIES.find((entry) => entry.slug === slug);
  if (!policy) {
    throw new Error(
      `No policy named ${JSON.stringify(slug)}. A legal route whose policy vanished would silently become indexable.`,
    );
  }
  return policy.status === 'approved' ? undefined : 'draft-content';
}

export const PUBLIC_ROUTES: readonly PublicRoute[] = [
  {
    path: '/',
    description:
      'Join a Filipino community advancing practical, responsible AI through learning, professional events, useful resources and meaningful collaboration.',
    openGraph: {
      title: 'Building the Philippines’ AI-Powered Future—Together.',
      description:
        'Discover PAAIPE-a professional community helping Filipino talent and organizations learn, connect and move forward with AI responsibly.',
    },
    title: 'PAAIPE - Filipino AI Professionals and Entrepreneurs',
    titleSource: 'tab-14',
    heading: 'Building the Philippines’ AI-Powered Future—Together.',
    headingSource: 'tab-05',
    ownedBy: 'Tab 05',
  },
  {
    path: '/about',
    description:
      'Learn why PAAIPE is building a connected, capable and responsible community of Filipino AI professionals and entrepreneurs.',
    title: 'About PAAIPE - Mission, Vision and Community',
    titleSource: 'tab-14',
    heading: 'A stronger Philippine AI future starts with a stronger community.',
    headingSource: 'tab-06',
    ownedBy: 'Tab 06',
  },
  {
    path: '/programs',
    description:
      'Explore PAAIPE programs for AI education, professional learning, community exchange and responsible innovation.',
    title: 'Programs - PAAIPE',
    titleSource: 'tab-14',
    heading: 'From understanding AI to creating real-world value',
    headingSource: 'tab-06',
    ownedBy: 'Tab 06',
  },
  {
    path: '/events',
    description:
      // The approved sentence ends "View event details and register using your
      // email." That clause is held back until Tab 05 connects registration:
      // `registrationFeatureState` is `catalog-absent` in production, the
      // register route ships no form by design, and a search result is the one
      // place a promise is made before a reader can see it is unavailable. The
      // full sentence is recorded in docs/PENDING.md for Tab 05 to restore.
      'Explore PAAIPE events for Filipino AI professionals, entrepreneurs, educators, organizations and learners.',
    title: 'PAAIPE Events | AI Talks, Workshops and Community Sessions',
    titleSource: 'tab-14',
    heading: 'Learn with the people building the Philippines’ AI future.',
    headingSource: 'tab-07',
    ownedBy: 'Tab 07',
  },
  {
    path: '/events/[slug]',
    title: 'Event - PAAIPE',
    titleSource: 'derived',
    heading: 'Event detail template',
    headingSource: 'derived',
    ownedBy: 'Tab 07',
    dynamic: true,
    placeholderOnly: true,
  },
  {
    /*
     * Reserved by the Events Continuation, Tab 01 Step 3.
     *
     * `noindex, follow` comes from the route map. It is a step in a journey
     * rather than a destination: its content belongs to the event, which is
     * already indexed at the detail URL, and a search result landing a person
     * mid-registration is worse than landing them on the event.
     */
    path: '/events/[slug]/register',
    noindexReason: 'registration-route',
    title: 'Register - PAAIPE Events',
    titleSource: 'derived',
    heading: 'Register for this event',
    headingSource: 'derived',
    ownedBy: 'Events Continuation Tab 01',
    dynamic: true,
    placeholderOnly: true,
  },
  {
    path: '/speakers',
    description:
      'Propose a session for the PAAIPE community. What a session involves, how proposals are reviewed, and how to express interest.',
    title: 'Speak at PAAIPE - Share Practical AI Expertise',
    titleSource: 'tab-07',
    heading: 'Share what you know. Help move Filipino AI capability forward.',
    headingSource: 'tab-07',
    ownedBy: 'Tab 07',
  },
  {
    path: '/resources',
    description:
      'Clear explanations, practical frameworks and responsible-use guidance for Filipino professionals and entrepreneurs working with AI.',
    title: 'AI Insights and Resources - PAAIPE',
    titleSource: 'tab-14',
    heading: 'Useful AI knowledge for real people and real work',
    headingSource: 'tab-08',
    ownedBy: 'Tab 08',
  },
  {
    path: '/resources/[slug]',
    title: 'Resource - PAAIPE',
    titleSource: 'derived',
    heading: 'Resource detail template',
    headingSource: 'derived',
    ownedBy: 'Tab 08',
    dynamic: true,
    placeholderOnly: true,
  },
  {
    path: '/membership',
    description:
      'Apply to join a verified community of Filipino AI professionals and entrepreneurs with access to events, resources and collaborative opportunities.',
    title: 'PAAIPE Membership - Learn, Connect and Build',
    titleSource: 'tab-14',
    heading: 'Build your AI future with people who want the Philippines to move forward.',
    headingSource: 'tab-09',
    ownedBy: 'Tab 09',
  },
  {
    path: '/benefits',
    description:
      'The kinds of benefit PAAIPE membership works towards, and the conditions each depends on.',
    title: 'Member Benefits - PAAIPE',
    titleSource: 'derived',
    heading: 'Benefits designed to help members learn, build and connect.',
    headingSource: 'tab-09',
    ownedBy: 'Tab 09',
  },
  {
    path: '/partners',
    description:
      'Work with PAAIPE to support practical AI learning, responsible adoption and professional collaboration in the Philippines.',
    title: 'Partner with PAAIPE',
    titleSource: 'tab-14',
    heading: 'Help expand access to meaningful AI opportunity in the Philippines.',
    headingSource: 'tab-10',
    ownedBy: 'Tab 10',
  },
  {
    path: '/responsible-ai',
    description:
      'The principles PAAIPE encourages for AI adoption: human accountability, transparency, privacy, fairness, verification and continuous learning.',
    title: 'Responsible AI Principles - PAAIPE',
    titleSource: 'tab-10',
    heading: 'Progress with people, responsibility and trust at the center.',
    headingSource: 'tab-10',
    ownedBy: 'Tab 10',
  },
  {
    path: '/contact',
    description:
      'How to reach PAAIPE about membership, programs, speaking opportunities, partnerships, media and other organization matters.',
    title: 'Contact PAAIPE',
    titleSource: 'tab-14',
    heading: 'Let’s start a useful conversation.',
    headingSource: 'tab-10',
    ownedBy: 'Tab 10',
  },
  {
    path: '/privacy',
    noindexReason: draftReason('privacy'),
    description:
      'How PAAIPE handles personal information on this website, and the rights you hold under the Data Privacy Act. Draft for review, not yet in force.',
    title: 'Privacy Notice - PAAIPE',
    titleSource: 'tab-14',
    heading: 'Privacy Notice',
    headingSource: 'derived',
    ownedBy: 'Tab 10',
  },
  {
    path: '/terms',
    noindexReason: draftReason('terms'),
    description:
      'The terms you accept by using the PAAIPE website, and the limits of what it can be relied on for. Draft for review, not yet in force.',
    title: 'Terms of Use - PAAIPE',
    titleSource: 'tab-14',
    heading: 'Terms of Use',
    headingSource: 'derived',
    ownedBy: 'Tab 10',
  },
  {
    path: '/accessibility',
    description:
      'How PAAIPE works toward accessible digital information, what is checked on every build, and how to report a barrier.',
    title: 'Accessibility - PAAIPE',
    titleSource: 'tab-14',
    heading: 'Accessibility at PAAIPE',
    headingSource: 'tab-10',
    ownedBy: 'Tab 10',
  },
  {
    path: '/internal/style-guide',
    title: 'Internal style guide - PAAIPE',
    titleSource: 'derived',
    heading: 'PAAIPE design system',
    headingSource: 'derived',
    ownedBy: 'Tab 02',
    internal: true,
    placeholderOnly: true,
  },
  {
    path: '/404',
    title: 'Page Not Found - PAAIPE',
    titleSource: 'derived',
    heading: 'This page wandered off the map.',
    headingSource: 'tab-10',
    ownedBy: 'Tab 10',
  },
] as const;

/** Routes that a crawler should be able to index once their tab is complete. */
export const INDEXABLE_ROUTES = PUBLIC_ROUTES.filter(
  (route) => !route.dynamic && !route.internal && route.path !== '/404',
);

export function findRoute(path: string): PublicRoute {
  const route = PUBLIC_ROUTES.find((candidate) => candidate.path === path);
  if (!route) throw new Error(`Unknown public route: ${path}`);
  return route;
}

/**
 * Path segments reserved for the token landings the backend emails will link to.
 *
 * The API composes confirmation and management links; it had guessed
 * `/events/confirm`, `/events/manage` and `/subscriptions/confirm`, none of
 * which existed here - every token email would have landed a person on a 404.
 * Those strings are now agreed, and the pages will be built when integration
 * starts.
 *
 * The hazard this guards is the one that would be discovered latest and hurt
 * most: `/events/[slug]` is a dynamic route, so an event whose slug was
 * "confirm" would occupy the same URL as the confirmation landing. Whichever
 * won, the other would be silently unreachable - for a confirmation link, that
 * is a registration a person cannot complete, discovered by them and not by us.
 *
 * A reserved word is cheap. A collision found in production is not.
 */
export const RESERVED_SLUGS = ['confirm', 'manage', 'unsubscribe'] as const;
