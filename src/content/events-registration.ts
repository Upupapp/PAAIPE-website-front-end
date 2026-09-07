/**
 * Approved registration copy, Tab 05. Reproduced exactly as the command gives
 * it - an approved string that has been "improved" in transit is an unapproved
 * string, and this is the one screen where the words carry legal weight.
 *
 * WHY THE MARKETING BLOCK IS ABSENT ENTIRELY. The command permits it "only if
 * PAAIPE has approved the purpose, notice, storage contract, and
 * preference-management flow". None of those exists. An unchecked box would
 * still assert that a marketing choice was PRESENTED, and a stored `false` is a
 * record of a consent interaction that never happened - the kind of record read
 * back years later as though it were evidence. There is no marketing constant
 * in this file and no field for it in the request type.
 */
import type { RegistrationOutcome } from '../lib/registration/types';

/** The three form variants. Which one renders is the resolver's decision. */
export const REGISTRATION_FORMS = {
  public: {
    eyebrow: 'RESERVE YOUR PLACE',
    heading: 'Register with your email',
    body:
      'Enter the email address where you want to receive your registration message ' +
      'and essential event instructions.',
    label: 'Email address',
    submit: 'Register with email',
    supporting: 'Email only · No account or password required',
  },
  waitlist: {
    eyebrow: 'JOIN THE WAITLIST',
    heading: 'Join the waitlist',
    body:
      'Leave your email and we will contact you if a place becomes available. ' +
      'Joining the waitlist does not guarantee admission.',
    label: 'Email address',
    submit: 'Join the waitlist',
    supporting: 'Email only · No account or password required',
  },
  member: {
    eyebrow: 'VERIFIED MEMBERS ONLY',
    heading: 'Register with your membership email',
    body:
      'Use the email connected to your PAAIPE membership. We’ll verify eligibility ' +
      'and send the next step by email.',
    label: 'Membership email',
    submit: 'Request member registration',
    /*
     * NOT a reassurance - a statement of what this page structurally cannot do.
     * The client never receives an eligibility result, so it could not display
     * one even if asked to.
     */
    supporting:
      'For your privacy, this page will not display whether an email is connected to a PAAIPE membership.',
  },
} as const;

export type RegistrationFormVariant = keyof typeof REGISTRATION_FORMS;

/** Shared field copy. The placeholder is an example, never the label. */
export const EMAIL_FIELD = {
  placeholder: 'you@example.com',
  hint: 'Use an inbox you can access before the event.',
  pending: 'Registering…',
} as const;

/**
 * The just-in-time notice, immediately before the submit control.
 *
 * DRAFT - NOT APPROVED FOR PUBLICATION. It states only the PURPOSE, which is a
 * fact about what the service does. It names no lawful basis and no retention
 * period, because the frontend must not invent either; those live in the full
 * notice once PAAIPE's responsible owner has decided them.
 */
export const REGISTRATION_PRIVACY_NOTICE = {
  text:
    'PAAIPE uses your email to process this registration and send essential event messages, ' +
    'including confirmation, access instructions, reminders, and schedule or cancellation updates.',
  linkLabel: 'See the Privacy Notice.',
  reviewState: 'DRAFT - NOT APPROVED FOR PUBLICATION',
} as const;

/** Validation copy. Concise and specific, exactly as supplied. */
export const VALIDATION_MESSAGES = {
  empty: 'Enter your email address.',
  malformed: 'Enter a valid email address.',
  tooLong: 'That email address is too long. Check it and try again.',
} as const;

/** Failure copy, keyed by the gateway's stable error codes. */
export const ERROR_MESSAGES = {
  offline: 'You are offline. Reconnect before registering. Nothing has been submitted.',
  'network-error':
    'Registration was not submitted. We couldn’t confirm your request. Please try again.',
  'temporarily-unavailable':
    'Registration was not submitted. We couldn’t confirm your request. Please try again.',
  'rate-limited': 'Please wait before trying again. Your registration has not been confirmed yet.',
  'state-changed':
    'Registration status changed. Refresh the event information and review the available option.',
  closed:
    'Registration status changed. Refresh the event information and review the available option.',
  cancelled:
    'Registration status changed. Refresh the event information and review the available option.',
  'idempotency-conflict':
    'Registration status changed. Refresh the event information and review the available option.',
  'invalid-request': 'Enter a valid email address.',
  'configuration-missing':
    'Online registration is being connected. Please check back soon. No registration has been recorded.',
} as const;

/**
 * Result copy, per mapped outcome.
 *
 * NOTHING HERE SAYS "You're registered" EXCEPT `registered`. The command is
 * explicit, and it is the single most important line on this screen: a person
 * told they have a place when only a verification email has been sent will not
 * check their inbox, and will arrive at an event expecting to be admitted.
 */
export const RESULT_STATES: Record<RegistrationOutcome, { heading: string; message: string }> = {
  registered: {
    heading: 'Registration received',
    message: 'Check your inbox for confirmation and essential event instructions.',
  },
  'verification-required': {
    heading: 'Check your inbox',
    message: 'Follow the message we sent to complete your registration.',
  },
  'eligibility-check': {
    heading: 'Check your inbox',
    message:
      'If this email is eligible, we’ll send the next step. Membership status is not displayed here.',
  },
  waitlisted: {
    heading: 'You’re on the waitlist',
    message: 'Watch your inbox for updates. A waitlist entry does not guarantee admission.',
  },
  'already-received': {
    heading: 'Request already received',
    message: 'Check your inbox for the latest registration message.',
  },
  cancelled: {
    heading: 'Event cancelled',
    message:
      'This event has been cancelled. Registered participants will receive updates through the email used to register.',
  },
};

export const ERROR_SUMMARY_TITLE = 'There is a problem';
