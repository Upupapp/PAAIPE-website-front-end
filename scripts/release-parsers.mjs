/**
 * Output parsers for the release gate.
 *
 * They live in their own module so they can be UNIT TESTED. They are the part
 * of the gate most likely to fail silently: a parser that returns a cheerful
 * string for empty output turns "nothing ran" into "everything passed", and
 * nothing downstream can tell the difference.
 *
 * EVERY PARSER IS FLOORED. Each returns `null` - which the gate treats as a
 * STAGE FAILURE - when it cannot find a real, non-zero, all-passing result.
 * There is no branch that returns a pass for output it did not understand.
 */

/** `Tests  491 passed (491)`. Zero tests is a failure, not a pass. */
export function parseVitest(output) {
  const match = output.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
  if (!match) return null;
  const [, passed, total] = match;
  if (Number(total) === 0) return null;
  if (passed !== total) return null;
  return `${passed}/${total} unit tests passed`;
}

/** `861 passed (2.1m)`, possibly with `27 skipped` and `3 failed`. */
export function parsePlaywright(output) {
  const passed = output.match(/(\d+)\s+passed/);
  const failed = output.match(/(\d+)\s+failed/);
  if (!passed) return null;
  if (Number(passed[1]) === 0) return null;
  if (failed && Number(failed[1]) > 0) return null;
  const skipped = output.match(/(\d+)\s+skipped/);
  return `${passed[1]} browser assertions passed${skipped ? `, ${skipped[1]} skipped` : ''}`;
}

/** The median table: `  /route  98  100  100  100`. */
export function parseLighthouse(output, floor = 90) {
  const rows = [...output.matchAll(/^\s{2}(\/\S*)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/gm)];
  if (rows.length === 0) return null;
  const worst = Math.min(...rows.flatMap((row) => row.slice(2).map(Number)));
  if (worst < floor) return null;
  return `${rows.length} routes, lowest median category score ${worst}`;
}

/** `found 0 vulnerabilities`. Anything else, including silence, is a failure. */
export function parseAudit(output) {
  return /found 0 vulnerabilities/.test(output) ? 'no high or critical finding' : null;
}

/**
 * `npm run check` chains N commands and the LAST of them prints the budget
 * table. Keying on that table is what proves the chain reached the end - a
 * chain that stopped early prints plenty of output, all of it reassuring.
 */
export function parseCheck(output, stageCount) {
  if (!/route-js\s+worst/.test(output)) return null;
  return `all ${stageCount} gates passed`;
}
