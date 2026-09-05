import type { EventSeriesRecord } from './event-record';

/**
 * The recurring series, Tab 02 Step 4.
 *
 * A SERIES IS NOT AN EVENT. It has no date, no registration and no detail page
 * of its own that can be joined. Every fact here is one PAAIPE has approved;
 * nothing is inferred, and the recurrence must never be turned into a clickable
 * "next event" until an approved instance exists.
 */
export const AI_EXCHANGE_SERIES: EventSeriesRecord = {
  id: 'paaipe-ai-exchange',
  title: 'PAAIPE AI Exchange',
  positioning:
    'A private monthly Zoom forum for thoughtful, practical and responsible AI conversations',
  description:
    'One focused hour for thoughtful, practical and responsible AI conversations. Each invited speaker selects a topic within their expertise and shares ideas that can help Filipino professionals and organizations learn, adapt and build.',
  cadence: 'Every second Tuesday of the month',
  time: '8:00 PM Philippine Time',
  format: 'Private Zoom',
  duration: 'One hour maximum',
  agenda: ['Opening', '20-30 minute guest presentation', 'Moderated Q&A', 'Raffle and close'],
  launch: 'September 2026',
};

export const EVENT_SERIES: readonly EventSeriesRecord[] = [AI_EXCHANGE_SERIES];
