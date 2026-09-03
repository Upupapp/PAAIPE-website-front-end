# Global shell, navigation and footer

Tab 04 deliverable. Landmark order: skip link → announcement region → header
(with primary nav) → `main` → footer.

---

## 1. Components

| Component                                             | File                                          |
| ----------------------------------------------------- | --------------------------------------------- |
| `AnnouncementBar`                                     | `components/shell/AnnouncementBar.astro`      |
| `PublicHeader`                                        | `components/shell/PublicHeader.astro`         |
| `ResponsiveNavigation`                                | `components/shell/ResponsiveNavigation.astro` |
| `PublicFooter`                                        | `components/shell/PublicFooter.astro`         |
| `NotFound`                                            | `components/shell/NotFound.astro`             |
| `Breadcrumbs`, `PageHero`, `CTASection`, `EmptyState` | `components/ui/`                              |
| `ExternalAction`, `SectionHeading`                    | delivered in Tabs 02–03                       |

## 2. Progressive enhancement — the shell works without JavaScript

Every navigation link is a real `<a href>` present in the initial HTML. One
markup tree serves both layouts: above 64em it is a horizontal nav, below it
becomes a drawer, and **without script it is a plain stacked list**.

The menu button ships with the `hidden` attribute and is revealed by script, so
a visitor without JavaScript is never offered a control that does nothing. A
browser test runs with `javaScriptEnabled: false` and asserts the toggle is
hidden **and** that all seven primary destinations are still reachable.

> **A real bug this caught.** `[hidden]` gets `display: none` from the UA
> stylesheet, but **any** author `display` rule outranks it — and
> `.site-header__toggle { display: grid }` did exactly that. Without JavaScript
> the menu button rendered, and did nothing. Fixed with a global
> `[hidden] { display: none !important }`.

## 3. Navigation

Primary: Home, About, Programs, Events, Resources, Membership, Partners.
Persistent actions: **Join PAAIPE** (primary) and **Member Sign In** (secondary),
both resolved through `ExternalAction`, both currently showing their honest
unavailable state.

Two groups carry a dropdown — About → Responsible AI, Events → Speak at PAAIPE.
The panel is hidden with `opacity`/`visibility`, **not** `display: none`, so it
stays keyboard reachable and opens on `:focus-within` as well as `:hover`.

### Active route

`aria-current="page"` plus an inset underline bar — never colour alone. A parent
whose section is current but whose page is not gets `data-current-group`
instead.

> **A real bug this caught.** A destination appearing twice in the nav made
> **two** links claim `aria-current="page"`, which is ambiguous to announce.
> `/about` was both a parent and a child; `/programs` was both a top-level item
> and a child of About. A unit test now asserts every href appears in the
> primary nav exactly once, catching it at the data rather than in a browser.

### Mobile drawer

Focus moves into the drawer on open, is trapped while it is modal, returns to
the toggle on close. Escape closes it; so does an overlay click. The trap is
**conditional** on the mobile media query — trapping focus in what is an
ordinary horizontal nav above the breakpoint would itself be a keyboard trap.
Resizing past the breakpoint while open closes it without stealing focus.

> **A real bug this caught.** `visibility` was transitioned symmetrically, so
> the drawer was still `visibility: hidden` while sliding in — and `focus()` on
> a hidden element **silently does nothing**. The menu opened with focus left on
> the toggle. Fixed by flipping `visibility` instantly on open and delaying it
> only on close (`visibility 0s linear 280ms`). A browser test presses Tab 30
> times and asserts focus never escapes.

## 4. Sticky header

Sticky, with a **fixed 72px min-height**: it compacts only its shadow, never its
height and never the logo, so it cannot shift layout.

`scroll-padding-top: 88px` on the document keeps it from covering an element that
has just received focus (WCAG 2.4.11). A browser test scrolls, focuses a footer
link and asserts its rect does not intersect the header's.

## 5. Announcement bar

Data-driven and optional; omitting the message renders nothing. It carries only
the approved line:

> Members' AI Exchange - every second Tuesday at 8:00 PM PHT.

No meeting link, no unapproved speaker or date, no countdown or urgency
language. A test asserts the rendered HTML contains no `zoom.us`.

### The one place browser storage is permitted

Tab 04 allows storing a dismissal preference; Tab 03 forbids using storage to
mimic success or access. Both hold because `src/lib/dismissal.ts` **cannot
express anything else**: the key comes from a closed union and the value is
always the literal `'1'`.

The scope-boundary suite enforces the boundary rather than trusting it:

- storage APIs may appear in **exactly one** allow-listed file;
- that file must still exist and still use storage, so a stale entry cannot
  silently permit nothing;
- every `setItem` in it must match `PREFIX + key, '1'`;
- **no** file may store anything matching viewer, applicant, member, status,
  token, session, email or auth.

A browser test dismisses the bar and asserts `localStorage` contains exactly
`{ 'paaipe:dismissed:announcement': '1' }` and nothing else.

## 6. Footer

Exact horizontal logo, full organisation name, exact slogan, the approved
description, grouped public navigation, legal links marked **(draft)**, and a
configurable contact action.

**Social links render only when an account has been supplied.** None has, so the
block is omitted entirely rather than showing dead labels that imply the
accounts exist.

## 7. Branded 404

`/404` returns a **real 404 status** — the preview server serves `dist/404.html`
with status 404, never a soft 200 — with Return Home, Explore Events and Contact
Website Support.

## 8. Responsive

No page-level horizontal overflow at **360, 390, 768, 1024 and 1440px**, asserted
per width across four representative routes. Wide tables scroll inside a
keyboard-operable `ScrollRegion`; the page itself never does.

## 9. The evidence tool was lying

The first Tab 04 screenshots showed **both header dropdowns open**. The page was
fine: computed style at rest was `opacity: 0; visibility: hidden`.

A `fullPage` screenshot perturbs the viewport, which makes Chromium re-evaluate
hover targets — with the pointer at its `(0,0)` default that opened the
dropdowns, and the capture caught them mid-transition at `opacity: 0.62`. The
"evidence" showed a state no visitor ever sees.

Two fixes, because either alone would have been a guess:

1. `scripts/capture-screenshots.mjs` now parks the pointer clear of the header
   and lets transitions settle before every capture.
2. A browser test asserts the dropdown is **closed at rest**, opens on hover,
   closes when the pointer leaves, and opens on focus. The page state is now
   measured, not photographed.
