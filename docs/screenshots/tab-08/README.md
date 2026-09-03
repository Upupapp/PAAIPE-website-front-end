# Tab 08 evidence — Concept UI

Captured 2026-09-03, desktop 1440×900 (Chromium) and mobile 390×844 (WebKit),
full page, under `reducedMotion: 'reduce'`.

| File                                             | Build                                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `desktop-*/mobile-*-resources.png`               | **Production** — the library is empty because nothing is approved, and the "In preparation" cards carry a Coming soon badge with no link |
| `review-*-resources.png`                         | **Review** — the same page with the ten sample fixtures listed, plus the search and topic filter                                         |
| `review-*-resources-ai-adoption-starter-kit.png` | **Review** — the members-only detail template                                                                                            |

The members-only capture is the one to check. Its entire public surface is
cover, title, synopsis, topics and format, followed by the locked panel. There
is no body text, no file URL, no signed URL, no replay link and no filename
that reveals protected content — and `npm run verify:leak` scans this exact
bundle to prove it.
