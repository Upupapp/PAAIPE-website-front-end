import type { ApprovedSpeaker } from './types';

/**
 * Approved speakers.
 *
 * DELIBERATELY EMPTY. PAAIPE has approved no speaker, and no portrait usage
 * rights have been confirmed. A name, photograph, title or quote here would be
 * a claim about a real person that nobody has agreed to.
 *
 * The events schema enforces the other half: only `approved` content may carry
 * an `approvedSpeaker` at all.
 */
export const APPROVED_SPEAKERS: readonly ApprovedSpeaker[] = [];
