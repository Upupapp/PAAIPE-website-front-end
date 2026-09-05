/**
 * The validated public content registry.
 *
 * Every registry is parsed against its schema HERE, at module load, which means
 * at build time. A malformed record fails `astro build` with the field path,
 * rather than rendering as an empty card that nobody notices.
 *
 * Pages import from this module, never from the raw registry files, so nothing
 * can bypass validation or the content-mode filter.
 */
import { CONTENT_MODE, DRAFT_ALLOW_LIST } from '../config/content-mode';
import { StaticEventCatalogRepository } from '../lib/event-catalog';
import { EVENT_RECORDS } from './event-records';
import { EVENT_SAMPLES } from './event-samples';
import { EVENT_SERIES } from './event-series';
import { EVENT_SPEAKERS } from './event-speakers';
import { publicConfig } from '../config';
import { publishable } from '../lib/content-visibility';
import { resolveExternalAction } from '../lib/external-action';
import type { ExternalActionId } from './types';

import { EVENTS } from './events';
import { RESOURCES } from './resources';
import { PROGRAMS } from './programs';
import { MEMBER_BENEFITS, BENEFIT_CATEGORIES } from './benefits';
import { MEMBERSHIP_FAQS } from './faqs';
import { APPROVED_SPEAKERS } from './speakers';
import { APPROVED_PARTNERS } from './partners';
import { POLICIES } from './policies';
import { PRIMARY_NAV, FOOTER_NAV, SOCIAL_LINKS } from './navigation';

import {
  approvedPartnerSchema,
  approvedSpeakerSchema,
  benefitCategorySchema,
  faqSchema,
  navItemSchema,
  policySchema,
  programSchema,
  publicEventRecordSchema,
  publicEventSchema,
  publicSpeakerSchema,
  publicResourceSchema,
  socialLinkSchema,
} from './schemas';
import type { z } from 'zod';

/** Parses a whole registry, reporting the registry name and index on failure. */
function validate<S extends z.ZodType>(
  name: string,
  schema: S,
  records: readonly unknown[],
): z.infer<S>[] {
  return records.map((record, index) => {
    const result = schema.safeParse(record);
    if (!result.success) {
      const detail = result.error.issues
        .map((issue) => `      ${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n');
      throw new Error(`Invalid ${name}[${index}]:\n${detail}`);
    }
    return result.data;
  });
}

/* -- Validated registries. Order matters only for readability. -------------- */

export const allEvents = validate('events', publicEventSchema, EVENTS);

/* -- Events Continuation registries (Tab 02) -------------------------------
 *
 * Validated at module load like everything else, so a record that breaks one of
 * the Tab 02 rules - a members-only event anyone can register for, a cancelled
 * event with an open form, an AI Exchange on the wrong Tuesday - fails the
 * BUILD rather than rendering a page that contradicts itself.
 *
 * The samples are in the same registry and excluded by content mode, which is
 * the mechanism the rest of the site already uses. A second exclusion rule
 * invented for events is how a fixture eventually ships.
 */
export const allEventRecords = validate('eventRecords', publicEventRecordSchema, [
  ...EVENT_RECORDS,
  ...EVENT_SAMPLES,
]);
export const allEventSpeakers = validate('eventSpeakers', publicSpeakerSchema, EVENT_SPEAKERS);
export const eventCatalog = new StaticEventCatalogRepository(
  allEventRecords,
  allEventSpeakers,
  EVENT_SERIES,
  CONTENT_MODE,
);
export const allResources = validate('resources', publicResourceSchema, RESOURCES);
export const allPrograms = validate('programs', programSchema, PROGRAMS);
export const memberBenefits = validate('memberBenefits', benefitCategorySchema, MEMBER_BENEFITS);
export const benefitCategories = validate(
  'benefitCategories',
  benefitCategorySchema,
  BENEFIT_CATEGORIES,
);
export const membershipFaqs = validate('membershipFaqs', faqSchema, MEMBERSHIP_FAQS);
export const approvedSpeakers = validate(
  'approvedSpeakers',
  approvedSpeakerSchema,
  APPROVED_SPEAKERS,
);
export const approvedPartners = validate(
  'approvedPartners',
  approvedPartnerSchema,
  APPROVED_PARTNERS,
);
export const policies = validate('policies', policySchema, POLICIES);
export const primaryNav = validate('primaryNav', navItemSchema, PRIMARY_NAV);
export const footerNav = FOOTER_NAV.map((group) => ({
  heading: group.heading,
  items: validate(`footerNav.${group.heading}`, navItemSchema, group.items),
}));
export const socialLinks = validate('socialLinks', socialLinkSchema, SOCIAL_LINKS);

/* -- What this build may actually publish ---------------------------------- */

export const publishedEvents = publishable(allEvents, CONTENT_MODE, DRAFT_ALLOW_LIST);
export const publishedResources = publishable(allResources, CONTENT_MODE, DRAFT_ALLOW_LIST);
export const publishedPrograms = publishable(allPrograms, CONTENT_MODE, DRAFT_ALLOW_LIST);

/** Only social channels PAAIPE has actually supplied. */
export const configuredSocialLinks = socialLinks.filter((link) => Boolean(link.href));

/** Resolve any external handoff against the validated public configuration. */
export function externalAction(id: ExternalActionId) {
  return resolveExternalAction(id, publicConfig);
}

export { CONTENT_MODE };
export { publicConfig } from '../config';
export * from './organization';
export * from './home';
export * from './about';
export { PROGRAM_NOTES } from './programs';
// Named exports only. The raw EVENTS / RESOURCES arrays are deliberately NOT
// re-exported: a page importing them would bypass schema validation and the
// content-mode filter.
export {
  EVENT_TYPES,
  NEXT_EVENT_DEFAULT,
  EVENTS_INDEX,
  SIGNATURE_SERIES,
  MEMBER_LOCK,
  REGISTRATION_STATE_LABELS,
  EVENT_EMPTY_STATES,
  SPEAKERS_PAGE,
  EVENT_FORMAT_LABELS,
  TIME_ZONE_LABELS,
  EVENT_DETAIL_BLOCKS,
} from './events';
export {
  RESOURCE_TOPICS,
  RESOURCES_INDEX,
  RESOURCE_FILTER_ALL,
  RESOURCE_PREVIEWS,
  RESOURCE_FORMAT_VOCABULARY,
  MEMBER_RESOURCE_LOCK,
  RESOURCE_EMPTY_STATES,
} from './resources';
export {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_CAVEAT,
  PARTNERS_PAGE,
  COLLABORATION_AREAS,
  PARTNERSHIP_PROCESS,
} from './partners';
export * from './legal';
export {
  APPLICATION_STATUS_EXPLANATIONS,
  VERIFICATION_JOURNEY,
  MEMBERSHIP_PAGE,
  WHO_CAN_APPLY,
  BENEFITS_PAGE,
  MEMBERSHIP_NOTES,
} from './benefits';
