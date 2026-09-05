/**
 * Approved marketplace copy, Tab 03.
 *
 * Reproduced exactly as the command supplies it. Where the command gives words,
 * they are used verbatim rather than paraphrased - an approved string that has
 * been "improved" in transit is an unapproved string.
 */
export const EVENTS_PAGE = {
  title: 'PAAIPE Events | AI Talks, Workshops and Community Sessions',
  eyebrow: 'PAAIPE EVENTS',
  h1: 'Learn with the people building the Philippines’ AI future.',
  introduction:
    'Explore practical talks, workshops and community conversations created to help Filipino professionals, founders, educators and organizations understand AI, build capability and move forward responsibly.',
  primaryAction: 'Browse upcoming events',
  secondaryAction: 'Learn about PAAIPE',
  /*
   * Value labels, not statistics. The command is explicit: none of these may be
   * presented as an outcome figure or a partner endorsement, so they are plain
   * words with no number attached and nothing to misread as a claim.
   */
  valueLabels: [
    'Practical AI learning',
    'Filipino-led conversations',
    'Responsible innovation',
    'Simple email registration',
  ],
  seriesNote:
    'Registration and eligibility are shown on each event page. Private access details are sent only to approved registrants.',
  searchLabel: 'Search events',
  searchPlaceholder: 'Search by event, topic or speaker',
} as const;

/** Loading, empty and failure copy, used exactly as supplied. */
export const EVENTS_STATES = {
  loading: 'Loading PAAIPE events…',
  noUpcoming: {
    heading: 'New events are being prepared.',
    body: 'Check back for the next PAAIPE learning session, or explore the PAAIPE AI Exchange series.',
  },
  noMatches: {
    heading: 'No events match those filters.',
    body: 'Try another topic, type or access option.',
    action: 'Show all events',
  },
  noPast: {
    heading: 'Past-event resources will appear here when they are approved for public release.',
    body: 'Completed sessions are listed here once PAAIPE approves what may be shared publicly.',
  },
} as const;

export const EVENT_TYPE_FILTERS = [
  { value: 'ai-exchange', label: 'AI Exchange' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'briefing', label: 'Briefing' },
  { value: 'roundtable', label: 'Roundtable' },
  { value: 'collaborative-session', label: 'Collaborative session' },
] as const;

/**
 * Type value -> approved label, DERIVED from the filter list above.
 *
 * Not a second literal map. The filters and the detail page's eyebrow must
 * always agree, and the way they stop agreeing is someone adding a type to one
 * list and not the other. Deriving makes that impossible rather than unlikely.
 */
export const EVENT_TYPE_LABELS = Object.fromEntries(
  EVENT_TYPE_FILTERS.map((filter) => [filter.value, filter.label]),
) as Record<(typeof EVENT_TYPE_FILTERS)[number]['value'], string>;

export const ACCESS_FILTERS = [
  { value: 'public', label: 'Open to everyone' },
  { value: 'members-only', label: 'Verified members only' },
] as const;

export const SORT_OPTIONS = [
  { value: 'soonest', label: 'Soonest first' },
  { value: 'recent', label: 'Recently announced' },
] as const;
