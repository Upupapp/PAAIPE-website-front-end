/**
 * The generated report's headline sentence.
 *
 * WHY IT LIVES HERE AND NOT INLINE IN THE GATE
 * --------------------------------------------
 * `scripts/release-gate.mjs` runs a full suite on import - a detached worktree,
 * `npm ci`, Playwright, Lighthouse - so nothing in it can be unit tested. The
 * headline was built inline there, which meant the one sentence a reader
 * actually stops at was the only part of the report no test could reach.
 *
 * It has been wrong twice, in the same shape both times:
 *
 *   1. It asserted "every quality gate passed" from the OWNER-INPUT count
 *      alone, so a run with a FAILED stage printed an all-clear over a table
 *      showing the failure.
 *   2. The fix for (1) consulted `problems` and `unmet`. The same commit added
 *      a THIRD stage outcome - UNVERIFIED, a stage that could not run - and the
 *      headline never learned about it, so a run with an unverified stage
 *      printed the all-clear again.
 *
 * The class, stated once: ANY SUMMARY SENTENCE COMPUTED FROM A DIFFERENT INPUT
 * THAN THE TABLE IT SUMMARISES WILL DRIFT, and it drifts silently because
 * nothing compares the two. So this function takes every count the stage table
 * can produce, and `src/tests/release-report.test.ts` asserts each one alone is
 * enough to withhold the claim.
 */

/**
 * @param {{ problems: string[], unverifiedStages: string[], unmet: unknown[] }} counts
 * @returns {string} the headline paragraph, or '' when there is nothing to say.
 */
export function headline({ problems, unverifiedStages, unmet }) {
  /*
   * Order is severity. A FAILURE outranks a stage that could not run, which
   * outranks a clean-but-blocked run. The strongest claim - "every gate passed"
   * - is made last, and only when nothing else is outstanding.
   */
  if (problems.length > 0) {
    return `**${problems.length} stage${problems.length === 1 ? '' : 's'} FAILED.** This is a defect, not a
missing input, and it is listed under CERTIFIED below with what went wrong.
Do not read the owner-input list as the only thing standing in the way.`;
  }

  if (unverifiedStages.length > 0) {
    const n = unverifiedStages.length;
    return `**${n} stage${n === 1 ? '' : 's'} could not run.** No claim is made about ${n === 1 ? 'it' : 'them'} in either
direction: not a pass, not a failure, unmeasured. Until ${n === 1 ? 'it runs' : 'they run'}, "every gate
passed" is a sentence this report is not entitled to print${
      unmet.length > 0
        ? `, and ${unmet.length} owner
input${unmet.length === 1 ? ' is' : 's are'} outstanding besides`
        : ''
    }.`;
  }

  if (unmet.length > 0) {
    return `**This build is not releasable, and the reason is not a defect.** Every gate
that could fail on quality passed, and every stage actually ran. What blocks the
release is ${unmet.length} owner input${unmet.length === 1 ? '' : 's'} that no amount of front-end work can supply.`;
  }

  return '';
}
