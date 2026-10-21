export type JobStatus = 'Queued' | 'Running' | 'Done' | 'Failed' | 'Cancelled';

/** What the backend reports about one translation (GET /api/documents/{id}). */
export interface Job {
  id: string;
  originalName: string;
  inputType: string;
  sizeBytes: number;
  language: string;
  verify: boolean;
  status: JobStatus;
  progress: number;
  stage: string | null;
  criticalCount: number;
  moderateCount: number;
  reviewRequired: boolean;
  documentScore: number | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  canDownload: boolean;
  canDownloadReview: boolean;
  filesExpired: boolean;
}

/** Error body of the translation endpoints. */
export interface ApiError {
  code?: string;
  message?: string;
}

export interface Session {
  token: string;
  email: string;
  fullName: string;
  role: 'Employee' | 'SuperUser';
}

/** Reply of GET /api/auth/microsoft/callback when sign-in succeeds. */
export interface SignInResponse {
  token: string;
  username: string;
  fullName: string;
  email: string;
  role: 'Employee' | 'SuperUser';
}

export function isFinished(job: Job): boolean {
  return job.status === 'Done' || job.status === 'Failed' || job.status === 'Cancelled';
}

/** One page of a list, as every list endpoint of the backend returns it. */
export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** A translation in the Developer history: the job plus who ran it. */
export interface HistoryItem extends Job {
  userId: string;
  userName: string | null;
  userEmail: string | null;
}

export interface Employee {
  id: string;
  userName: string;
  email: string | null;
  fullName: string;
  role: 'Employee' | 'SuperUser';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: number;
  action: string;
  userId: string | null;
  userName: string | null;
  entityType: string | null;
  entityId: string | null;
  timestamp: string;
}
