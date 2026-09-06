# Accessibility QA — what was tested, how, and what is not covered

Tab 10 Step 3. **Automated results are a floor, not a conformance claim.**

## Tooling and versions

| Tool                                  | Version                         | What it can decide                                         |
| ------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| axe-core (via `@axe-core/playwright`) | bundled with Playwright 1.62.1  | machine-detectable violations only                         |
| Playwright                            | 1.62.1                          | geometry, focus, keyboard, computed style, media emulation |
| Chromium / WebKit                     | as shipped by Playwright 1.62.1 | the engines, not the browsers                              |

**Engines are not browsers, and neither is a handset.** Nothing here was run on
a real phone or with a real screen reader.

## Automated coverage, per event page

Every publishable detail page and the marketplace, in two engines:

- no serious or critical axe violation
- one `<h1>`, no skipped heading level
- landmarks present and uniquely named
- breadcrumb trail visible, exactly one
- no content clipped at 320px, and no horizontal page scroll at 320 / 390 / 768
  / 1024 / 1440, nor at the 200%-zoom equivalent
- primary touch targets at least 44×44 CSS pixels
- the access badges differ by more than colour, and both carry text
- **reduced motion**: no travel, feedback preserved, hero visible immediately
- **forced colors**: borders and text survive when the palette is replaced
- no infinite animation, and no animated capacity or urgency wording
- with JavaScript disabled: facts, schedule and service state all present; the
  copy control stays disabled; FAQ answers still open

**Each emulated mode asserts it is actually active before measuring.** A
reduced-motion block that is not in reduced motion tests the default path twice
— that happened here, and two of three tests passed while it did.

## Not covered, and it matters

| Gap                                         | Why it is open                                                                                                                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manual screen-reader pass**               | VoiceOver and NVDA journeys have not been run. Tracked as **F-24** since Tab 13 of the original portal. This is the largest gap between what is verified and what WCAG 2.2 AA requires. |
| Real-device testing                         | none                                                                                                                                                                                    |
| Registration form a11y                      | the form does not exist (Tab 05)                                                                                                                                                        |
| Announcement behaviour on live state change | there is no live state change without a gateway                                                                                                                                         |
| Cognitive-accessibility review              | needs a human reviewer                                                                                                                                                                  |

axe cannot judge whether a heading describes its section, whether an
announcement is comprehensible, or whether an error message tells someone how to
fix the problem. Those need a person, and no person has done it.

## Reviewer and date

**Reviewer: none. Date: none.** Stated in exactly those terms because the
command asks for a manual checklist "completed with named reviewer/date", and
inventing one would be the worst possible thing to write in an accessibility
document.
