import { ChangeDetectorRef, Directive, DoCheck, EffectRef, EmbeddedViewRef, Inject, Input, IterableChangeRecord, NgIterable, OnDestroy, OnInit, Optional, Signal, TemplateRef, TrackByFunction, ValueEqualityFn, ViewContainerRef, ViewRef, WritableSignal, computed, inject, signal } from "@angular/core";
import { IterableChangeObserver, IterableChangeTracker, IterableChangeTrackers, NzScheduler, Priority, assertNoopZoneEnviroment, detectChangesSync, scheduleWork } from "../../core";
import { NextObserver, Subject } from "rxjs";
import { Watch, createWatch, setActiveConsumer } from "@angular/core/primitives/signals";
import { SIG_FOR_CONFIG, SigForConfiguration } from "../injection-tokens/injection-tokens";
import { createInputReadEffect } from "../utils/utils";

type SigForOfInput<T, U extends NgIterable<T> = NgIterable<T>> = U & NgIterable<T> | null | undefined

interface _SigForView<T, U extends NgIterable<T> = NgIterable<T>> {
  dataSource: Signal<SigForOfInput<T, U>> | null;
  trackBy: TrackByFunction<T> | null;
  renderCb: NextObserver<U> | null;
  interruptCb: NextObserver<void> | null;
  equal: ValueEqualityFn<T> | null;
  update(priority: Priority): void;
  dispose(): void;
}

class _ClientSigForView<T, U extends NgIterable<T> = NgIterable<T>> implements _SigForView<T, U>, IterableChangeObserver<T> {
  private _viewContainerRef = inject(ViewContainerRef);
  private _templateRef: TemplateRef<SigForContext<T,U>> = inject(TemplateRef);
  private _changeTrackers = inject(IterableChangeTrackers);
  private _renderingComplete = true;
  private _changeTracker: IterableChangeTracker<T> | null = null;
  private _count = 0;
  private _abort$ = new Subject<void>();
  private _priority = Priority.normal;
  private _shouldRiseRenderCb = false;
  private _cachedRiseRenderCb = false;

  dataSource: Signal<SigForOfInput<T, U>> | null = null;
  trackBy: TrackByFunction<T> | null = null;
  renderCb: NextObserver<U> | null = null;
  interruptCb: NextObserver<void> | null = null;
  equal: ValueEqualityFn<T> | null = null;

  update(priority: Priority): void {
    this._priority = priority;

    if (!this._changeTracker && this.dataSource!()) {
      this._changeTracker = this._changeTrackers.find(this.dataSource!()!).create(this.trackBy);
    }

    if (this._changeTracker) {

      if (!this._renderingComplete) {
        if (this.interruptCb) {
          this.interruptCb.next();
        }
        const currentState: T[] = [];

        const prevConsumer = setActiveConsumer(null);
        for (let i = 0; i < this._viewContainerRef.length; i++) {
          const context = (this._viewContainerRef.get(i) as EmbeddedViewRef<DefaultSigForContext<T>>).context;
          context._currentIndex = context._previusIndex = i;
          context._adjPrevIndex = -1;
          context._indexSource.set(i);
          context._preventCheck = false;
          currentState[i] = context._itemSource();
        }
        setActiveConsumer(prevConsumer);
        this._abort$.next();

        this._changeTracker.findChanges(currentState);
      }

      if (this._changeTracker.findChanges(this.dataSource!())) {
        this._abort$.next();
        this._renderingComplete = false;
        this._count = this._changeTracker.length || 0;
        this._changeTracker.applyChanges(this);
      } else if (!this._renderingComplete) {
        this.onDone();
      }
    }
  }

  onAdd(record: IterableChangeRecord<T>, index: number | undefined): void {
    const prevConsumer = setActiveConsumer(null);
    try {
      let viewRef: EmbeddedViewRef<DefaultSigForContext<T>> | null = null;
      let scheduled = false;

      const sub = this._abort$.subscribe(() => {
        if (!viewRef) {
          watcher!.destroy();
          sub.unsubscribe();
        }
      });

      let watcher: Watch;

      const effectFn = () => {
        if (viewRef) {
          sub.unsubscribe();
          const context = viewRef.context;
          if (context._currentIndex === -1) {
            this._viewContainerRef.remove(context._adjPrevIndex)
            viewRef.detectChanges();
            viewRef = null;
            watcher.destroy();
            scheduled = false;
            return;
          } else if (context._previusIndex !== context._currentIndex) {
            this._viewContainerRef.move(viewRef, context._currentIndex);
            context._previusIndex = context._currentIndex;
          }
        } else {
          const context = new DefaultSigForContext(
            this.dataSource as Signal<U>, record.item, watcher, this.equal, record.currentIndex!, this._count
          );
          viewRef = this._viewContainerRef.createEmbeddedView(
            this._templateRef,
            context,
            index
          ) as EmbeddedViewRef<DefaultSigForContext<T, U>>;
        }
        scheduled = false;

        if (viewRef.context._preventCheck) {
          viewRef.context._preventCheck = false;
          return;
        }
        viewRef.context._needsCheck = false;
        detectChangesSync(viewRef);
      }

      watcher = createWatch(
        effectFn,
        () => {
          if (scheduled) {
            if (viewRef) {
              viewRef.context._preventCheck = false;
            }
            return;
          }
          scheduled = true;
          if (viewRef && this._renderingComplete) {
            viewRef.context._needsCheck = true;
          }
          scheduleWork(this._priority, this._abort$, () => {
            watcher.run();
            if (scheduled) {
              effectFn();
            }
          });
        },
        true
      );

      watcher.notify();
    } finally {
      setActiveConsumer(prevConsumer);
    }
    this._shouldRiseRenderCb = true;
  }

  onRemove(record: IterableChangeRecord<T>, adjustedIndex: number): void {
    const context = (this._viewContainerRef.get(record.previousIndex!) as EmbeddedViewRef<DefaultSigForContext<T>>).context;
    context._currentIndex = -1;
    context._previusIndex = record.previousIndex!;
    context._adjPrevIndex = adjustedIndex;
    context._wathcer!.notify();
    this._shouldRiseRenderCb = true;
  }
  onMove(record: IterableChangeRecord<T>, adjustedPrevIndex: number, currentIndex: number, changed: boolean): void {
    const context = (this._viewContainerRef.get(record.previousIndex!) as EmbeddedViewRef<DefaultSigForContext<T>>).context;
    context._currentIndex = currentIndex;
    context._previusIndex = record.previousIndex!;
    context._adjPrevIndex = adjustedPrevIndex;
    context._preventCheck = !(changed && context._needsCheck);
    context._itemSource.set(record.item)
    context._indexSource.set(currentIndex);
    context._countSource.set(this._count);
    context._wathcer!.notify();

    this._shouldRiseRenderCb = true;
  }
  onUpdate(record: IterableChangeRecord<T>, index: number): void {
    const context = (this._viewContainerRef.get(record.previousIndex!) as EmbeddedViewRef<DefaultSigForContext<T>>).context;
    context._currentIndex = index;
    context._previusIndex = index
    context._preventCheck = false;
    context._itemSource.set(record.item);
    context._indexSource.set(index);
    context._countSource.set(this._count);
    context._wathcer!.notify();
  }
  onIterate(record: IterableChangeRecord<T>, index: number): void {
    const context = (this._viewContainerRef.get(record.previousIndex!) as EmbeddedViewRef<DefaultSigForContext<T>>).context;
    context._currentIndex = index;
    context._previusIndex = index;
    context._preventCheck = false;
    context._itemSource.set(record.item);
    context._indexSource.set(index);
    context._countSource.set(this._count);
    if (context._needsCheck) {
      context._wathcer!.notify()
    }
  }
  onDone(): void {
    this._cachedRiseRenderCb = this._shouldRiseRenderCb;
    this._shouldRiseRenderCb = false;
    scheduleWork(this._priority, this._abort$, () => {
      this._renderingComplete = true;
      this._changeTracker!.reset()
      if (this._cachedRiseRenderCb && this.renderCb) {
        this.renderCb.next(this.dataSource!() as U);
      }
    });
  }

  dispose(): void {
    this._abort$.next();
    this._abort$.complete();

    for (let i = 0; i < this._viewContainerRef.length; i++) {
      (this._viewContainerRef.get(i) as EmbeddedViewRef<DefaultSigForContext<T>>).context._wathcer!.destroy();
    }
  }
}

class _ServerForView<T, U extends NgIterable<T> = NgIterable<T>> implements _SigForView<T, U>, IterableChangeObserver<T> {

  private _viewContainerRef = inject(ViewContainerRef);
  private _templateRef: TemplateRef<SigForContext<T,U>> = inject(TemplateRef);
  private _changeTrackers = inject(IterableChangeTrackers);
  private _changeTracker: IterableChangeTracker<T> | null = null;
  private _count = 0;
  private _shouldRiseRenderCb = false;

  _scheduled = false;

  dataSource: Signal<SigForOfInput<T, U>> | null = null;
  trackBy: TrackByFunction<T> = null!;
  renderCb: NextObserver<SigForOfInput<T, U>> | null = null;
  interruptCb: NextObserver<void> | null = null;
  equal: ValueEqualityFn<T> | null = null;

  update(_: Priority): void {
    if (!this._changeTracker && this.dataSource!()) {
      this._changeTracker = this._changeTrackers.find(this.dataSource!()!).create(this.trackBy);
    }

    if (this._changeTracker) {
      if (this._changeTracker.findChanges(this.dataSource!())) {
        this._count = this._changeTracker.length || 0;
        this._changeTracker.applyChanges(this);
      }
    }
  }
  onAdd(record: IterableChangeRecord<T>, index: number | undefined): void {
    const context = new DefaultSigForContext(
      this.dataSource as Signal<U>, record.item, null, this.equal, record.currentIndex!, this._count
    );
    this._viewContainerRef.createEmbeddedView(
      this._templateRef, context, index
    );
    this._shouldRiseRenderCb = true;
  }
  onRemove(_: IterableChangeRecord<T>, adjustedIndex: number): void {
    this._viewContainerRef.remove(adjustedIndex);
    this._shouldRiseRenderCb = true;
  }
  onMove(record: IterableChangeRecord<T>, adjustedPreviousIndex: number, currentIndex: number, changed: boolean): void {
    const viewRef = this._viewContainerRef.get(adjustedPreviousIndex) as EmbeddedViewRef<DefaultSigForContext<T>>;
    this._viewContainerRef.move(viewRef, currentIndex);
    this._updateContext(viewRef.context, record.currentIndex!, record.item);
    this._shouldRiseRenderCb = true;
  }
  onUpdate(record: IterableChangeRecord<T>, index: number): void {
    const viewRef = this._viewContainerRef.get(index) as EmbeddedViewRef<DefaultSigForContext<T>>;
    this._updateContext(viewRef.context, index, record.item);
  }
  onIterate(record: IterableChangeRecord<T>, index: number): void {
    const viewRef = this._viewContainerRef.get(index) as EmbeddedViewRef<DefaultSigForContext<T>>;
    this._updateContext(viewRef.context, index, record.item);
  }
  onDone(): void {
    this._changeTracker!.reset();
    if (this._shouldRiseRenderCb && this.renderCb) {
      this.renderCb.next(this.dataSource!());
    }
    this._shouldRiseRenderCb = false;
  }

  dispose(): void {
    // noop
  }

  private _updateContext(context: DefaultSigForContext<T>, index: number, item: T): void {
    context._itemSource.set(item);
    context._indexSource.set(index);
    context._countSource.set(this._count);
  }
}

@Directive({ selector: '[sigFor][sigForOf]', standalone: true })
export class SigForDirective<T, U extends NgIterable<T> = NgIterable<T>> implements DoCheck, OnInit, OnDestroy {

  private _priority: Priority;
  private _inputWatcher: EffectRef = null!;
  private _sigForView: _SigForView<T, U>;

  @Input() sigForOf: Signal<SigForOfInput<T, U>> = null!;
  @Input() sigForPriority?: Signal<Priority> | Priority;
  @Input() sigForRenderCallback: NextObserver<SigForOfInput<T, U>> | null = null;
  @Input() sigForInterruptCallback: NextObserver<void> | null = null;
  @Input() sigForEqual: ValueEqualityFn<T> | null = null;
  @Input() sigForTrackBy?: TrackByFunction<T> | keyof T

  constructor(@Optional() @Inject(SIG_FOR_CONFIG) config: SigForConfiguration | null,
              changeDetectorRef: ChangeDetectorRef) {
    assertNoopZoneEnviroment();

    this._priority = config?.defaultPriority ?? Priority.normal;

    if (NzScheduler.enabled) {
      this._sigForView = new _ClientSigForView();
    } else {
      this._sigForView = new _ServerForView();
      const prevConsumer = setActiveConsumer(null);
      try {
        this._inputWatcher = createWatch(
          () => {
            this._sigForView.update(this._getPriority());
            (this._sigForView as _ServerForView<T, U>)._scheduled = false;
          },
          () => {
            if ((this._sigForView as _ServerForView<T, U>)._scheduled) { return; }
            (this._sigForView as _ServerForView<T, U>)._scheduled = true;
            changeDetectorRef.markForCheck();
          },
          true
        );
      } finally {
        setActiveConsumer(prevConsumer);
      }

      (this._inputWatcher as Watch).notify();
    }
  }

  ngDoCheck(): void {
    if (NzScheduler.enabled) { return; }
    if (!this._sigForView.dataSource) {
      this._initialForView();
    }
    if ((this._sigForView as _ServerForView<T, U>)._scheduled) {
      const prevConsumer = setActiveConsumer(null);
      try {
        (this._inputWatcher as Watch).run();
      } finally {
        setActiveConsumer(prevConsumer);
      }
    }
  }

  ngOnInit(): void {
    if (NzScheduler.enabled) {
      this._initialForView();
      const prevConsumer = setActiveConsumer(null);
      try {
        this._inputWatcher = createInputReadEffect(() => {
          this._sigForView.update(this._getPriority());
        }, true);
      } finally {
        setActiveConsumer(prevConsumer);
      }
    }
  }

  ngOnDestroy(): void {
    this._inputWatcher.destroy();
    this._sigForView.dispose();
  }

  private _initialForView(): void {
    this._sigForView.dataSource = this.sigForOf;
    this._sigForView.renderCb = this.sigForRenderCallback;
    this._sigForView.interruptCb = this.sigForInterruptCallback;
    this._sigForView.equal = this.sigForEqual;

    if (typeof this.sigForTrackBy === 'string') {
      const key = this.sigForTrackBy;
      this._sigForView.trackBy = function(_, item) { return item[key]; }
    } else if (typeof this.sigForTrackBy === 'function') {
      this._sigForView.trackBy = this.sigForTrackBy;
    }
  }

  private _getPriority(): Priority {
    if (typeof this.sigForPriority === 'number') {
      return this.sigForPriority;
    }
    const prevConsumer = setActiveConsumer(null);
    try {
      return this.sigForPriority ? this.sigForPriority(): this._priority;
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }

  static ngTemplateGuard_sigFor: 'binding';

  static ngTemplateContextGuard<T, U extends NgIterable<T>>(nzForDir: SigForDirective<T, U>, ctx: any): ctx is SigForContext<T, U> {
    return true;
  }

}

export interface SigForContext<T, U extends NgIterable<T> = NgIterable<T>> {
  readonly $implicit: Signal<T>;
  readonly sigForOf: Signal<U>;
  readonly index: Signal<number>;
  readonly count: Signal<number>;
  readonly first: Signal<boolean>;
  readonly last: Signal<boolean>;
  readonly even: Signal<boolean>;
  readonly odd: Signal<boolean>;
}

class DefaultSigForContext<T, U extends NgIterable<T> = NgIterable<T>> implements SigForContext<T, U> {
  _wathcer: Watch | null;
  _itemSource: WritableSignal<T>;
  _indexSource: WritableSignal<number>;
  _countSource: WritableSignal<number>;
  _currentIndex: number;
  _previusIndex: number;
  _adjPrevIndex = -1;
  _preventCheck = false;
  _needsCheck = false;

  $implicit: Signal<T>;
  sigForOf: Signal<U>;
  index: Signal<number>;
  count: Signal<number>;
  first: Signal<boolean>;
  last: Signal<boolean>;
  even: Signal<boolean>;
  odd: Signal<boolean>;

  constructor(sigForOf: Signal<U>, item: T, wathcer: Watch | null, equal: ValueEqualityFn<T> | null, index: number, count: number) {
    this.sigForOf = sigForOf;
    if (equal) {
      this._itemSource = signal(item, { equal });
    } else {
      this._itemSource = signal(item);
    }
    this._indexSource = signal(index);
    this._countSource = signal(count);
    this._wathcer = wathcer;

    this.$implicit = this._itemSource.asReadonly();
    this.index = this._indexSource.asReadonly();
    this.count = this._countSource.asReadonly();
    this.first = computed(() => this._indexSource() === 0);
    this.last = computed(() => this._indexSource() === this._countSource() - 1);
    this.even = computed(() => this._indexSource() % 2 === 0);
    this.odd = computed(() => this._indexSource() % 2 !== 0);

    this._currentIndex = this._previusIndex = index;
  }
}
