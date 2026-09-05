/**
 * Detail-page progressive enhancement: the supplementary local time.
 *
 * IT ADDS; IT NEVER REPLACES. The canonical PHT schedule is server rendered and
 * this file never touches it. The local-time line is written into an element
 * that ships EMPTY and `hidden`, so a reader with no JavaScript, a blocked
 * bundle, or a browser missing the API sees the page the server sent, which is
 * complete on its own.
 *
 * Copy-link is NOT here. `CopyLink.astro` and `scripts/copy-link.ts` already do
 * it, globally, and a second implementation would be a second thing to fix.
 *
 * WHY THE TIMEZONE WORK IS GUARDED SO HEAVILY. The command requires invalid
 * browser timezone data to be handled safely. `Intl.DateTimeFormat` will happily
 * report a resolved zone that then throws when formatting, and a machine with a
 * corrupt or absent tz database is not hypothetical - it is the usual state of a
 * locked-down corporate build. Every step is therefore inside one try/catch that
 * leaves the slot empty on any failure, because an empty supplementary line is
 * correct and a wrong local time is worse than none.
 */
function localTimeLabel(anchor: HTMLTimeElement): string | null {
  const iso = anchor.getAttribute('datetime');
  if (!iso) return null;

  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!zone) return null;

  // Manila is UTC+8 with no DST, so a viewer already there gains nothing from a
  // second line saying the same time twice.
  const offsetMinutes = -instant.getTimezoneOffset();
  if (offsetMinutes === 8 * 60) return null;

  const formatted = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(instant);

  return `Your local time: ${formatted}`;
}

function enhanceLocalTime(): void {
  const slot = document.querySelector<HTMLElement>('[data-local-time]');
  const anchor = document.querySelector<HTMLTimeElement>('[data-local-time-anchor]');
  if (!slot || !anchor) return;

  try {
    const label = localTimeLabel(anchor);
    if (!label) return;
    slot.textContent = label;
    slot.hidden = false;
  } catch {
    // Leave the slot empty and hidden. The canonical PHT line is untouched.
  }
}

enhanceLocalTime();
document.addEventListener('astro:page-load', enhanceLocalTime);

export {};
