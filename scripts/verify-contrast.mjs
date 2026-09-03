#!/usr/bin/env node
/**
 * WCAG contrast gate (Frontend Master Command, Tab 02:
 * "Verify every final foreground/background combination for WCAG AA contrast").
 *
 * Reads the same CONTRAST_CONTRACT the components are built against, so this is
 * a measurement of what actually ships, not a separate spreadsheet that can
 * drift. It also re-checks FORBIDDEN_PAIRS: if a combination the project banned
 * has quietly become legal, that is reported too, so a prohibition cannot
 * outlive the measurement that justified it.
 *
 * Prints a full table and exits non-zero on any failure.
 */
import { CONTRAST_CONTRACT, FORBIDDEN_PAIRS, ALL_COLORS } from '../src/config/tokens.ts';
import { contrastRatio, round2, REQUIRED_RATIO } from '../src/lib/color.ts';

const failures = [];
const pad = (s, n) => String(s).padEnd(n);

console.log('Required combinations\n');
console.log(
  `${pad('usage', 34)}${pad('foreground', 22)}${pad('background', 24)}${pad('need', 6)}${pad('ratio', 8)}result`,
);
console.log('-'.repeat(100));

for (const pair of CONTRAST_CONTRACT) {
  const fg = ALL_COLORS[pair.foreground];
  const bg = ALL_COLORS[pair.background];
  const ratio = round2(contrastRatio(fg, bg));
  const need = REQUIRED_RATIO[pair.requirement];
  const ok = ratio >= need;
  if (!ok) {
    failures.push(
      `${pair.usage}: ${pair.foreground} (${fg}) on ${pair.background} (${bg}) is ${ratio}:1, needs ${need}:1`,
    );
  }
  console.log(
    `${pad(pair.usage, 34)}${pad(`${pair.foreground}`, 22)}${pad(`${pair.background}`, 24)}${pad(`${need}:1`, 6)}${pad(`${ratio.toFixed(2)}:1`, 8)}${ok ? 'PASS' : 'FAIL'}`,
  );
}

console.log('\n\nCombinations deliberately forbidden, with the measurement that justifies it\n');
console.log(`${pad('usage', 44)}${pad('ratio', 9)}${pad('need', 6)}status`);
console.log('-'.repeat(100));

for (const pair of FORBIDDEN_PAIRS) {
  const ratio = round2(contrastRatio(ALL_COLORS[pair.foreground], ALL_COLORS[pair.background]));
  const need = REQUIRED_RATIO[pair.requirement];
  const stillFails = ratio < need;
  if (!stillFails) {
    failures.push(
      `FORBIDDEN pair "${pair.usage}" now measures ${ratio}:1 against a ${need}:1 requirement. ` +
        `The prohibition may be obsolete - re-examine it rather than leaving it in place.`,
    );
  }
  console.log(
    `${pad(pair.usage, 44)}${pad(`${ratio.toFixed(2)}:1`, 9)}${pad(`${need}:1`, 6)}${stillFails ? 'correctly banned' : 'REVIEW - no longer fails'}`,
  );
}

if (failures.length > 0) {
  console.error(`\nFAIL  ${failures.length} contrast problem(s):`);
  for (const failure of failures) console.error(`    - ${failure}`);
  process.exit(1);
}

console.log(
  `\nPASS  ${CONTRAST_CONTRACT.length} required combinations meet WCAG AA; ` +
    `${FORBIDDEN_PAIRS.length} banned combinations still measured as failing.`,
);
