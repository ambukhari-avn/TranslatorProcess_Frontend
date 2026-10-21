import { HttpErrorResponse } from '@angular/common/http';

import { MAX_UPLOAD_BYTES, checkFile, describeApiError, formatSize } from './documents.service';

describe('checkFile', () => {
  it('accepts Word and PDF files, whatever the letter case', () => {
    expect(checkFile({ name: 'Report.docx', size: 1000 })).toBeNull();
    expect(checkFile({ name: 'SCAN.PDF', size: 1000 })).toBeNull();
  });

  it('refuses other types, including the old .doc format', () => {
    expect(checkFile({ name: 'notes.txt', size: 10 })).toBe('type');
    expect(checkFile({ name: 'old.doc', size: 10 })).toBe('type');
    expect(checkFile({ name: 'docx', size: 10 })).toBe('type');
  });

  it('refuses empty and oversized files', () => {
    expect(checkFile({ name: 'a.pdf', size: 0 })).toBe('empty');
    expect(checkFile({ name: 'a.pdf', size: MAX_UPLOAD_BYTES + 1 })).toBe('size');
    expect(checkFile({ name: 'a.pdf', size: MAX_UPLOAD_BYTES })).toBeNull();
  });
});

describe('formatSize', () => {
  it('uses the unit a person would expect', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(2048)).toBe('2 KB');
    expect(formatSize(1.8 * 1024 * 1024)).toBe('1.8 MB');
  });
});

describe('describeApiError', () => {
  it('prefers the backend message', () => {
    const error = new HttpErrorResponse({ status: 400, error: { code: 'INVALID_FILE', message: 'The file is not a valid PDF.' } });
    expect(describeApiError(error)).toBe('The file is not a valid PDF.');
  });

  it('explains an unreachable server', () => {
    expect(describeApiError(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach');
  });

  it('never leaks raw errors', () => {
    expect(describeApiError(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});
