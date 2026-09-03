/**
 * Implementation status of the Frontend Master Command's sixteen tabs.
 *
 * This is the source of truth. `src/tests/readme.test.ts` asserts the status
 * table in README.md agrees with it - the README table silently fell three tabs
 * out of date because each update was a literal string patch that stopped
 * matching once Prettier padded the table columns.
 */
export interface TabStatus {
  id: string;
  scope: string;
  complete: boolean;
}

export const TABS: readonly TabStatus[] = [
  { id: '01', scope: 'Audit, scope and bootstrap', complete: true },
  { id: '02', scope: 'Brand system and exact assets', complete: true },
  { id: '03', scope: 'Content architecture and static data', complete: true },
  { id: '04', scope: 'Global shell, navigation and footer', complete: true },
  { id: '05', scope: 'Home page', complete: true },
  { id: '06', scope: 'About and programs', complete: true },
  { id: '07', scope: 'Events and speakers', complete: true },
  { id: '08', scope: 'Resources and insights', complete: true },
  { id: '09', scope: 'Membership and benefits', complete: true },
  { id: '10', scope: 'Partners, responsible AI, contact and legal', complete: false },
  { id: '11', scope: 'Motion, animation and visual effects', complete: false },
  { id: '12', scope: 'Web haptics and microinteractions', complete: false },
  { id: '13', scope: 'Responsive design and accessibility', complete: false },
  { id: '14', scope: 'SEO, social sharing, performance, security, privacy', complete: false },
  { id: '15', scope: 'Testing, QA and content integrity', complete: false },
  { id: '16', scope: 'Frontend handoff and release gate', complete: false },
];

export const COMPLETED_TABS = TABS.filter((tab) => tab.complete).map((tab) => tab.id);
