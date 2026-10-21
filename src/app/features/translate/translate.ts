import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Subscription, catchError, interval, of, startWith, switchMap } from 'rxjs';

import { DocumentsService, FileProblem, checkFile, describeApiError, formatSize } from '../../core/documents.service';
import { Job, isFinished } from '../../core/models';
import { Icon } from '../../shared/icon';
import { STEPS, currentStep, reviewLabel, stageTitle, translatedName } from './stages';

type View = 'empty' | 'selected' | 'working' | 'done' | 'failed';

const ACTIVE_JOB_KEY = 'dt.activeJob';
const POLL_MS = 2000;
/** Poll failures in a row (network, server restart) before the page gives up waiting. */
const MAX_POLL_FAILURES = 15;

/**
 * The whole translation flow on one page: choose a file, start, watch the progress, then download.
 * A running job survives a page refresh (its id is kept for the tab).
 */
@Component({
  selector: 'app-translate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './translate.html',
  styleUrl: './translate.scss',
})
export class Translate implements OnInit, OnDestroy {
  private readonly documents = inject(DocumentsService);
  private polling?: Subscription;
  private pollFailures = 0;

  protected readonly steps = STEPS;
  protected readonly view = signal<View>('empty');
  protected readonly file = signal<File | null>(null);
  protected readonly job = signal<Job | null>(null);
  protected readonly dragging = signal(false);
  protected readonly fileProblem = signal<FileProblem>(null);
  protected readonly starting = signal(false);
  protected readonly failure = signal('');
  protected readonly downloading = signal<'download' | 'review' | null>(null);
  protected readonly downloadError = signal('');

  protected readonly fileName = computed(() => this.file()?.name ?? this.job()?.originalName ?? '');
  protected readonly fileSize = computed(() => formatSize(this.file()?.size ?? this.job()?.sizeBytes ?? 0));
  protected readonly fileKind = computed(() => (this.fileName().toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCX'));
  protected readonly step = computed(() => (this.job() ? currentStep(this.job()!) : 0));
  protected readonly title = computed(() => (this.job() ? stageTitle(this.job()!) : 'Starting'));
  protected readonly percent = computed(() => Math.max(0, Math.min(100, this.job()?.progress ?? 0)));
  protected readonly review = computed(() => (this.job() ? reviewLabel(this.job()!) : null));
  protected readonly resultName = computed(() => translatedName(this.fileName()));
  /** "Try again" needs the original file, which is gone after a page refresh. */
  protected readonly canRetry = computed(() => this.file() !== null);

  ngOnInit(): void {
    const id = this.storedJobId();
    if (id) this.resume(id);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ---------------------------------------------------------------- choosing a file
  protected onBrowse(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    input.value = '';                                    // lets the same file be picked again
    if (picked) this.choose(picked);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) this.choose(dropped);
  }

  private choose(picked: File): void {
    const problem = checkFile(picked);
    this.fileProblem.set(problem);
    if (problem) {
      this.file.set(null);
      this.view.set('empty');
      return;
    }
    this.file.set(picked);
    this.view.set('selected');
  }

  protected clearFile(): void {
    this.file.set(null);
    this.fileProblem.set(null);
    this.view.set('empty');
  }

  // ---------------------------------------------------------------- translating
  protected translate(): void {
    const file = this.file();
    if (!file || this.starting()) return;

    this.starting.set(true);
    this.failure.set('');
    this.documents.start(file).subscribe({
      next: (job) => {
        this.starting.set(false);
        this.remember(job.id);
        this.job.set(job);
        this.view.set('working');
        this.poll(job.id);
      },
      error: (error: unknown) => {
        this.starting.set(false);
        this.failure.set(describeApiError(error));
        this.view.set('failed');
      },
    });
  }

  private resume(id: string): void {
    this.documents.get(id).subscribe({
      next: (job) => {
        this.job.set(job);
        if (isFinished(job)) this.show(job);
        else {
          this.view.set('working');
          this.poll(id);
        }
      },
      error: () => this.forget(),
    });
  }

  private poll(id: string): void {
    this.stopPolling();
    this.pollFailures = 0;
    this.polling = interval(POLL_MS)
      .pipe(
        startWith(0),
        // A failed check is not the end of the stream: it becomes null and is counted below.
        switchMap(() => this.documents.get(id).pipe(catchError(() => of(null)))),
      )
      .subscribe((job) => {
        if (job === null) return this.pollFailed();
        this.pollFailures = 0;
        this.job.set(job);
        if (isFinished(job)) {
          this.stopPolling();
          this.show(job);
        }
      });
  }

  /** One failed check is normal (a network blip); keep trying, then give up with a clear message. */
  private pollFailed(): void {
    this.pollFailures += 1;
    if (this.pollFailures < MAX_POLL_FAILURES) return;
    this.stopPolling();
    this.failure.set('We lost contact with the translation service. Your document may still be processing; check again in a moment.');
    this.view.set('failed');
  }

  private stopPolling(): void {
    this.polling?.unsubscribe();
    this.polling = undefined;
  }

  /** A finished job: the result page for a good one (kept across a refresh until "Translate another"), the error page otherwise. */
  private show(job: Job): void {
    if (job.status === 'Done') {
      this.view.set('done');
      return;
    }
    this.failure.set(job.status === 'Cancelled' ? 'The translation was cancelled.' : (job.error ?? 'The translation could not be completed.'));
    this.view.set('failed');
    this.forget();
  }

  protected cancel(): void {
    const job = this.job();
    if (!job) return;
    this.stopPolling();
    this.documents.cancel(job.id).subscribe({
      next: () => this.afterCancel(),
      error: () => this.afterCancel(),
    });
  }

  private afterCancel(): void {
    this.forget();
    this.job.set(null);
    this.view.set(this.file() ? 'selected' : 'empty');
  }

  // ---------------------------------------------------------------- results
  protected download(kind: 'download' | 'review'): void {
    const job = this.job();
    if (!job || this.downloading()) return;
    this.downloading.set(kind);
    this.downloadError.set('');
    const name = kind === 'download' ? this.resultName() : this.resultName().replace(/_RU\.docx$/, '_review.docx');
    this.documents.download(job.id, kind, name).subscribe({
      next: () => this.downloading.set(null),
      error: () => {
        this.downloading.set(null);
        this.downloadError.set('The file could not be downloaded. It may have expired; translate the document again.');
      },
    });
  }

  protected retry(): void {
    this.job.set(null);
    this.failure.set('');
    this.view.set('selected');
    this.translate();
  }

  protected startOver(): void {
    this.stopPolling();
    this.forget();
    this.job.set(null);
    this.file.set(null);
    this.failure.set('');
    this.fileProblem.set(null);
    this.downloadError.set('');
    this.view.set('empty');
  }

  // ---------------------------------------------------------------- remembering a running job
  private storedJobId(): string | null {
    try {
      return sessionStorage.getItem(ACTIVE_JOB_KEY);
    } catch {
      return null;
    }
  }

  private remember(id: string): void {
    try {
      sessionStorage.setItem(ACTIVE_JOB_KEY, id);
    } catch {
      /* the job still runs; it just will not survive a refresh */
    }
  }

  private forget(): void {
    try {
      sessionStorage.removeItem(ACTIVE_JOB_KEY);
    } catch {
      /* nothing stored */
    }
  }
}
