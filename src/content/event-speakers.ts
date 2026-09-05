import type { PublicSpeaker } from './event-record';

/**
 * Approved speakers.
 *
 * EMPTY, and deliberately so. PAAIPE has approved no speaker, and the type
 * requires a portrait to carry `rightsApproved` before it can render. An empty
 * registry is the honest state: the detail page shows "Speaker details coming
 * soon" rather than a stock face, a generated likeness, an inferred title or a
 * placeholder organisation.
 *
 * The backend reads this the same way and reported the same emptiness
 * independently, which is the corroboration worth having.
 */
export const EVENT_SPEAKERS: readonly PublicSpeaker[] = [];
