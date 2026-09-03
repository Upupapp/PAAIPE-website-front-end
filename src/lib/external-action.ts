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

export const EXTERNAL_ACTIONS: Record<ExternalActionId, ActionDefinition> = {
  'membership-application': {
    field: 'membershipApplicationUrl',
    kind: 'url',
    unavailableMessage: 'Applications opening soon',
  },
  'member-portal': {
    field: 'memberPortalUrl',
    kind: 'url',
    unavailableMessage: 'Member Portal opening soon',
  },
  'application-status': {
    field: 'applicationStatusUrl',
    kind: 'url',
    unavailableMessage: 'Application status checking opening soon',
  },
  'speaker-interest': {
    field: 'speakerInterestUrl',
    kind: 'url',
    unavailableMessage: 'Speaker proposals opening soon',
  },
  'partnership-interest': {
    field: 'partnershipInterestUrl',
    kind: 'url',
    unavailableMessage: 'Partnership enquiries opening soon',
  },
  contact: {
    field: 'contactEmail',
    kind: 'email',
    unavailableMessage: 'Contact channel being finalized',
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
