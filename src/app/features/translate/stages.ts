import { Job } from '../../core/models';

/** The four steps shown while a document is being translated, in order. */
export const STEPS = ['Reading document', 'Translating', 'Checking translation', 'Building Word file'] as const;

/** The stage names the translation service reports, mapped to the step they belong to. */
const STAGE_TO_STEP: Record<string, number> = {
  Extracting: 0,
  Translating: 1,
  Verifying: 2,
  Writing: 3,
  Done: STEPS.length,
};

/** Index of the step in progress (0 to 3); a job that has not started yet counts as the first step. */
export function currentStep(job: Pick<Job, 'stage' | 'status'>): number {
  if (job.status === 'Done') return STEPS.length;
  const step = STAGE_TO_STEP[job.stage ?? ''];
  return step === undefined ? 0 : Math.min(step, STEPS.length - 1);
}

/** The large heading above the progress bar. */
export function stageTitle(job: Pick<Job, 'stage' | 'status'>): string {
  if (job.status === 'Queued') return 'Waiting to start';
  return STEPS[currentStep(job)];
}

/** "12 items need review", "1 item needs review", or null when nothing needs checking. */
export function reviewLabel(job: Pick<Job, 'criticalCount' | 'moderateCount' | 'reviewRequired'>): string | null {
  const count = job.criticalCount + job.moderateCount;
  if (count > 0) return count === 1 ? '1 item needs review' : `${count} items need review`;
  return job.reviewRequired ? 'This document needs review' : null;
}

/** "Report.docx" becomes "Report_RU.docx"; the translated file is always a Word document. */
export function translatedName(originalName: string): string {
  const dot = originalName.lastIndexOf('.');
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${stem}_RU.docx`;
}
