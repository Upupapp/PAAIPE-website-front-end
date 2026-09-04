/**
 * The single resolver for every external handoff.
 *
 * Apply, Member Sign In, Application Status, Speaker Interest, Partnership
 * Interest and Contact all resolve here. No page builds a destination itself,
 * so the "missing destination" behaviour cannot be right in one place and a
 * dead link in another.
 *
 * When a destination is not configured the result is an explicit `unavailable`
 * state carrying honest copy. It is never `#`, never `javascript:`, never an
 * empty href, never a dummy submit, and never a fabricated success.
 */
import type { PublicConfig } from '../config/public-config';
import type { ExternalActionId } from '../content/types';

export type ExternalActionResolution =
  | {
      state: 'available';
      href: string;
      /** mailto: opens a mail client rather than a new browsing context. */
      kind: 'url' | 'email';
    }
  | {
      state: 'unavailable';
      /** Shown in place of the control. Approved wording, never invented per page. */
      message: string;
    };

interface ActionDefinition {
  /** Which validated config value supplies the destination. */
  field: keyof PublicConfig;
  kind: 'url' | 'email';
  /** Copy shown when that value is absent. */
  unavailableMessage: string;
}

/*
 * The unavailable messages say WHAT IS TRUE, never when it will change.
 *
 * Every one of these read "... opening soon" or "being finalized". Both are
 * claims about timing that PAAIPE has not made and cannot keep: no date is set
 * for any of these destinations. The FTC's dark-patterns report treats a timing
 * signal unsupported by a timing fact as creating a misleading impression, and
 * NPC Advisory 2023-01 - which binds PAAIPE as a personal information
 * controller - names misleading information as a content-based deceptive
 * pattern.
 *
 * The same wording was removed from the events copy and from the registration
 * badge earlier. Leaving it here meant the site said "Date Not Announced" in one
 * place and "opening soon" in another, about the same absent fact.
 */
export const EXTERNAL_ACTIONS: Record<ExternalActionId, ActionDefinition> = {
  'membership-application': {
    field: 'membershipApplicationUrl',
    kind: 'url',
    unavailableMessage: 'Applications are not open yet',
  },
  'member-portal': {
    field: 'memberPortalUrl',
    kind: 'url',
    unavailableMessage: 'The Member Portal is not available yet',
  },
  'application-status': {
    field: 'applicationStatusUrl',
    kind: 'url',
    unavailableMessage: 'Application status checking is not available yet',
  },
  'speaker-interest': {
    field: 'speakerInterestUrl',
    kind: 'url',
    unavailableMessage: 'Speaker proposals are not open yet',
  },
  'partnership-interest': {
    field: 'partnershipInterestUrl',
    kind: 'url',
    unavailableMessage: 'Partnership enquiries are not open yet',
  },
  contact: {
    field: 'contactEmail',
    kind: 'email',
    unavailableMessage: 'No contact channel is published yet',
  },
};

export function resolveExternalAction(
  id: ExternalActionId,
  config: PublicConfig,
): ExternalActionResolution {
  const definition = EXTERNAL_ACTIONS[id];
  const value = config[definition.field];

  if (!value) {
    return { state: 'unavailable', message: definition.unavailableMessage };
  }

  return {
    state: 'available',
    href: definition.kind === 'email' ? `mailto:${value}` : value,
    kind: definition.kind,
  };
}
