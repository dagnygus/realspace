import { Directive, DoCheck, Inject, Input, OnDestroy, OnInit, Optional, Signal, TemplateRef, ViewContainerRef, ViewRef } from "@angular/core";
import { SIGNAL, Watch, createWatch, setActiveConsumer } from '@angular/core/primitives/signals';
import { NzScheduler, Priority, assertNoopZoneEnviroment, coalesceCurrentWork, detectChanges, detectChangesSync, scheduleWork } from "../../core";
import { NZ_WATCH_CONFIG, NzWatchConfiguration } from "../injection-tokens/injection-tokens";
import { NextObserver, Subject } from "rxjs";

@Directive({ selector: '[watch]', standalone: true })
export class WatchDirective implements DoCheck, OnInit, OnDestroy {

  private _viewRef: ViewRef | null = null;
  private _watch: Watch | null = null;
  private _priority: Priority;
  private _detach: boolean;
  private _abort$ = new Subject<void>();
  private _scheduled = false;
  private _asapCreation: boolean;

  @Input('watch') priority?: Signal<Priority> | Priority | '';

  @Input('watchRenderCallback') renderCb: NextObserver<void> | null = null;

  constructor(
    private _templateRef: TemplateRef<unknown>,
    private _viewConteinerRef: ViewContainerRef,
    @Optional() @Inject(NZ_WATCH_CONFIG) config: NzWatchConfiguration | null
  ) {
    assertNoopZoneEnviroment();

    this._priority = config?.defaultPriority ?? Priority.normal;
    this._detach = config?.detach ?? false;
    this._asapCreation = config?.asapCreation ?? false;
  }

  ngDoCheck(): void {
    if (this._viewRef && this._detach) {
      this._viewRef.detach();
    }
  }

  ngOnInit(): void {
    if (NzScheduler.enabled) {
      const prevConsumer = setActiveConsumer(null);
      try {
        this._watch = createWatch(() => this._runEffect(), () => this._schedule(), false);
        this._watch.notify();
      } finally {
        setActiveConsumer(prevConsumer);
      }
    } else {
      this._viewRef = this._viewConteinerRef.createEmbeddedView(this._templateRef);
    }
  }
  ngOnDestroy(): void {
    this._abort$.next();
    this._abort$.complete();
    if (this._watch) {
      this._watch.destroy();
    }
  }

  private _runEffect(): void {
    if (this._viewRef === null) {
      this._viewRef = this._viewConteinerRef.createEmbeddedView(this._templateRef);
    }
    detectChangesSync(this._viewRef);
    this._scheduled = false;
  }

  private _schedule(): void {
    if (this._scheduled) { return; }

    let priority: Priority;

    if (typeof this.priority === 'number') {
      priority = this.priority;
    } else {
      const prevConsumer = setActiveConsumer(null);
      priority = this.priority ? this.priority() : this._priority;
      setActiveConsumer(prevConsumer);
    }

    if (this._viewRef === null &&  this._asapCreation) {

      queueMicrotask(() => {
        this._watch!.run();
        if (this.renderCb) {
          this.renderCb.next()
        }
      });

    } else {

      scheduleWork(priority, this._abort$, () => this._watch!.run());
      if (!this._viewRef && this.renderCb) {
        const cb = this.renderCb;
        scheduleWork(priority, this._abort$, () => cb.next());
      }

    }

    this._scheduled = true;
  }
}
