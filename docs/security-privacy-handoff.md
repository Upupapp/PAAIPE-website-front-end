# Security and privacy handoff

Tab 14 of the PAAIPE Frontend Master Command. This document is the frontend
lane's handoff to whoever operates the hosting. It states what the build
already guarantees, and what it **cannot** guarantee because it is a header or
a hosting setting rather than a file.

The site is a static build with no server runtime, so every header below has to
be set by the host.

**Since 2026-09-04, Netlify is the named platform** and `netlify.toml` commits
the headers below alongside the deployment cost controls — see
`docs/deployment-cost.md`. Committing them is deliberate: a header that lives in
a diff can be reviewed, where one clicked into a hosting console shows up
nowhere.

**They are still UNVERIFIED.** No Netlify site is linked to the remote, so the
file is inert and not one of these headers has been observed in a real
response. Naming a platform is also not resolving **B-8** — the hosting owner,
the atomic release method, rollback, monitoring and incident contacts are still
unnamed, and the release gate still reports B-8 as unmet.

---

## 1. What the build already guarantees

Each of these is asserted by a gate in `npm run check`, not merely intended.

| Guarantee                                                                                                                                                                                         | Gate                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No secret, credential, meeting URL, meeting ID, passcode, protected asset path or member record in the shipped bundle                                                                             | `npm run verify:leak` — scans the built output in **both** content modes                                                                                                                                                                                |
| No third-party script, stylesheet, image, iframe or analytics endpoint                                                                                                                            | `npm run verify:budgets`, plus an e2e test that asserts a page load makes **zero** cross-origin requests                                                                                                                                                |
| Nothing written to cookies, `localStorage` or `sessionStorage` before an interaction                                                                                                              | e2e test `nothing is stored before anyone interacts`                                                                                                                                                                                                    |
| No `javascript:`, empty or `#` href anywhere                                                                                                                                                      | e2e test `no page ships a dead, empty or javascript: href`                                                                                                                                                                                              |
| Every external link carries `rel="noopener noreferrer"` and cannot reach `window.opener`                                                                                                          | `src/tests/security-posture.test.ts` — a **source** assertion on `Button.astro`, plus a scan proving no other file sets `target="_blank"` or calls `window.open`. See §6.4: no destination is configured, so a browser test would find nothing to check |
| No unsanitised HTML injection: `set:html` appears in exactly one file and only for JSON-LD, and no `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval` or `new Function` appears anywhere | `src/tests/security-posture.test.ts`; the escaping itself in `src/tests/seo.test.ts`                                                                                                                                                                    |
| The internal style guide is **absent** from the production build, not merely `noindex`                                                                                                            | `scripts/verify-seo.mjs`, both modes                                                                                                                                                                                                                    |
| No `http://` reference in source, so nothing can become mixed content, and an `http://` destination supplied by environment is refused at parse time rather than rendered                         | `src/tests/security-posture.test.ts`                                                                                                                                                                                                                    |
| A lockfile is committed, so a release can install exactly what was tested                                                                                                                         | `package-lock.json`                                                                                                                                                                                                                                     |

### Content that does not exist in the bundle

The privacy boundary is a **type**, not a filter. `publicEventFields()` and
`publicResourceFields()` return objects that, for a members-only record, **do
not carry** the private fields at all — no `speakerName`, no `duration`, no
`body` key. A template cannot leak them by forgetting to omit them, because
there is nothing to omit. The same applies to the external-action resolver: its
`unavailable` branch has no `href` field.

---

## 2. Recommended production headers

Set these at the host. Each line says what it buys and what to watch.

| Header                                | Value                                                                                                                                                                                                                                                                                                                                                   | Notes                                                                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTPS redirect                        | 301 from `http://` to `https://`, all paths                                                                                                                                                                                                                                                                                                             | Prerequisite for everything below.                                                                                                                                                                  |
| `Strict-Transport-Security`           | Stage it: `max-age=300` → `max-age=31536000` → add `includeSubDomains` → consider `preload`                                                                                                                                                                                                                                                             | **Staged deliberately.** A long `max-age` set before HTTPS is proven correct locks visitors out of a site that cannot serve it. Do not `preload` until the final value has run unchanged for weeks. |
| `Content-Security-Policy-Report-Only` | See §3                                                                                                                                                                                                                                                                                                                                                  | Deploy report-only **first**, watch the reports, then enforce.                                                                                                                                      |
| `Content-Security-Policy`             | The same policy, once report-only is clean                                                                                                                                                                                                                                                                                                              |                                                                                                                                                                                                     |
| `X-Content-Type-Options`              | `nosniff`                                                                                                                                                                                                                                                                                                                                               | The site serves `.webmanifest`, `.webp` and `.xml`; sniffing any of them is never wanted.                                                                                                           |
| `Referrer-Policy`                     | `strict-origin-when-cross-origin`                                                                                                                                                                                                                                                                                                                       |                                                                                                                                                                                                     |
| `Permissions-Policy`                  | `accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), usb=(), xr-spatial-tracking=()` | The site needs **none** of these. It uses the Vibration API, which is not gated by Permissions-Policy.                                                                                              |
| `X-Frame-Options`                     | `DENY`                                                                                                                                                                                                                                                                                                                                                  | Kept alongside `frame-ancestors` for older browsers.                                                                                                                                                |
| `Cross-Origin-Opener-Policy`          | `same-origin`                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                                                     |
| `Cross-Origin-Resource-Policy`        | `same-origin`                                                                                                                                                                                                                                                                                                                                           |                                                                                                                                                                                                     |

### Caching

| Path                                                   | Recommended                           | Why                                                                |
| ------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------ |
| `/_astro/*`                                            | `public, max-age=31536000, immutable` | Content-hashed filenames.                                          |
| `/brand/*`, `/social/*`                                | `public, max-age=31536000, immutable` | Byte-pinned by `npm run verify:brand`; a change means a new build. |
| `*.html`                                               | `public, max-age=0, must-revalidate`  | So a content fix is visible immediately.                           |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` | `public, max-age=3600`                |                                                                    |

A Lighthouse run against the local preview server reports `cache-insight`
failing. That is the preview server, which sets no cache headers at all — it
exists to serve tests, not to model production. The recommendation above is what
production should send; verify it against the real host after deploy.

---

## 3. Content Security Policy

The site loads nothing from another origin, so the policy can be strict from the
start. One nuance: `BaseLayout.astro` has a small **inline** script that sets
`class="js"` and applies the stored motion preferences _before first paint_ —
moving it out of the document would reintroduce the flash of unstyled motion it
exists to prevent. So it needs either a nonce or a hash.

```
default-src 'none';
script-src 'self' 'nonce-<PER-RESPONSE-NONCE>';
style-src 'self';
img-src 'self';
font-src 'self';
connect-src 'self';
manifest-src 'self';
base-uri 'none';
form-action 'none';
frame-ancestors 'none';
object-src 'none';
upgrade-insecure-requests
```

- **`form-action 'none'` is correct today.** There is no form that submits
  anywhere: every membership, speaker and partnership handoff is an external
  link or a disabled control. When a real form is added, this must change with
  it — and the change is a deliberate decision, not a footnote.
- **`'nonce-…'` needs a per-response value**, which a static host can only do
  if it supports header templating. If it cannot, use the SHA-256 hash of the
  inline script instead. Do **not** fall back to `'unsafe-inline'`: that
  defeats the whole directive.
- `default-src 'none'` with explicit allowances means a future third-party
  script fails visibly in the console rather than quietly shipping.

---

## 4. Privacy posture

There is **no** analytics, no advertising pixel, no fingerprinting, no session
replay and no consent platform. That is the starting position the master
command requires, and it is asserted by tests rather than asserted in prose.

**No cookie banner is shown, because nothing needs consent.** A banner for a
site that stores nothing would be a false statement about what it does.

### What is stored, and when

| Key                         | Written when                                      | Contains                |
| --------------------------- | ------------------------------------------------- | ----------------------- |
| `paaipe:pref:reduce-motion` | The visitor changes the motion preference         | `on`, `off` or `system` |
| `paaipe:pref:pause-ambient` | The visitor changes the ambient-motion preference | `on`, `off` or `system` |
| `paaipe:pref:haptics`       | The visitor turns on haptics                      | `on`, `off` or `system` |
| `paaipe:dismissed:*`        | The visitor dismisses the announcement bar        | `1`                     |

All four are written **only** in response to an interaction, hold a value from a
closed union, and are the visitor's own accessibility settings — not
identifiers. Writing the default value **removes** the entry rather than storing
it. The full inventory is `docs/data-flow-inventory.md`.

### If analytics is approved later

- No name, email, member ID, free-text field or query string may enter a
  payload.
- Nothing loads before consent is given, and **Reject Optional must be as
  prominent and as easy as Accept** — same size, same contrast, same number of
  clicks.
- A just-in-time notice belongs beside the field, at the moment of entry, not
  only in the privacy notice.
- `scripts/verify-budgets.mjs` currently **fails** on any analytics endpoint. That
  gate has to be changed deliberately, which is the point.

---

## 5. Dependency policy

- `package-lock.json` is committed. A release must install with `npm ci`, which
  installs exactly the locked tree and fails rather than resolving something new.
- Run `npm audit --omit=dev --audit-level=high` before a release. A release must
  not ship with an unresolved **high** or **critical** finding in a runtime
  dependency unless there is a written, time-limited exception naming an owner
  and an expiry date — the same rule `BUDGET_EXCEPTIONS` applies to budgets.
  **Measured 2026-09-03: `found 0 vulnerabilities`.** That is a reading at a
  point in time, not a property of the tree; it has to be re-run per release.
- The runtime dependency surface is deliberately tiny: `astro`, `sharp` (build
  time only — it never reaches the browser) and `zod`.
- **There is no CI workflow, by standing repository rule.** Every gate above
  runs locally through `npm run check`. That is a substitution of _where_ the
  gate runs, not a reduction in _what_ is gated — see §6 of
  `docs/performance-report.md`.

---

## 6. What this lane cannot verify

Stated plainly, because a handoff that implies more coverage than it has is
worse than one that admits the gap.

1. **No header above has been observed in a response.** They are recommendations
   until a host is chosen (B-8) and a real deploy is inspected.
2. **HSTS staging has not been exercised.** It cannot be, without a domain.
3. **`npm audit` has not been made a release blocker mechanically.** It is a
   documented step, and a documented step is one somebody can skip. It is
   deliberately out of `npm run check`: it queries the network, and a gate that
   fails when the network is down teaches people to bypass gates.

4. **The `noopener` guarantee is currently unexercised.** No external
   destination is configured (owner item B-4), so the production build contains
   no cross-origin link. The component contract is asserted in source; the first
   configured destination is the first time it is asserted in a browser.
5. **No penetration test, no dependency-provenance check, no SRI.** SRI is moot
   while nothing is loaded cross-origin, and becomes required the moment
   anything is.
