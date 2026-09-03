# Tab 07 evidence — Concept UI

Captured 2026-09-03, desktop 1440×900 (Chromium) and mobile 390×844 (WebKit),
full page, under `reducedMotion: 'reduce'`.

| File                               | Build                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `*-events.png`                     | Production — every listing section shows its honest empty state, because nothing is approved                        |
| `*-speakers.png`                   | Production                                                                                                          |
| `*-events-members-ai-exchange.png` | **Review** build — the only way to see the members-only detail template, since production publishes no detail pages |

The members-only capture is the important one. It shows the full public
surface of a private session: title, teaser, format, "To be announced" date,
public agenda, and the locked panel. There is no meeting URL, meeting ID,
passcode, registration field or member record — and `npm run verify:leak`
scans this exact bundle to prove it.
