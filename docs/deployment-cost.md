# Deployment cost controls

Netlify bills **build minutes** and **bandwidth**. This document is the
mechanism that keeps both down, what each part actually saves, and — the part
that matters more — what could go wrong with it.

Owner rule, 2026-09-04: _"create a saving mechanism in deployment because
Netlify eats up a lot of credits and we always run out of credits."_

Everything here lives in `netlify.toml` and `scripts/netlify-ignore.mjs`, in the
repository. That is deliberate: **a cost control that lives in a diff can be
reviewed; one clicked into a hosting console shows up nowhere.**

---

## The controls, in order of what they save

### 1. The build command is minimal — the largest single saving

```toml
command = "npm run build"
```

The build is **0.7 s** of `astro build` plus the install. The gates are not on
it, and must never be:

| If this ran on Netlify      | Measured                        |
| --------------------------- | ------------------------------- |
| `npm run check` (17 gates)  | 22.8 s                          |
| Playwright, 5 projects      | 129.0 s                         |
| Lighthouse, median of three | 60.8 s                          |
| **Total, per deploy**       | **~3.5 minutes of billed time** |

All of it runs **locally before a push**, on the same commit, proving the same
thing. Running it again on billed minutes would re-prove a result that cannot
have changed. `npm run verify:deploy` fails if a test runner ever appears in the
build command.

### 2. Deploy previews and branch deploys are suppressed

```toml
[context.deploy-preview]
  ignore = "exit 0"
[context.branch-deploy]
  ignore = "exit 0"
```

**A preview build costs the same minutes as a production one.** Left on, every
pushed branch and every push to a pull request builds — which for an active
branch is more builds than production gets.

There is already a free local equivalent: `npm run preview` serves the real
production build. If a shared preview URL is ever genuinely needed for one
review, turn it on for that review and turn it back off. The cost is per build,
not per month.

### 3. The build-skip hook

```toml
ignore = "node scripts/netlify-ignore.mjs"
```

Netlify runs this before installing anything: **exit 0 cancels the build, any
other code runs it.** It cancels only when every changed path is proven unable
to affect `dist/`.

**Measured against this repository's own history: 1 of 20 commits would have
skipped — 5%.** That is a smaller number than the mechanism sounds like, and it
is the honest one. Tab commits bundle source and documentation together, so
most of them touch something real.

The share grows as a repository matures. Every commit from here that only
records a gate run, updates a report, refreshes screenshots or edits a test is
free. The two most recent commits at the time of writing were exactly that
shape.

### 4. Immutable caching on content-hashed assets

```toml
[[headers]]
  for = "/_astro/*"
  Cache-Control = "public, max-age=31536000, immutable"
```

The largest asset on every page is the logo: **80.3 KiB** as PNG, 58.8 KiB as
WebP, on all fifteen pages. Without a cache header a returning visitor
re-downloads it on every navigation and Netlify bills every byte. With it, a
repeat visitor re-downloads **none** of it.

`/_astro/`, `/brand/` and `/social/` are content-hashed or byte-pinned, so a
change produces a new filename and a stale cache is impossible. **HTML is
explicitly `max-age=0, must-revalidate`** — caching that would mean a content
fix never reaching anyone.

---

## The failure that matters, and why the polarity is the design

**Skipping a build that was needed is far worse than running one that was not.**

A wrongly-skipped build means a real fix silently never reaches visitors, and
the deploy log shows a cheerful _"build cancelled"_. Nobody investigates a
cancellation. The saving is measured in cents; the failure is measured in
however long it takes someone to notice the site is stale.

So the decision defaults to **BUILD**, and a skip needs positive proof:

| Situation                                       | Decision  |
| ----------------------------------------------- | --------- |
| No cached commit (first build, cache cleared)   | **BUILD** |
| Cached commit is this commit (a retry)          | **BUILD** |
| The diff could not be read                      | **BUILD** |
| The diff is empty between two different commits | **BUILD** |
| One changed path is not on the allow-list       | **BUILD** |
| Every changed path is on the allow-list         | skip      |

The empty-diff case is the one worth naming. `[].every(...)` is **true**, so
"all changed paths are irrelevant" is vacuously satisfied by zero paths — a
diff that failed to produce output would skip. It is checked explicitly.

## The allow-list

Five patterns, all anchored at the repository root:

```
^docs/        ^tests/        ^src/tests/        ^[^/]+\.md$        ^\.gitignore$
```

`src/` is absent apart from `src/tests/`. `package.json`, `package-lock.json`,
`astro.config.mjs`, `netlify.toml`, `public/` and every config file are absent
on purpose.

### It is proven, twice, by `npm run verify:deploy`

**Empirically.** Append a byte to a real committed file of every listed kind,
rebuild, and compare a hash of the whole output tree. It must be byte-identical.

**Structurally.** Walk the import graph from every page and from
`astro.config.mjs` — 99 files — and assert nothing it reaches is on the
allow-list.

The second check exists because the first is **not sufficient**, and that is
worth understanding: a trailing newline in a TypeScript file changes nothing in
the output _even when the build imports that file_, because the change is dead
code. The byte proof alone would happily accept `src/content/` on the
allow-list, and every content edit would then stop deploying. Both checks were
break-checked; adding `src/content/` fails with 16 findings naming the imports.

### Three entries were removed the first time the gate ran

`.claude/`, `.vscode/` and `LICENSE` matched no committed file. An untracked
path can never appear in a diff between two commits, so a pattern for one is
dead weight that only looks like caution — and **a dead entry is
indistinguishable from a misspelt one**, which is the case that actually costs a
missed deploy. Add one back when there is a committed file to prove it against.

---

## What this does NOT do

|                                         |                                                                                                                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nothing is deployed.**                | No Netlify site is linked to this remote. `netlify.toml` is inert until one is, and nothing has been pushed at all                                                                                                                                |
| **No header has been observed.**        | Every header in the file is UNVERIFIED. They are a reviewable plan, not a measurement                                                                                                                                                             |
| **No CSP is set.**                      | `BaseLayout` has one inline `<head>` script, and a static host cannot issue a per-response nonce. Enforcing a policy needs that script's SHA-256 hash. `unsafe-inline` would defeat the directive, so nothing ships until the hash mechanism does |
| **Build minutes are not metered here.** | The percentages above are counts of builds, not of minutes. Netlify's own billing page is the only authority on what was actually spent                                                                                                           |
| **It cannot save what it cannot see.**  | A site configured entirely in the Netlify dashboard ignores this file. Whoever links the site must confirm the repository config is the one in force                                                                                              |

## Measured on the live site, 2026-09-04

The site was connected to Netlify as `classy-quokka-2b788f`, deploying from
GitHub `main`. `npm run verify:live` was run against it.

| Check                                                                                                       | Result                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| All 12 indexed routes serve 200, each with its own H1                                                       | **PASS** — a catch-all serving one page for every path would fail this |
| A missing page returns 404                                                                                  | **PASS**                                                               |
| A missing asset returns 404                                                                                 | **PASS** — the catch-all trap is not present                           |
| `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, both `Cross-Origin-*`, `Permissions-Policy` | **all present** — `netlify.toml` is in force                           |
| `/_astro/*` and `/brand/*` immutable for a year                                                             | **PASS**                                                               |
| HTML `max-age=0, must-revalidate`                                                                           | **PASS**                                                               |
| Internal links redirect                                                                                     | **0 redirects** — after the fix below                                  |

### What it found

**Every internal link was paying a 301.** On the first deploy all eleven inner
routes returned `301 -> /about/ -> 200`. Astro's `directory` output emits
`about/index.html` and the host canonicalises `/about` to `/about/`, but this
site links to the no-slash form everywhere. Every navigation cost an extra round
trip before a byte of the page arrived.

`build.format: 'file'` fixed it: `about.html` is served at `/about` with a 200,
and no href, canonical, sitemap entry or test had to change. **Only a check
against the live URL could have found this** — the build itself was correct.

**Netlify overrides the staged HSTS.** `netlify.toml` asks for `max-age=300`;
the response carries `max-age=31536000; includeSubDomains; preload`. Netlify
owns and preloads `netlify.app`, so it enforces its own policy for every site on
that domain — and it is safe there precisely because Netlify guarantees HTTPS
for it. The staged value applies only on a custom domain, which is where staging
actually matters.

## Before linking a site

1. Confirm the build command in the dashboard is **empty** or `npm run build`,
   so this file wins.
2. Confirm deploy previews and branch deploys are off, or that the `ignore`
   overrides above are being honoured.
3. Watch the first two or three deploys and check the log says
   `netlify-ignore: BUILD — …` with a reason that makes sense.
4. Then push a documentation-only commit and confirm the log says
   `netlify-ignore: SKIP` and that the live site is unchanged.

Step 4 is the one to actually do. It is the only way to find out whether the
saving works, and it costs one build.
