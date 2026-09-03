# Pending register

Every unfinished item, with its reason and its owner. Updated **in the same
commit as the work** — never restarted per session.

States: **BLOCKED** (names what would unblock it) · **OWNER DECISION**
(silence is not approval) · **NOT REACHED** (queued, with the reason).

Last re-measured: 2026-09-03, at Tab 04 completion.

---

## Part 1 — Front end (F-#)

| id  | State          | Item                                                                                                    | Reason                                                                                                                                                          |
| --- | -------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1 | NOT REACHED    | Brand token set, `LogoLockup`, UI primitives, style page                                                | Tab 02 work. Not started; `src/styles/tokens.css` is a deliberate bootstrap minimum                                                                             |
| F-2 | NOT REACHED    | Typed content registries; delete `src/content/placeholders.ts` and the `template-preview` dynamic slugs | Tab 03 work                                                                                                                                                     |
| F-3 | NOT REACHED    | Real header, navigation, drawer, footer, announcement bar                                               | Tab 04 work. `BaseLayout.astro` is a minimal landmark shell only                                                                                                |
| F-4 | NOT REACHED    | Page content for every route                                                                            | Tabs 05–10. Each route currently renders its approved `<h1>` plus a scaffold note                                                                               |
| F-5 | NOT REACHED    | `site`, canonical URLs, sitemap, robots, JSON-LD                                                        | Tab 14. Blocked in practice on B-7 (no production origin)                                                                                                       |
| F-6 | NOT REACHED    | Built-bundle secret/privacy scan                                                                        | Tab 15. Tab 01's scans read **source only**; a source scan is not proof about `dist/`                                                                           |
| F-7 | NOT REACHED    | Performance budgets, Lighthouse runs, real-user monitoring plan                                         | Tab 14 / Tab 15                                                                                                                                                 |
| F-8 | OWNER DECISION | TypeScript pinned to 6.0.3, not 7.0.2                                                                   | `@astrojs/check@0.9.10` peer range is `^5 \|\| ^6`; TS 7 fails resolution. Revisit when `@astrojs/check` supports TS 7                                          |
| F-9 | NOT REACHED    | Keyboard tab-order test on mobile WebKit                                                                | Deliberately skipped: emulated mobile WebKit has no keyboard focus ring, so it measures the harness. Tab 13 covers real-device screen-reader and keyboard paths |

## Part 2 — PAAIPE decisions (B-#)

Full detail in [`frontend-audit.md`](frontend-audit.md) §5.

| id      | State                   | Item                                                                                                                                                                                                                       |
| ------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~B-1~~ | **RESOLVED 2026-09-03** | Owner ruled the uploaded logos are the ones to be used; the master command's checksums are stale. Gate pinned to the supplied files, divergence still reported every run. Dimension work done — see `frontend-audit.md` §8 |
| B-2     | OWNER DECISION          | Title separator: Tab 14 uses `-`, Tabs 05–10 use `\|`. Hyphen adopted (Tab 14 is the stated baseline). Confirm                                                                                                             |
| B-3     | OWNER DECISION          | Titles derived for `/benefits`, `/events/[slug]`, `/resources/[slug]`, `/404` — absent from the Tab 14 baseline                                                                                                            |
| B-4     | BLOCKED                 | No external destination configured (all seven `PUBLIC_*` values). Unblocks Tab 09 and Tab 10 sign-off                                                                                                                      |
| B-5     | BLOCKED                 | No approved typeface with a self-hosting licence. Unblocks Tab 02 typography                                                                                                                                               |
| B-6     | BLOCKED                 | No approved imagery in `public/media/`, including the hero Philippine map / network composition. Unblocks Tab 05 hero                                                                                                      |
| B-7     | BLOCKED                 | Production origin unknown, so `PUBLIC_SITE_URL` has no real value. Unblocks Tab 14 canonical URLs and sitemap                                                                                                              |
| B-8     | BLOCKED                 | Hosting owner, release method, rollback and incident contacts unnamed. Unblocks the Tab 16 operations gate                                                                                                                 |
| B-9     | BLOCKED                 | Legal text for `/privacy` and `/terms` not approved. Pages stay DRAFT FOR REVIEW                                                                                                                                           |

## Deliberately not done

Recorded so an omission is not read as an oversight:

- **No `.github/workflows`.** Standing repository rule: no CI workflow that
  consumes tokens. Gates run locally via `npm run check`.
- **No deployment, domain, hosting or production service** is configured. The
  master command requires a separate written release command from PAAIPE.
- **`npm run check` omits `test:e2e`** so it does not require browser binaries.
  Run `npm run test:e2e` explicitly before handing a tab over.

- **`public/media/` is empty.** No approved imagery has been supplied (B-6).
- **The Philippine map contour is not drawn.** See B-6 — a slot exists for an
  approved asset rather than an approximation.
- **`--paaipe-blue` is not the primary action fill.** It measures 4.14:1 against
  white, below AA. Navy is used instead; B-11 puts the choice to PAAIPE.
- **No dark-mode palette.** The master command specifies one light system, and
  inventing a second set of brand colours is out of scope.
- **The speaker and partner registries are empty on purpose.** A name, portrait,
  quote or logo there is a claim about a real party that nobody has agreed to.
- **No social link is rendered.** PAAIPE has supplied no account, and a guessed
  handle could point at somebody else's profile.
- **No event carries a date.** None has been approved; an invented date is a
  commitment nobody made.
- **No social block renders in the footer.** No account has been supplied, so
  dead labels that imply the accounts exist are omitted entirely.
- **Astro Content Collections were not used.** The content is structured
  registries, not authored markdown. TS modules plus Zod give the same
  validation with less indirection, and swapping later is contained to
  `src/content/`.
- **The logo artwork was not cropped** to even up its asymmetric safe space. Tab
  02 forbids cropping the logo; the measurement is recorded instead so the fix
  happens in CSS (F-10).
- **No `1200x418` horizontal rendition.** It is the only other exact scale below
  1:1, weighs 254 KiB — over the 250 KiB image budget — and has no consumer.
- **No WebP/AVIF logo variants.** PNG keeps the artwork lossless and the current
  weights are inside budget. Revisit in Tab 14 only if measurements demand it.
