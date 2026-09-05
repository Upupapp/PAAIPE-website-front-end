/**
 * Runtime schemas for every public content registry.
 *
 * Validation runs at BUILD time (see `src/content/index.ts`), so a malformed
 * record fails the build rather than rendering as an empty card.
 *
 * Every object schema is `.strict()`. A non-strict Zod object silently DROPS
 * unknown keys, so a typo in a fixture key would validate cleanly and the field
 * would simply be missing at render time - the failure would look like missing
 * content rather than a bad key.
 */
import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be ISO yyyy-mm-dd')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Not a real calendar date');

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slugs are lowercase kebab-case');

export const visibilitySchema = z.enum(['public', 'members-only']);
export const contentStatusSchema = z.enum(['approved', 'draft', 'sample']);
export const viewerStateSchema = z.enum(['public', 'applicant-pending']);

export const publicImageSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('placeholder'), tone: z.enum(['navy', 'surface', 'cyan']) }).strict(),
  z
    .object({
      kind: z.literal('file'),
      // Must be a site-relative path. An absolute URL here would mean the build
      // depends on a third party for an image.
      src: z.string().regex(/^\/(?!\/)/, 'Image paths must be site-relative'),
      alt: z.string(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .strict(),
]);

export const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string().min(1) }).strict(),
  z
    .object({
      type: z.literal('heading'),
      level: z.union([z.literal(2), z.literal(3)]),
      text: z.string().min(1),
    })
    .strict(),
  z.object({ type: z.literal('list'), items: z.array(z.string().min(1)).min(1) }).strict(),
]);

export const approvedSpeakerSchema = z
  .object({
    slug,
    name: z.string().min(1),
    title: z.string().min(1),
    portrait: publicImageSchema.optional(),
    approvedOn: isoDate,
  })
  .strict();

export const approvedPartnerSchema = z
  .object({
    slug,
    name: z.string().min(1),
    category: z.enum([
      'ai-and-technology',
      'education-and-training',
      'enterprise-and-startup',
      'professional-association',
      'academic-and-research',
      'public-interest',
    ]),
    logo: publicImageSchema.optional(),
    approvedOn: isoDate,
  })
  .strict();

export const publicEventSchema = z
  .object({
    slug,
    title: z.string().min(1),
    excerpt: z.string().min(1),
    visibility: visibilitySchema,
    contentStatus: contentStatusSchema,
    date: isoDate.optional(),
    timeZone: z.literal('Asia/Manila'),
    format: z.enum(['online', 'in-person', 'hybrid']),
    duration: z.string().optional(),
    publicAgenda: z.array(z.string().min(1)),
    approvedSpeaker: approvedSpeakerSchema.optional(),
    status: z.enum(['upcoming', 'completed', 'postponed']),
    registrationState: z.enum([
      'registration-open',
      'members-only',
      'limited-capacity',
      'registration-closed',
      'event-completed',
      'recording-available-to-eligible-members',
      'announcement-coming-soon',
    ]),
    capacityConfigured: z.boolean().optional(),
    image: publicImageSchema,
  })
  .strict()
  .refine(
    (event) => event.registrationState !== 'limited-capacity' || event.capacityConfigured === true,
    {
      message:
        '"Limited Capacity" may be shown only when real capacity data is configured (capacityConfigured: true).',
    },
  )
  .refine(
    (event) =>
      event.visibility !== 'members-only' || event.registrationState !== 'registration-open',
    {
      message: 'A members-only event must not advertise open public registration.',
    },
  )
  .refine((event) => event.contentStatus === 'approved' || event.approvedSpeaker === undefined, {
    message: 'Only approved content may name a speaker.',
  });

export const publicResourceSchema = z
  .object({
    slug,
    title: z.string().min(1),
    excerpt: z.string().min(1),
    visibility: visibilitySchema,
    contentStatus: contentStatusSchema,
    format: z.enum(['guide', 'insight', 'replay', 'template', 'checklist']),
    topics: z
      .array(
        z.enum([
          'AI Foundations',
          'Practical Adoption',
          'Responsible AI',
          'Business & Entrepreneurship',
          'Tools & Workflows',
          'Philippine AI Community',
          'Event Recaps',
        ]),
      )
      .min(1),
    publicBody: z.array(contentBlockSchema).optional(),
    cover: publicImageSchema,
    publishedAt: isoDate.optional(),
    updatedAt: isoDate.optional(),
  })
  .strict()
  .refine(
    (resource) => resource.visibility !== 'members-only' || resource.publicBody === undefined,
    {
      message:
        'A members-only resource must expose only a synopsis. Public body copy would leak protected content into the client bundle.',
    },
  )
  .refine(
    (resource) => resource.contentStatus === 'approved' || resource.publishedAt === undefined,
    {
      message: 'Only approved content may claim a publication date.',
    },
  )
  .refine(
    (resource) =>
      resource.publishedAt === undefined ||
      resource.updatedAt === undefined ||
      resource.updatedAt >= resource.publishedAt,
    { message: 'updatedAt cannot precede publishedAt.' },
  );

export const programSchema = z
  .object({
    slug,
    name: z.string().min(1),
    category: z.string().min(1),
    summary: z.string().min(1),
    visibility: visibilitySchema,
    contentStatus: contentStatusSchema,
    badge: z.string().min(1),
  })
  .strict();

export const benefitCategorySchema = z
  .object({
    slug,
    name: z.string().min(1),
    description: z.string().min(1),
    requiresPartnerDisclaimer: z.boolean(),
  })
  .strict();

export const faqSchema = z
  .object({ slug, question: z.string().min(1), answer: z.string().min(1) })
  .strict();

export const policySchema = z
  .object({
    slug,
    title: z.string().min(1),
    status: z.enum(['draft-for-review', 'approved']),
    reviewBanner: z.string().optional(),
  })
  .strict()
  .refine((policy) => policy.status !== 'draft-for-review' || Boolean(policy.reviewBanner), {
    message: 'A draft policy must carry a visible review banner.',
  });

const navItemBase = z.object({
  label: z.string().min(1),
  href: z.string().regex(/^\//, 'Nav links are site-relative'),
});
export const navItemSchema = navItemBase
  .extend({ children: z.array(navItemBase.strict()).optional() })
  .strict();

export const socialLinkSchema = z
  .object({
    label: z.string().min(1),
    href: z.url().startsWith('https://').optional(),
  })
  .strict();

/* ---------------------------------------------------------------------------
 * Events Continuation — the event record schema (Tab 02 Step 3)
 *
 * Every rule the command lists is enforced HERE, at build time, so an
 * impossible combination fails the build rather than rendering as a page that
 * quietly contradicts itself.
 * ------------------------------------------------------------------------- */

/**
 * A concrete instant in Philippine time, with the offset written out.
 *
 * The offset is REQUIRED and must be `+08:00`. A bare `2026-09-08T20:00:00`
 * means whatever timezone the machine parsing it happens to be in - which on a
 * CI runner is UTC, moving every event eight hours and breaking the
 * second-Tuesday rule in a way that looks like a data error rather than a
 * timezone one.
 */
const manilaInstant = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/,
    'Must be an ISO timestamp ending +08:00, e.g. 2026-09-08T20:00:00+08:00',
  )
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Not a real instant');

/** Reads the wall-clock parts straight from the string, never via local time. */
function manilaParts(value: string) {
  const [, y, m, d, hh, mm] = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)!;
  return {
    year: Number(y),
    month: Number(m),
    day: Number(d),
    hour: Number(hh),
    minute: Number(mm),
    /** 0 = Sunday. Built in UTC so no local offset can shift the weekday. */
    weekday: new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))).getUTCDay(),
  };
}

const eventImageSchema = z
  .object({
    src: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string(),
    credit: z.string().min(1).optional(),
    rightsApproved: z.boolean(),
  })
  .strict();

export const publicSpeakerSchema = z
  .object({
    id: slug,
    contentStatus: contentStatusSchema,
    name: z.string().min(1),
    role: z.string().min(1).optional(),
    organization: z.string().min(1).optional(),
    shortBio: z.string().min(1).optional(),
    portrait: eventImageSchema.optional(),
    profileUrl: z.string().url().optional(),
  })
  .strict()
  .refine(
    (speaker) =>
      speaker.contentStatus !== 'approved' || !speaker.portrait || speaker.portrait.rightsApproved,
    { message: 'An approved speaker portrait needs rightsApproved: true', path: ['portrait'] },
  );

const registrationPolicySchema = z
  .object({
    mode: z.literal('email'),
    state: z.enum(['not-open', 'open', 'waitlist', 'full', 'closed']),
    opensAt: manilaInstant.optional(),
    closesAt: manilaInstant.optional(),
    requiresVerifiedMembership: z.boolean(),
    waitlistEnabled: z.boolean(),
    showCapacity: z.literal(false),
    privacyNoticeVersion: z.string().min(1),
    eventVersion: z.string().min(1),
  })
  .strict()
  .refine((policy) => policy.state !== 'waitlist' || policy.waitlistEnabled, {
    message: 'A waitlist state requires waitlistEnabled: true',
    path: ['waitlistEnabled'],
  });

export const publicEventRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: slug,
    slug,
    seriesId: slug.optional(),
    title: z.string().min(1),
    eyebrow: z.string().min(1).optional(),
    excerpt: z.string().min(1),
    description: z.array(z.string().min(1)),
    contentStatus: contentStatusSchema,
    type: z.enum(['ai-exchange', 'workshop', 'briefing', 'roundtable', 'collaborative-session']),
    access: visibilitySchema,
    format: z.enum(['online', 'in-person', 'hybrid']),
    lifecycle: z.enum(['scheduled', 'cancelled', 'completed']),
    startAt: manilaInstant.optional(),
    endAt: manilaInstant.optional(),
    timeZone: z.literal('Asia/Manila'),
    durationMinutes: z.number().int().positive().optional(),
    formatLabel: z.string().min(1),
    publicAgenda: z.array(
      z.object({ label: z.string().min(1), detail: z.string().min(1).optional() }).strict(),
    ),
    learningOutcomes: z.array(z.string().min(1)),
    audience: z.array(z.string().min(1)),
    speakerIds: z.array(slug),
    topicTags: z.array(z.string().min(1)),
    registration: registrationPolicySchema,
    media: eventImageSchema,
    faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) }).strict()),
    relatedSlugs: z.array(slug),
    featured: z.boolean(),
    seo: z.object({ title: z.string().min(1), description: z.string().min(1) }).strict(),
    publishedAt: isoDate.optional(),
    updatedAt: isoDate.optional(),
  })
  .strict()
  .superRefine((event, ctx) => {
    const fail = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: 'custom', message, path });

    /* Access and membership are one fact expressed twice; they must agree. */
    if (event.access === 'members-only' && !event.registration.requiresVerifiedMembership) {
      fail(
        'A members-only event must set requiresVerifiedMembership: true, or anyone can register for it',
        ['registration', 'requiresVerifiedMembership'],
      );
    }
    if (event.access === 'public' && event.registration.requiresVerifiedMembership) {
      fail('A public event must set requiresVerifiedMembership: false', [
        'registration',
        'requiresVerifiedMembership',
      ]);
    }

    /* An event that has been cancelled or has finished cannot be joined. */
    if (
      event.lifecycle !== 'scheduled' &&
      (event.registration.state === 'open' || event.registration.state === 'waitlist')
    ) {
      fail(
        `A ${event.lifecycle} event cannot have registration state "${event.registration.state}"`,
        ['registration', 'state'],
      );
    }

    /* Schedule: both ends or neither, ordered, and the duration must agree. */
    if ((event.startAt && !event.endAt) || (!event.startAt && event.endAt)) {
      fail('An event has both startAt and endAt, or neither', ['endAt']);
    }
    if (event.startAt && event.endAt) {
      const start = Date.parse(event.startAt);
      const end = Date.parse(event.endAt);
      if (!(start < end)) fail('startAt must be before endAt', ['endAt']);

      const minutes = Math.round((end - start) / 60_000);
      if (event.durationMinutes === undefined) {
        fail('A scheduled event must state durationMinutes', ['durationMinutes']);
      } else if (event.durationMinutes !== minutes) {
        fail(`durationMinutes is ${event.durationMinutes} but the timestamps span ${minutes}`, [
          'durationMinutes',
        ]);
      }

      /*
       * The PAAIPE AI Exchange is an approved recurrence, and the approved facts
       * are exact: second Tuesday, 8:00 PM Philippine time, one hour maximum.
       * An instance that drifts from them is a published contradiction of the
       * series page, so it fails here rather than being noticed by a reader.
       */
      if (event.type === 'ai-exchange') {
        const at = manilaParts(event.startAt);
        if (at.weekday !== 2 || at.day < 8 || at.day > 14) {
          fail('A PAAIPE AI Exchange falls on the SECOND TUESDAY of the month', ['startAt']);
        }
        if (at.hour !== 20 || at.minute !== 0) {
          fail('A PAAIPE AI Exchange begins at 8:00 PM Philippine time', ['startAt']);
        }
        if (minutes > 60) {
          fail('A PAAIPE AI Exchange runs one hour maximum', ['endAt']);
        }
      }
    } else if (event.registration.state === 'open' || event.registration.state === 'waitlist') {
      /*
       * Registration cannot be open for an event with no date. The recurrence
       * description is not a substitute for an announced instance, and a person
       * cannot be asked to register for a time nobody has set.
       */
      fail('Registration cannot be open on an event with no confirmed schedule', [
        'registration',
        'state',
      ]);
    }

    /* An approved record is one a stranger will see. Its media must be cleared. */
    if (event.contentStatus === 'approved' && !event.media.rightsApproved) {
      fail('An approved event needs media with rightsApproved: true', ['media', 'rightsApproved']);
    }
  });
