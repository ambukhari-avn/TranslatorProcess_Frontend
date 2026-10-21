import { STEPS, currentStep, reviewLabel, stageTitle, translatedName } from './stages';

describe('progress steps', () => {
  it('maps the service stages onto the four steps', () => {
    expect(currentStep({ stage: 'Extracting', status: 'Running' })).toBe(0);
    expect(currentStep({ stage: 'Translating', status: 'Running' })).toBe(1);
    expect(currentStep({ stage: 'Verifying', status: 'Running' })).toBe(2);
    expect(currentStep({ stage: 'Writing', status: 'Running' })).toBe(3);
  });

  it('treats a job that has not started, or an unknown stage, as the first step', () => {
    expect(currentStep({ stage: '', status: 'Queued' })).toBe(0);
    expect(currentStep({ stage: null, status: 'Queued' })).toBe(0);
    expect(currentStep({ stage: 'Something new', status: 'Running' })).toBe(0);
  });

  it('marks every step done once the job is done', () => {
    expect(currentStep({ stage: 'Done', status: 'Done' })).toBe(STEPS.length);
  });

  it('titles the screen with the current step, and says so while waiting', () => {
    expect(stageTitle({ stage: 'Verifying', status: 'Running' })).toBe('Checking translation');
    expect(stageTitle({ stage: '', status: 'Queued' })).toBe('Waiting to start');
  });
});

describe('reviewLabel', () => {
  it('counts critical and moderate items together, in the right plural', () => {
    expect(reviewLabel({ criticalCount: 4, moderateCount: 8, reviewRequired: true })).toBe('12 items need review');
    expect(reviewLabel({ criticalCount: 0, moderateCount: 1, reviewRequired: true })).toBe('1 item needs review');
  });

  it('still flags a document that needs review without a count, and says nothing otherwise', () => {
    expect(reviewLabel({ criticalCount: 0, moderateCount: 0, reviewRequired: true })).toBe('This document needs review');
    expect(reviewLabel({ criticalCount: 0, moderateCount: 0, reviewRequired: false })).toBeNull();
  });
});

describe('translatedName', () => {
  it('names the result like the backend does: the original name, _RU, always .docx', () => {
    expect(translatedName('Q3_Maintenance_Procedure_Rev2.docx')).toBe('Q3_Maintenance_Procedure_Rev2_RU.docx');
    expect(translatedName('Datasheet.pdf')).toBe('Datasheet_RU.docx');
    expect(translatedName('no-extension')).toBe('no-extension_RU.docx');
  });
});
