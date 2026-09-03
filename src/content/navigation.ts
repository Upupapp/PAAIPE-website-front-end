import type { NavItem, SocialLink } from './types';

/** Primary navigation from Tab 04. No protected destination appears here. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '/about',
    // A group never repeats its own parent destination: two links to the same
    // URL would both claim aria-current="page", which is ambiguous to announce.
    children: [{ label: 'Responsible AI', href: '/responsible-ai' }],
  },
  { label: 'Programs', href: '/programs' },
  {
    label: 'Events',
    href: '/events',
    children: [{ label: 'Speak at PAAIPE', href: '/speakers' }],
  },
  { label: 'Resources', href: '/resources' },
  { label: 'Membership', href: '/membership' },
  { label: 'Partners', href: '/partners' },
];

/** Grouped footer navigation. */
export const FOOTER_NAV: readonly { heading: string; items: readonly NavItem[] }[] = [
  {
    heading: 'Community',
    items: [
      { label: 'About PAAIPE', href: '/about' },
      { label: 'Programs', href: '/programs' },
      { label: 'Events', href: '/events' },
      { label: 'Speak at PAAIPE', href: '/speakers' },
    ],
  },
  {
    heading: 'Membership',
    items: [
      { label: 'Membership', href: '/membership' },
      { label: 'Member benefits', href: '/benefits' },
      { label: 'Partners', href: '/partners' },
    ],
  },
  {
    heading: 'Learn',
    items: [
      { label: 'Resources and insights', href: '/resources' },
      { label: 'Responsible AI', href: '/responsible-ai' },
    ],
  },
  {
    heading: 'This site',
    items: [
      { label: 'Contact', href: '/contact' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Privacy notice', href: '/privacy' },
      { label: 'Terms of use', href: '/terms' },
    ],
  },
];

/**
 * Social links.
 *
 * Every `href` is absent because PAAIPE has supplied no account. A guessed
 * handle could point at somebody else's profile, so an unconfigured channel is
 * simply not rendered.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: 'LinkedIn' },
  { label: 'Facebook' },
  { label: 'YouTube' },
];
