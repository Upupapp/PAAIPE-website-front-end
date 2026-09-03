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
