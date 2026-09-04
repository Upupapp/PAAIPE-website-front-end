/**
 * The pending register — source of truth.
 *
 * `docs/PENDING.md` is GENERATED from this file by `npm run pending:write`, and
 * `src/tests/pending.test.ts` fails if the two disagree.
 *
 * Why generated: the register was hand-edited as a Markdown table for eight
 * tabs, and every edit was a literal string patch. Prettier re-pads the table
 * columns on each format run, so the anchors stopped matching and the edits
 * silently did nothing. The register sat frozen at its Tab 01 state while
 * reporting itself current — a stale register is worse than none, because it is
 * trusted.
 */
export type PendingState =
  'DONE' | 'IN PROGRESS' | 'BLOCKED' | 'OWNER DECISION' | 'NOT REACHED' | 'RESOLVED';

export interface PendingItem {
  id: string;
  state: PendingState;
  item: string;
  reason: string;
}

/** Front-end work. Ours to do, with the reason it is not done. */
export const FRONTEND_ITEMS: readonly PendingItem[] = [
  {
    id: 'F-1',
    state: 'DONE',
    item: 'Brand tokens, LogoLockup, 15 UI primitives, internal style guide, contrast gate',
    reason: 'Tab 02. See `brand-usage.md`',
  },
  {
    id: 'F-2',
    state: 'DONE',
    item: 'Typed, schema-validated content registries',
    reason: 'Tab 03. See `content-architecture.md`',
  },
  {
    id: 'F-3',
    state: 'DONE',
    item: 'Header, responsive navigation, mobile drawer, footer, announcement bar, branded 404',
    reason: 'Tab 04. See `shell-and-navigation.md`',
  },
  {
    id: 'F-4',
    state: 'DONE',
    item: 'Page content for every route',
    reason:
      '**Complete.** Every public route now renders real content from the registry. Tabs 11–16 refine motion, accessibility, SEO, testing and handoff rather than adding pages',
  },
  {
    id: 'F-5',
    state: 'DONE',
    item: 'Canonical URLs, sitemap, robots.txt, Organization/WebSite/BreadcrumbList JSON-LD',
    reason:
      'Tab 14. The machinery is complete, tested in the configured state, and DEGRADES HONESTLY while B-7 is open: no origin means no canonical, no `og:url`, no `og:image`, no sitemap file at all, and `twitter:card` drops to `summary`. Set `PUBLIC_SITE_URL` and every one appears with no code change. See `metadata-matrix.md`',
  },
  {
    id: 'F-6',
    state: 'IN PROGRESS',
    item: 'Built-bundle secret and privacy scan',
    reason:
      '`npm run verify:leak` scans both the review and production bundles (Tab 07). Tab 15 owns the wider sweep',
  },
  {
    id: 'F-7',
    state: 'NOT REACHED',
    item: 'Performance budgets, Lighthouse runs, real-user monitoring plan',
    reason:
      'Tabs 14–15. Nothing has been measured yet, so no budget is claimed to pass or to fail — every number reported in this repository so far is correctness, not speed',
  },
  {
    id: 'F-8',
    state: 'OWNER DECISION',
    item: 'TypeScript pinned to 6.0.3, not 7.0.2',
    reason:
      '`@astrojs/check@0.9.10` peer range is `^5 || ^6`; TS 7 fails resolution. Revisit when it supports TS 7',
  },
  {
    id: 'F-24',
    state: 'BLOCKED',
    item: 'Manual WCAG 2.2 AA checklist with a named reviewer and date',
    reason:
      'Tab 13 requires it and it has NOT been done. Automated scans found no serious or critical defect on any route in two engines, but axe cannot tell whether a heading describes its section, whether alt text is useful, or whether an announcement is comprehensible. Needs a person with VoiceOver and NVDA, one mobile screen-reader path, and real iOS and Android handsets. The single largest gap between what is verified and what Tab 13 asks for — see `accessibility-report.md` §6',
  },
  {
    id: 'F-9',
    state: 'NOT REACHED',
    item: 'Keyboard tab-order test on mobile WebKit',
    reason:
      'Deliberately skipped: emulated mobile WebKit has no keyboard focus ring, so it measures the harness. Tab 13 covers real-device paths',
  },
  {
    id: 'F-10',
    state: 'DONE',
    item: 'Optical centring for both logos',
    reason:
      'Tab 02. `align="optical"` compensates with exact negative margins; the artwork is not cropped',
  },
  {
    id: 'F-11',
    state: 'DONE',
    item: 'Favicon, `apple-touch-icon` and web-manifest wiring',
    reason:
      'Tab 14. 32px and 192px icons, a 180px apple-touch-icon, `manifest.webmanifest` with 192/512 icons, and `theme-color`. Every file is a proportional downscale of the canonical square logo; the manifest declares `display: browser` because this is an information site, not an installable app. An e2e test fetches every icon the document links and the manifest declares',
  },
  {
    id: 'F-12',
    state: 'DONE',
    item: 'Whether `/internal/style-guide` ships in the production build',
    reason:
      'Decided in Tab 14: it does NOT. `noindex` is a request to a crawler, not access control, and a static host has nowhere to put a login — the page would stay fetchable by anyone who guessed the path, and it names every component, token and forbidden pairing in the system. It now lives in `internal/[guide].astro` whose `getStaticPaths` returns one path in a review build and none in production, so `dist/internal/` does not exist. Both directions are asserted',
  },
  {
    id: 'F-13',
    state: 'BLOCKED',
    item: 'Approved typeface wiring (self-hosted WOFF2, `font-display`)',
    reason:
      'Blocked on B-5. A system stack is interim: local, zero network requests, one declaration to swap',
  },
  {
    id: 'F-14',
    state: 'BLOCKED',
    item: 'No content is `approved`',
    reason:
      'Every event and resource fixture is `sample`, so a production build publishes zero detail pages and no `Event` structured data. Unblocks when PAAIPE approves real articles and sessions',
  },
  {
    id: 'F-15',
    state: 'DONE',
    item: '`ContentBlock` rendering for resource article bodies',
    reason:
      'Tab 08. Paragraph, heading and list blocks render; no approved body copy exists, so the template shows an honest note',
  },
  {
    id: 'F-16',
    state: 'DONE',
    item: 'Members-only synopsis panel and locked event panel',
    reason:
      'Tabs 07–08. Both render from a view object that does not carry the private fields at all',
  },
  {
    id: 'F-17',
    state: 'DONE',
    item: 'Client-side route transitions and post-navigation focus management',
    reason:
      'Done in Tab 11. Astro ClientRouter with fallback="none"; the header persists across navigation and focus moves to the new main with preventScroll',
  },
  {
    id: 'F-22',
    state: 'BLOCKED',
    item: 'Real-device verification on Android and on the previous iOS major',
    reason:
      'Tab 12. Both browser projects here (Chromium desktop, WebKit mobile) exercise the UNSUPPORTED path; the supported path is covered by pure-function guard tests, which is the only way to assert it without an Android handset. A real-device pass belongs with Tab 15',
  },
  {
    id: 'F-23',
    state: 'NOT REACHED',
    item: 'Toast component and live-region priority rules',
    reason:
      'Tab 12 describes toasts, but nothing on this site produces one: there is no endpoint, so no confirmation, save or error message can occur. Building a toast with no caller would be a control that pretends. Revisit when B-4 lands',
  },
  {
    id: 'F-18',
    state: 'OWNER DECISION',
    item: 'The announcement bar is dismissible — the one use of browser storage',
    reason:
      'Tab 04 permits it explicitly. Bounded to `src/lib/dismissal.ts`, key from a closed union, value always `1`, enforced by four scope tests. Say if you would rather it were not dismissible',
  },
  {
    id: 'F-19',
    state: 'DONE',
    item: 'Social preview image and the wider metadata system',
    reason:
      'Tab 14. `public/social/paaipe-social-card.png` is 1200x630, composited by `npm run social:card` from the EXACT approved horizontal rendition on brand navy, optically centred, inside the tightest common platform crop. It carries NO rendered text: the default social title is the approved slogan, but no typeface is approved (B-5), so setting it would choose a face on PAAIPE\u2019s behalf on every share. The words live in `og:image:alt` instead. `npm run verify:social` re-composites and compares pixels, so the card cannot be hand-edited or regenerated',
  },
  {
    id: 'F-20',
    state: 'NOT REACHED',
    item: 'URL-addressable filter state on `/events` and `/resources`',
    reason:
      'Allowed "if appropriate". Deferred: with nothing published, neither filter is rendered at all',
  },
  {
    id: 'F-25',
    state: 'DONE',
    item: 'Measured performance budgets, Lighthouse gate and the recommended security headers',
    reason:
      'Tab 14. `npm run verify:budgets` measures the build against all six project budgets (worst route: 104 KiB of a 1 MiB initial-transfer budget, 90% headroom). `npm run lighthouse` runs the median-of-three mobile pass: 98/100/100/100. Recommended production headers, CSP and caching were documented in `security-privacy-handoff.md`; Tab 16 follow-up committed them to `netlify.toml`, where they are still UNVERIFIED because no site is linked',
  },
  {
    id: 'F-26',
    state: 'NOT REACHED',
    item: 'Real-user Core Web Vitals monitoring',
    reason:
      'Tab 14 asks for a field-data plan, and the plan is written (`performance-report.md` §3). It is not implemented: collecting field data is analytics, so it needs owner approval and a consent decision, and `verify:budgets` currently FAILS on any analytics endpoint. The lab numbers in the report are labelled as lab numbers and must not be read as field data',
  },
  {
    id: 'F-27',
    state: 'DONE',
    item: 'Verify the recommended security headers in a real response',
    reason:
      'MEASURED 2026-09-04 against the live deploy at classy-quokka-2b788f.netlify.app by `npm run verify:live`: X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy and Permissions-Policy are ALL present, caching is immutable on hashed assets and no-cache on HTML, and a missing page AND a missing asset both return a real 404. Two things it also found: Netlify OVERRIDES the staged HSTS on a *.netlify.app subdomain (it serves max-age=31536000 with preload, because it owns and preloads that domain), and CSP is still absent pending the inline script hash',
  },
  {
    id: 'F-28',
    state: 'DONE',
    item: 'The Tab 15 quality programme: journeys, four engines, visual regression, HTML validation, link integrity, content and brand audit',
    reason:
      'Tab 15. Chromium, Firefox, WebKit desktop and WebKit mobile, 861 browser assertions. Visual baselines at 320/390/768/1024/1440 in ONE engine (a pixel baseline is engine-specific). `verify:html`, `verify:links` and `audit:content` all run in BOTH content modes - the review build is where two of the three findings actually were',
  },
  {
    id: 'F-29',
    state: 'DONE',
    item: 'Three real defects found by the Tab 15 sweeps and fixed',
    reason:
      'A text input never shrinks below its intrinsic width (430px in a 390px viewport at 200% zoom); a grid item\u2019s `min-width: auto` floored the hero column so 48px of heading and buttons were CLIPPED behind `overflow: hidden` with no scrollbar to show for it, on six routes; and the announcement bar\u2019s dismiss button, revealed by script, shifted the page 21px for a CLS of 0.200 - twice the threshold, on every page load, with Lighthouse reporting 0.000',
  },
  {
    id: 'F-30',
    state: 'NOT REACHED',
    item: 'Manual pass on Desktop Edge',
    reason:
      'Tab 15\u2019s matrix names Edge. The chromium-desktop project covers the ENGINE; Edge layers its own features on top. Recorded in `browser-device-matrix.md` as owed rather than counted as covered',
  },
  {
    id: 'F-31',
    state: 'DONE',
    item: 'The Tab 16 handoff pack and the CONDITIONAL release gate',
    reason:
      'Owner ruling 2026-09-04: ship the machinery, let the machinery refuse the release. `npm run release:gate` runs from a DETACHED WORKTREE at a committed SHA, refuses a dirty tree, floors every parser (0 tests all passed is a FAILURE), asserts artifacts against `git ls-files` rather than the worktree, and exits NON-ZERO while any owner input is unmet. It names each blocker on its own row and flips a row green with NO edit to the gate when the input arrives - the detectors read the environment, the filesystem and content status',
  },
  {
    id: 'F-32',
    state: 'DONE',
    item: 'Nine integration contracts documented and NOT implemented',
    reason:
      'Tab 16. Membership, portal, status, speaker, partnership, contact/newsletter, CMS, analytics/consent, event registration. Each names its owner, interface, success/error/loading semantics, privacy considerations and current fallback. No fetch, no API client, no endpoint constant, no env var pointing at a server. The wall was restated by owner ruling on 2026-09-04 when a backend lane was created',
  },
  {
    id: 'F-33',
    state: 'DONE',
    item: 'Netlify deployment cost controls, with the allow-list proven twice',
    reason:
      'Owner rule 2026-09-04: Netlify eats credits. `netlify.toml` commits a minimal build command (the gates would add ~3.5 minutes of billed time per deploy and run locally already), suppressed deploy-preview and branch-deploy builds, immutable caching for hashed assets, and a build-skip hook. `npm run verify:deploy` proves the skip allow-list TWICE - byte-identical rebuild AND an import-graph walk - because a newline in a `.ts` file is dead code, so the byte proof alone would accept `src/content/` and every content edit would stop deploying. MEASURED on this repo\u2019s own history: 1 of 20 commits would skip (5%), which is smaller than it sounds and is the honest number. See `docs/deployment-cost.md`',
  },
  {
    id: 'F-34',
    state: 'IN PROGRESS',
    item: 'Confirm the Netlify cost controls actually take effect',
    reason:
      'Everything in `netlify.toml` is INERT until a site is linked to the remote, and a site configured entirely in the dashboard ignores the file. The one test that settles it: push a documentation-only commit and confirm the deploy log says `netlify-ignore: SKIP` and the live site is unchanged. It costs one build and it is the only way to find out',
  },
  {
    id: 'F-35',
    state: 'DONE',
    item: 'Every internal link paid a 301 on the first live deploy',
    reason:
      'MEASURED on the live site: all eleven inner routes returned 301, not 200. Astro `directory` output emits `about/index.html` and the host canonicalises `/about` to `/about/`, but this site links to the NO-SLASH form everywhere - so every internal navigation cost an extra round trip before a byte arrived. `build.format: file` emits `about.html`, served at `/about` with 200; no href, canonical, sitemap entry or test changed. Re-measured after: 0 redirects. Only a check against the LIVE URL could have found this - the build was correct',
  },
  {
    id: 'F-36',
    state: 'NOT REACHED',
    item: 'A Content-Security-Policy',
    reason:
      'Confirmed absent on the live deploy. BaseLayout has one inline `<head>` script that applies motion preferences before first paint, and a static host cannot issue a per-response nonce - so a policy needs that script\u2019s SHA-256 hash, computed at build time and written into the header. `unsafe-inline` would defeat the directive. Report-only first, then enforce',
  },
  {
    id: 'F-37',
    state: 'DONE',
    item: 'The review-only UI had never been accessibility-scanned',
    reason:
      '`npm run test:e2e` builds in PRODUCTION mode, where nothing is approved - so `/events` renders 0 cards and 0 filters and there are 0 detail pages. The components most likely to have a11y problems (interactive filters, record cards, the members-only lock panel with two CTAs, status and visibility badges, every detail page) had NEVER been scanned in a browser. The suite was green because it was looking at pages where those components do not exist. `npm run verify:a11y:review` now scans the review build in both engines - 52 page scans over 15 routes and 11 detail pages - and floors on producing no detail page, because a scan with none present would pass by covering what the production suite already covers. Result: 0 serious or critical violations. Break-checked: an `<img>` with no alt planted in EventCard fires in both engines, and the production build has 0 event cards so the existing suite could not have caught it',
  },
  {
    id: 'F-38',
    state: 'DONE',
    item: 'Events copy from the research lane, with the facts composed rather than retyped',
    reason:
      'Owner instruction 2026-09-04: ask the research lane for the best copy and treat its response as approved. The researcher DECLINED to confer approved status, ruling that only the owner can decide what counts as approved - it was right to decline, and the owner had already made the call, so the chain traces to a person. Applied: a pathway out of every empty state (they were dead ends - the page is mostly empty by design, so the empty state IS the primary state), a "who can attend" line, active voice on the past-events promise, and three detail blocks that make a locked session worth landing on. The cadence is COMPOSED from SIGNATURE_EVENT so a schedule change cannot leave some sentences stale while others update. NOT applied, on the researcher\u2019s own advice: an event code of conduct (PAAIPE has approved none), and any notify-me or subscription path (that is a mailing list, and this lane is front end only)',
  },
  {
    id: 'F-39',
    state: 'DONE',
    item: 'aria-current was missing from EVERY page, and then ambiguous on the home page',
    reason:
      'Two defects, one uncovered by the other. `build.format: file` made `Astro.url.pathname` `/about.html`, so every comparison against the route registry failed and `aria-current="page"` vanished sitewide - no current-page indicator and nothing for a screen reader to announce. The first fix was written twice in two components that then disagreed, leaving the home page broken; both now share `src/lib/current-path.ts`. Restoring it then exposed a PRE-EXISTING defect: the header brand link and the nav Home link both claimed `aria-current` on `/`, announcing "current page" twice for one page. The brand link no longer claims it - a masthead logo is a shortcut home, not a nav item. All of it was hidden because the guard sampled THREE routes and none was the home page; it is now derived from `primaryNav`',
  },
  {
    id: 'F-40',
    state: 'DONE',
    item: 'The header was a 165px three-row block; it is now one 81px row',
    reason:
      'ROOT CAUSE, measured not guessed: `.nav` was ONE flex box holding the links AND the actions with `flex-wrap: wrap`, so the actions dropped to a second line; and the actions used `ExternalAction`, which renders a disabled control plus a helper caption, adding a third. Brand/links/actions sat at top 97/56/120 in a 165px header. The wrap had been added in Tab 13 to survive 200% text zoom - it fixed that and broke the default case. Now a grid (`auto minmax(0,1fr)`), nothing shrinks, nothing wraps. A SECOND root cause only appeared after the first was fixed: the row needs 1147px but the shared container is 72rem/1152px, so at the old 1024px breakpoint the non-shrinking content overflowed LEFT and painted the logo over "Home" - the breakpoint is now 74em/1184px, measured. Header 81px at 1184px+, 73px tablet, 65px mobile; total with the 44px announcement 125px. Verified on 8 widths x 14 routes x 3 engines, 200%/400% zoom and increased text spacing, all four CTA permutations, with scrollWidth === clientWidth everywhere',
  },
  {
    id: 'F-41',
    state: 'DONE',
    item: 'Header CTAs follow a truth table: live or absent, never disabled',
    reason:
      '`ExternalAction` is right in a page body - a disabled control plus a visible reason is honest where the reader is looking for that action. In the GLOBAL header it put two disabled buttons and two captions on every page. Now: membership configured -> "Join PAAIPE" external; unconfigured -> "Explore Membership" to the real /membership page; portal configured -> "Member Sign In"; unconfigured -> OMITTED. No `#`, no invented /login, no disabled anchor. The "opening soon" wording moved to /membership, where somebody reading about membership will see it',
  },
  {
    id: 'F-42',
    state: 'DONE',
    item: 'The monthly series had two names; the owner ruled it is "PAAIPE AI Exchange"',
    reason:
      'OWNER RULING 2026-09-04. The site carried both: "PAAIPE Members\u2019 AI Exchange" as the series title, and "PAAIPE AI Exchange" in the announcement the owner supplied verbatim for the header repair - so the header disagreed with the rest of the site. Two names for one monthly forum is not a typo: it splits the thing in a reader\u2019s mind, and would have split the recurrence, the registrations and the history if a server ever modelled it. Renamed in 8 files (benefits, events, faqs, home, organization, programs, the events page, and the shell doc). `src/tests/series-name.test.ts` refuses every superseded spelling, straight and curly, so it cannot return one string at a time - scanning with comments STRIPPED, because the file recording the ruling quotes the old name to explain it. The backend lane reached the same answer independently (contract decision D-01) and treats the longer form as a migration alias. The owner then ruled on the slug too, the same day: the event and the programme both move to `paaipe-ai-exchange`, replacing a slug that still carried the superseded name. It was safe - nothing is `approved`, so no production page and no indexed URL used it - and it was raised with the backend lane first rather than changed unilaterally, so one decision covers both sides',
  },
  {
    id: 'F-43',
    state: 'RESOLVED',
    item: 'A commit took HALF of another session\u2019s change and broke every production build for 25 minutes',
    reason:
      'MEASURED 2026-09-04. Two sessions share this working tree. The other session was mid-edit on `src/lib/seo.ts` (adding a `seoContext()` factory) and on `src/pages/index.astro` (importing it). This session was independently editing the updates section of the SAME `index.astro`, staged \u201Conly my own files\u201D, and so committed their import while leaving their `seo.ts` behind. Every Netlify build from bf8bc7b failed with `[MISSING_EXPORT] \u201CseoContext\u201D is not exported by \u201Csrc/lib/seo.ts\u201D`; visitors kept the previous good deploy, so the site looked healthy while nothing shipped. The local build passed throughout, because the other session\u2019s uncommitted `seo.ts` was on disk \u2014 no check runnable in this tree could have caught it. FIXED at faf58c8 by restoring `index.astro` to the last good version plus only this session\u2019s change, staged as a blob with `git update-index` so the other session\u2019s working copy was neither reverted nor destroyed. THE RULE THAT REPLACES THE FAILED ONE: \u201Cstage only my own files\u201D is not sufficient in a shared tree \u2014 it fails silently whenever the other session has edited a file this one also edited. What catches it is a build from a CLEAN CHECKOUT OF THE COMMITTED SHA taken BEFORE the push, which is now what the gate does.',
  },
  {
    id: 'F-44',
    state: 'RESOLVED',
    item: 'Two whole screens had never been loaded by a browser, and the check that should have caught it was blind',
    reason:
      'MEASURED 2026-09-04. `src/pages/events/[slug].astro` and `src/pages/resources/[slug].astro` only generate pages in REVIEW content mode; Playwright boots `npm run build`, which is production, where they generate none. The suite\u2019s only statement about either was that it 404s - correct, and the reason 861 browser assertions stood beside two screens with none of them ON those screens. FIXED with `playwright.review.config.ts` and `npm run test:e2e:review`: a second config on its own port and testDir that builds review mode and asserts H1, heading order, the review label, axe at WCAG 2.2 AA, breadcrumbs, JSON-LD and reflow across Chromium and mobile WebKit - 180 assertions where there were none. SECOND DEFECT, found by break-checking the first: the reflow assertion read `documentElement.scrollWidth`, and a 1200px element planted in the page did not move it, because `section.page-hero` carries `overflow-x: hidden` and CLIPPED it instead. The document reported a contented 320 = 320 while 880px sat outside the box - and clipping is the worse failure, since sideways scroll is at least reachable. The production suite measured it the same blind way on every route. NOW measures what the clip COSTS - text and controls past the box edge - after two false positives were dismissed on evidence: `.sr-only` is a 1px box clipping on purpose, and the logo renders 132px inside a 119px box because negative margins trim the asset\u2019s transparent padding (measured on the shipped asset: 41px of transparent pixels right, trim removes the equivalent of 40px, so what is cut is empty). `tests/e2e/reflow.spec.ts` now runs it over every public route at 320px and at 640px (a 1280 desktop at 200% zoom): 116 assertions, no clipping found.',
  },
  {
    id: 'F-45',
    state: 'DONE',
    item: 'The events section promised timing it could not keep, and gave a non-member two dead controls',
    reason:
      'Copy researched against published guidance and approved by the owner in advance. THREE CHANGES. (1) The badge said "Announcement Coming Soon"; "soon" is a timing claim PAAIPE has not established, which the FTC dark-patterns report treats as a misleading impression and NPC Advisory 2023-01 - binding on PAAIPE as a personal information controller - names as content-based deceptive design. It now reads "Date Not Announced", which states the fact and does not age. (2) Empty-state headings are positive statements of what the space is for (IBM Carbon) rather than restatements of the absence the reader already sees. (3) The members-only lock panel offered two EXTERNAL handoffs and nothing else; both are unconfigured under owner item B-4, so a non-member met two unavailable controls and no way onward - the asymmetric-effort pattern the NPC advisory prohibits, and the login wall NN/g found is abandoned rather than climbed. It now leads with two INTERNAL routes that work regardless of configuration, /membership and /contact, at equal prominence. ONE PIECE OF THE RESEARCHED COPY WAS REJECTED ON EVIDENCE: it routed the past-events empty state to /resources, and /resources currently renders "No resources are published yet." Sending a reader from an empty list to an empty list is the hollow promise the empty state exists to avoid. /programs was checked and carries real content, so that is where it points.',
  },
  {
    id: 'F-46',
    state: 'RESOLVED',
    item: 'Refused the paywalled-content markup for members-only pages, and guarded the refusal',
    reason:
      'DECIDED 2026-09-04 against Google\u2019s own specification, not against a summary of it. The research lane recommended `isAccessibleForFree: false` plus a `hasPart` `WebPageElement` whose `cssSelector` names the restricted region - Google\u2019s documented way to declare gated content honestly. Read at source, it does not fit these pages: the spec says "Add a class name around each paywalled section of your page ... The cssSelector references the class name that you added", so the selector points at RESTRICTED CONTENT THAT IS PRESENT IN THE HTML and merely concealed. Our boundary is structural instead - on a members-only page the date, speaker and joining link are ABSENT, not hidden. MEASURED on a review build of /events/paaipe-ai-exchange: no hidden-content wrapper, no `display:none` prose in `<main>`, and none of the private access details anywhere in the document (the scope-boundary gate scans this file for those literal tokens, so they are described here rather than spelled). There is nothing for a selector to point at, and `isAccessibleForFree: false` over a page whose every word is free to read would misdescribe it - which Google\u2019s general structured-data guidelines forbid outright. So nothing is emitted, and TWO GUARDS make the decision durable rather than a note someone can miss: a restriction claim must name an element and that element must exist and hold content; and a members-only page must withhold STRUCTURALLY - no leak pattern in the HTML and no block of text served then hidden with CSS. Both break-checked three ways (a claim naming nothing, a selector matching nothing, and content served then hidden), each firing on its own defect. The hidden-content probe is scoped to `<main>`: unscoped it reported five "hidden blocks" on every page - `<head>`, a `<script>` and three `<style>` elements, for which `display: none` is the default - which is a probe measuring the document\u2019s machinery rather than concealed prose.',
  },
  {
    id: 'F-47',
    state: 'RESOLVED',
    item: 'The Philippine map contour is shipped - derived from public-domain geodata, not drawn',
    reason:
      'B-6 held this back for a precise reason: an APPROXIMATED national outline is a credibility risk for a Philippine association, while the master command asks for "subtle independent Philippine map contours". Drawing one by eye would have earned that risk; this derives one. SOURCE: Natural Earth 1:50m Admin 0 - Countries, public domain ("All versions of Natural Earth raster + vector map data found on this website are in the public domain"), no permission or attribution required and derivative use explicitly permitted - read at the source, not assumed. The Philippines feature is VENDORED at `scripts/data/ph-outline.geojson` so a build never depends on a network call; `npm run media:contour` generates `public/media/ph-contour.svg` from it, and `npm run media:check` runs inside `npm run check`, so the asset cannot drift from its source. Reduced by Ramer-Douglas-Peucker at a stated tolerance: every point drawn is a real coordinate from the source, none invented, moved or smoothed. It renders in NetworkField\u2019s `map` slot on the HOME hero only, aria-hidden, inheriting the field\u2019s colour and opacity. It is decoration and NOT a statement of territorial extent, taking no position on any maritime or territorial question. AND IT DOES NOT CLOSE B-6: that item asks for two things and its detector counted any image in `public/media/`, so this asset would have flipped it green while the EDITORIAL imagery it actually blocks on was still missing. `release-facts.mjs` now excludes generated output, because a repository that can satisfy an owner input by writing a file is a gate measuring its own output - the same error as the earlier bug that counted the README explaining the absence as evidence of the presence. B-6 is narrowed to editorial imagery with confirmed usage rights and stays BLOCKED on the owner.',
  },
  {
    id: 'F-48',
    state: 'RESOLVED',
    item: 'The visual regression gate could not see a full-page decorative layer',
    reason:
      'FOUND by break-checking F-47, not by reading the gate. Adding an entire Philippine contour to the home hero - roughly 600x1020 of visible stroke - passed all five widths against baselines that did not contain it, and REMOVING it again also passed. The gate could not tell the two states apart. TWO CAUSES, only the second binding. (1) `maxDiffPixelRatio: 0.002` on a FULL-PAGE capture takes the whole page as its denominator: the home page is 1440x6976, so 20,090 pixels were permitted to differ, and the taller a page grew the less the gate saw. Replaced with `maxDiffPixels: 4000`, which cannot be inflated by page length and sits about three times above the measured run-to-run noise here (1,232-1,323 differing pixels from sub-pixel text rendering). (2) The real blindness was Playwright\u2019s DEFAULT `threshold: 0.2` - a pixel must differ by that much in YIQ before it counts as different at all, so a faint decorative layer never cleared it and the budget was never consulted. Measured by bisection with the contour removed: 0.2 passes, 0.1 passes, 0.05 FAILS correctly. 0.05 is therefore not a guess but the first value at which this gate can see a change a person can see. VERIFIED both ways at the committed settings: contour present 20/20 across two consecutive runs; contour removed fails at the three widths where it is visible, the two narrow widths cropping it away as the mobile capture confirms. METHOD NOTE, because this was got wrong twice first: `--update-snapshots` only rewrites a baseline that MISMATCHES, so an unchanged file hash proves nothing about what a capture contains; and `reuseExistingServer` lets a run silently test a STALE build, so every measurement here was retaken after killing the server.',
  },
  {
    id: 'F-49',
    state: 'RESOLVED',
    item: 'B-5 was a decision PLUS an implementation; it is now just a decision',
    reason:
      'B-5 asks PAAIPE for an approved typeface with a self-hosting licence, and it stayed blocked partly because supplying it was not one act. `APPROVED_TYPEFACE` was a constant NOTHING read - so closing B-5 meant choosing a face AND writing the @font-face rules, the preload, the token override and the tests, which is not work the person able to make the choice can do. `src/lib/typeface.ts` is that implementation, and it is INERT: with the constant null it returns null, and a build emits no @font-face, no preload and no font request - asserted on the rendered page, not assumed. Supplying B-5 is now one woff2 in `public/fonts/` plus one constant, and the gate flips on its own. A CODE PATH GUARDED BY A CONSTANT IS UNTESTED BY DEFAULT, so the configured branch is driven by a fixture and was additionally break-checked by temporarily filling the constant: @font-face and preload appeared in the built HTML with the right weight range, and vanished when reverted. Two design choices are load-bearing: the family is PREPENDED to the stack (`--font-sans-fallback` was split out) so a 404 on the woff2 falls back to today system stack rather than the browser default; and the function REFUSES a relative path, a non-woff2 file, an empty file list or an unquotable family, because each of those fails silently in a way that looks exactly like a font that merely has not loaded. SHORTLIST in `docs/typeface-shortlist.md`, six candidates MEASURED rather than quoted (19.7-47.2 KiB against a 150 KiB budget) with licences read from each project own licence file (all SIL OFL 1.1) and the latin subset checked character by character for Filipino - n-tilde and the accented vowels are all covered, so no latin-ext is needed. Neither licence nor performance discriminates between them, which is the finding: this is a design decision for PAAIPE, not a technical one. Recommended Public Sans, with Figtree as the brand-forward alternative. ONE REGRESSION, CAUGHT BY A GUARD BUILT EARLIER THE SAME DAY: wiring the constant into `BaseLayout` made it import `./release`, which imports the owner register - so `src/config/pending.ts` entered the page import graph and its build-skip allow-list entry became false. `verify:deploy` refused it by name, exactly as designed, BEFORE a deploy could be silently skipped. Fixed at the cause rather than by loosening the allow-list: `APPROVED_TYPEFACE` moved to a LEAF module `src/config/typeface.ts`, the same pattern `APPROVED_ORIGIN` already follows, so the register stays out of the graph and the deploy saving stays intact. NO FONT BINARY WAS COMMITTED - speculative for a face that may not be chosen, and PAAIPE may hold a licence for another.',
  },
  {
    id: 'F-50',
    state: 'RESOLVED',
    item: 'The legal text is written - B-9 is now an adoption, not an authoring job',
    reason:
      'OWNER INSTRUCTION 2026-09-04: write the legal text. WHAT WAS THERE: a scaffold - eleven headings, a one-line summary each, and about thirty bracketed placeholders. That was the right shape while nothing could be written, but most of those holes were not facts PAAIPE holds; they were text nobody had written, and leaving them unwritten kept B-9 blocked on the owner for work that was never theirs. NOW WRITTEN: a full privacy notice and terms of use, roughly 1,860 and 1,900 words, built on the research lane draft in research-lane/findings/2026-09-04-b9-legal-text-draft.md and grounded in RA 10173 (s.12(f) as the basis for hosting logs, s.16 rights, s.21 accountability for transfers), its IRR s.34, NPC Advisory 2017-01 for the DPO publication duty, RA 8293 s.185 for fair use, RA 8792 for electronic records, RA 10175 for unauthorised access, and RA 7394 as a right the terms cannot exclude. THE NOTICE DESCRIBES THIS SITE, not a template: it collects nothing a visitor types, sets no cookie, runs no analytics, and the one stored value is a local announcement-bar preference that never leaves the browser. The one real processing is the hosting request log, and it is named as such with its basis - PAAIPE is a controller today, not on the day forms are switched on. A forward-looking section describes registration and subscriptions as explicitly NOT ENABLED, so the document is complete without being inaccurate. Netlify publishes no visitor-log retention period - it sits in its DPA - so that stays a placeholder with the reason stated rather than a guess. FIVE PLACEHOLDERS REMAIN, all facts only PAAIPE holds: the DPO block (deferred), the registered name and address, the venue, and two adoption dates. B-9 STAYS OPEN because adoption is an organisational act; what changed is that it is now a decision rather than a project. THREE GATES HAD TO BE REWRITTEN, and all three were pinning the old shape rather than a property: one asserted exactly eleven sections (it would have passed eleven EMPTY ones, and failed the moment the notice gained the liability and governing-law sections it needed) - now asserts subject COVERAGE by pattern, naming the subject when one is missing; one required MORE THAN TEN unresolved placeholders in each document, which made writing the text a test failure; and one banned the phrase "effective date" across the whole object, which flagged the placeholder that exists precisely to say there is no effective date yet - a gate objecting to the explanation of its own rule, for the second time in this repo. The browser gate had the same defect (more than eight visible placeholders) and now counts RENDERED placeholders against DECLARED ones, which is strictly stronger and still works when the last one is resolved. AND ONE STALE CLAIM CAUGHT BY LOOKING AT THE PAGE: both leads still said "It is not legal text", true of a scaffold and false of a draft. Corrected in both directions - the text is written, and it is still not in force.',
  },
  {
    id: 'F-21',
    state: 'DONE',
    item: 'This register is generated, not hand-edited',
    reason:
      'It sat frozen at its Tab 01 state for seven tabs because every edit was a literal patch against a table Prettier keeps re-padding. Now generated from `src/config/pending.ts` with a test asserting the two agree',
  },
];

/** Decisions and inputs only PAAIPE can supply. */
export const OWNER_ITEMS: readonly PendingItem[] = [
  {
    id: 'B-1',
    state: 'RESOLVED',
    item: 'Logo checksums do not match the master command',
    reason:
      'Owner ruled 2026-09-03 that the uploaded logos are authoritative and the document checksums are stale. The gate is pinned to the supplied files and still reports the divergence every run',
  },
  {
    id: 'B-2',
    state: 'OWNER DECISION',
    item: 'Title separator: Tab 14 uses `-`, Tabs 05–10 use `|`',
    reason: 'Hyphen adopted, because Tab 14 is the stated route-metadata baseline. Confirm',
  },
  {
    id: 'B-3',
    state: 'OWNER DECISION',
    item: 'Titles derived for `/benefits`, both `[slug]` templates and `/404`',
    reason: 'Absent from the Tab 14 baseline table',
  },
  {
    id: 'B-4',
    state: 'BLOCKED',
    item: 'No external destination is configured (all seven `PUBLIC_*` values)',
    reason:
      'All six handoffs resolve through one resolver and render honest unavailable states meanwhile. The site is correct, but every action does nothing. Unblocks Tabs 09–10 sign-off',
  },
  {
    id: 'B-5',
    state: 'BLOCKED',
    item: 'No approved typeface with a self-hosting licence',
    reason: 'A system stack is in place meanwhile (F-13)',
  },
  {
    id: 'B-6',
    state: 'BLOCKED',
    item: 'No approved imagery in `public/media/`',
    reason:
      'The node-field / orbit / grid motif is built, but the **Philippine map contour is deliberately not drawn** — approximating a national outline is a credibility risk for a Philippine association. `NetworkField` exposes a `map` slot for an approved asset',
  },
  {
    id: 'B-7',
    state: 'BLOCKED',
    item: 'The APPROVED production origin, checked live on every run',
    reason:
      'DECIDED by the owner 2026-09-04: use the Netlify URL for now, customise the domain in Netlify later. `PUBLIC_SITE_URL` is set in `netlify.toml` to `https://classy-quokka-2b788f.netlify.app`, and `APPROVED_ORIGIN` in `src/config/site-origin.ts` names the same origin with this record as its source - both halves, which is what turns on the canonical, `og:url`, `og:image` and a 12-URL sitemap. It stays a tracked release input rather than being marked resolved, because the DETECTOR is a live check that an approved origin is configured - a gate that stops checking something because a human said it was done is how a regression ships. WHEN A CUSTOM DOMAIN IS ADDED BOTH LINES MUST CHANGE: a canonical states the authoritative address of a page, and leaving it on the old host after a move tells crawlers the new site is a copy. Update only one and the build withholds every absolute URL and sends `noindex, follow` until they agree',
  },
  {
    id: 'B-8',
    state: 'BLOCKED',
    item: 'Hosting owner, release method, rollback and incident contacts unnamed',
    reason:
      'Netlify is now the named platform (owner rule, 2026-09-04) and `netlify.toml` commits the cost controls and the header plan - but the file is INERT until a site is linked, and naming a platform is not naming an owner. Still unnamed: who owns the hosting account, whether a release is atomic, how a bad release is rolled back, what monitors the site, and who is called when it breaks. See `docs/deployment-cost.md`',
  },
  {
    id: 'B-9',
    state: 'BLOCKED',
    item: 'Legal text for `/privacy` and `/terms` not approved',
    reason: 'Both pages stay DRAFT FOR REVIEW; the schema refuses a draft policy with no banner',
  },
  {
    id: 'B-10',
    state: 'OWNER DECISION',
    item: 'Status colours are derived, not brand',
    reason:
      'The master command supplies no status palette and form validation cannot be built without one. `#B3261E` / `#0F6E4F` / `#8A5A00`, each clearing 4.5:1 as text on white and as a surface under white text. Approve or replace',
  },
  {
    id: 'B-11',
    state: 'OWNER DECISION',
    item: 'Electric blue cannot carry a white label',
    reason:
      'White on `--paaipe-blue #0878F9` measures 4.14:1, below AA, so primary actions use navy. Shifting blue 8% toward navy — `#0872EE` — reaches 4.51:1 and would make an electric-blue action legal',
  },
  {
    id: 'B-12',
    state: 'OWNER DECISION',
    item: 'Tab 05 names a programme Tab 06 does not',
    reason:
      '"Community Conversations" appears in the home preview but not in Tab 06\'s six programmes. Added with Tab 05\'s approved copy, giving seven. Confirm it belongs in the full list',
  },
  {
    id: 'B-13',
    state: 'OWNER DECISION',
    item: 'Bare hyphens where an em dash may be intended',
    reason:
      '"the AI future-not simply watch it happen", "Discover PAAIPE-a professional community", "community-helping people", "working with-or preparing for-artificial intelligence". Reproduced exactly as supplied rather than silently corrected — the slogan proves the source preserves typographic characters where it means them',
  },
  {
    id: 'B-14',
    state: 'OWNER DECISION',
    item: 'Two different value lists',
    reason:
      'Tab 03: five single words. Tab 06: five named values with descriptions. Only "Practical" overlaps. Both kept; About uses Tab 06\'s',
  },
  {
    id: 'B-15',
    state: 'OWNER DECISION',
    item: 'Two different audience lists',
    reason:
      "Tab 03: five categories. Tab 06: seven entries. Both kept; About uses Tab 06's, the home audience strip uses Tab 03's",
  },
  {
    id: 'B-16',
    state: 'OWNER DECISION',
    item: 'Two different resource-format vocabularies',
    reason:
      "Tab 03's schema enum is `guide / insight / replay / template / checklist`; Tab 08 lists Explainer, Guide, Checklist, Video, Event recap, Template, External reference. The enum stays authoritative for the type",
  },
];

/** Recorded so an omission is never read as an oversight. */
export const DELIBERATE_OMISSIONS: readonly string[] = [
  'No `.github/workflows`. Standing repository rule: no CI workflow that consumes tokens. Gates run locally via `npm run check`.',
  'No deployment, domain, hosting or production service is configured. The master command requires a separate written release command.',
  '`npm run check` omits `test:e2e` so it does not require browser binaries. Run it explicitly before handing a tab over.',
  '`public/media/` is empty. No approved imagery has been supplied (B-6).',
  'The Philippine map contour is not drawn. A slot exists for an approved asset rather than an approximation.',
  'The logo artwork was not cropped to even its asymmetric safe space. Tab 02 forbids cropping; the measurement is recorded so the fix happens in CSS.',
  'No `1200x418` horizontal logo rendition. It is the only other exact scale below 1:1, weighs 254 KiB — over budget — and has no consumer.',
  'No AVIF logo variants. Measured on the header lockup, lossless AVIF is 100.6 KiB against the PNG\u2019s 82.2 KiB — larger. Lossless WebP twins DO ship (58.8 KiB, pixel-identical wherever alpha > 0); lossy WebP would be 32.4 KiB and is refused because it alters the artwork.',
  '`--paaipe-blue` is not the primary action fill. It measures 4.14:1 against white, below AA (B-11).',
  'No dark-mode palette. One light system is specified; inventing a second set of brand colours is out of scope.',
  'The speaker and partner registries are empty on purpose. A name, portrait, quote or logo there is a claim about a real party nobody has agreed to.',
  "No social link renders. No account has been supplied, and a guessed handle could point at somebody else's profile.",
  'No event carries a date. None has been approved; an invented date is a commitment nobody made.',
  'Astro Content Collections were not used. This is structured registry data, not authored markdown.',
  'The home insights cards and the resources "In preparation" cards are not links. Nothing is published, so nothing may be opened.',
  'The updates signup has no `<form>`. With no endpoint, a form element could only ever produce a false success.',
  'No `Event` structured data is emitted. Nothing is approved, and marking up an event that does not exist would put a fabricated listing into search results.',
  'The events and resources filters are not rendered while their lists are empty. A control that can only do nothing is its own kind of dishonesty.',
  'Visual regression runs in ONE engine. A pixel baseline is engine-specific - font rasterisation, antialiasing and scrollbar width all differ - so three engines would mean three sets of baselines and three ways for a browser update to turn the suite red for no product reason. Cross-engine differences are caught by geometry and behaviour assertions, which DO run everywhere.',
  'The CLS and long-task measurement runs in Chromium only. `layout-shift` and `longtask` are not implemented in Firefox or WebKit, so an observer there would return nothing and the test would pass by measuring nothing. It asserts the entry types are supported before it trusts a zero.',
  '`require-sri` is narrowed to cross-origin rather than disabled. Every script and stylesheet is same-origin and content-hashed; an SRI hash over our own build adds no guarantee. A cross-origin script still fails this rule, `verify:budgets`, and the e2e zero-third-party assertion.',
  'No real-device pass anywhere. Playwright drives the same ENGINES the browsers ship, which is not the same as running Chrome, Edge or Safari, and much further from a real handset. Every matrix row says which kind of coverage it is.',
  'No canonical tag, `og:url`, `og:image` or `sitemap.xml` is emitted, and `twitter:card` is `summary` rather than `summary_large_image`. Each needs an absolute URL and `PUBLIC_SITE_URL` is unset (B-7). A canonical pointing at a guessed origin would de-index the real page; an empty `<urlset>` would tell a crawler the site has no pages. The machinery is built and tested in the configured state — see `metadata-matrix.md`.',
  'No `og:image` carries rendered text, though the approved default social title is the slogan. No typeface is approved (B-5), so rendering it would choose a face on PAAIPE\u2019s behalf on every share. The words are in `og:image:alt` and `og:title`, where they need no font.',
  'No `hreflang` alternates. There is no translated version of this site, and declaring one would point crawlers at pages that do not exist.',
  'No `SearchAction` in the `WebSite` JSON-LD. The site has no search endpoint, and declaring one that 404s is a broken claim.',
  'No `Organization` founding date, address, telephone, email, `sameAs` profile, member count or rating. None is an approved fact, and a guessed one is a fabricated claim in machine-readable form.',
  'No `Article`/`BlogPosting` structured data. It requires an approved, public resource with a real `publishedAt` AND public body copy; nothing in the registry has all four, so the builder returns null.',
  'No `author` on the Article builder even when it fires. No resource carries an approved byline, and inventing one attributes writing to a person who never agreed to it.',
  'No security header has been OBSERVED in a response. `netlify.toml` now commits the header plan alongside the deployment cost controls (owner rule, 2026-09-04), but no site is linked to the remote, so the file is inert and every header in it is UNVERIFIED. A static build cannot set a header by itself; only a host can.',
  'No Content-Security-Policy is set, even though `netlify.toml` sets the other headers. BaseLayout has one inline `<head>` script that applies motion preferences before first paint, and a static host cannot issue a per-response nonce - enforcing a policy needs that script\u2019s SHA-256 hash. Shipping `unsafe-inline` instead would defeat the directive entirely.',
  'No cookie banner. Nothing is stored without an interaction and nothing optional is stored at all, so a consent interface would be a false statement about what the site does.',
  'No real-user monitoring. Field data collection is analytics: it needs owner approval and a consent decision, and `verify:budgets` currently fails on any analytics endpoint.',
];

export const ALL_PENDING = [...FRONTEND_ITEMS, ...OWNER_ITEMS];
