import { ChangeDetectorRef, Directive, DoCheck, EmbeddedViewRef, Host, Inject, Injector, Input, IterableChangeRecord, NgIterable, OnDestroy, OnInit, Optional, PLATFORM_ID, Signal, TemplateRef, TrackByFunction, ViewContainerRef, WritableSignal, computed, inject, isSignal } from "@angular/core";
import { BehaviorSubject, NextObserver, Observable, ReplaySubject, Subject, Subscribable, Subscription, distinctUntilChanged, map, merge, of, switchAll } from "rxjs";
import { IterableChangeObserver, IterableChangeTracker, IterableChangeTrackers, NzScheduler, Priority, assertNoopZoneEnviroment, detectChangesSync, fromPromiseLike, fromSignal, fromSubscribable, isPromiseLike, isSubscribable, scheduleWork } from "../../core";
import { NZ_FOR_CONFIG, NzForConfiguration } from "../injection-tokens/injection-tokens";

type NzForOfInput<T, U extends NgIterable<T> = NgIterable<T>> = U & NgIterable<T> | null | undefined;

interface _NzForView<T, U extends NgIterable<T> = NgIterable<T>> {
  nonobservable: boolean;
  readonly optimized: boolean;
  init(
    trackByFn: TrackByFunction<T> | null,
    renderCb: NextObserver<NzForOfInput<T, U>> | null,
    interruptCb: NextObserver<void> | null,
  ): void;
  dispose(): void;
}

class _ClientNzForView<T, U extends NgIterable<T> = NgIterable<T>> implements _NzForView<T, U>, IterableChangeObserver<T> {

  private _viewContainerRef = inject(ViewContainerRef);
  private _templateRef: TemplateRef<DefaultNzForContext<T, U>> = inject(TemplateRef);
  private _iterableChangeTrackers = inject(IterableChangeTrackers);
  private _abort$ = new Subject<void>();
  private _changeTracker: IterableChangeTracker<T> | null = null;
  private _isInit = false;
  private _subscription = new Subscription();
  private _nzForOf: NzForOfInput<T, U> = null;
  private _unoptimized = true;
  private _chachedUnoptimized = true;
  private _count = 0;
  private _renderingComplete = true;
  private _priority = Priority.normal;
  private _trackByFn?: TrackByFunction<T> | null = null
  private _renderCb?: NextObserver<NzForOfInput<T, U>> | null = null;
  private _interruptCb: NextObserver<void> | null = null;
  private _shouldRiseRenderCb = false;
  private _cachedRiseRenderCb = false;

  get optimized(): boolean { return !this._unoptimized; }

  public nonobservable = false;

  constructor(
    private _nzForOf$: Observable<NzForOfInput<T, U>>,
    private _priority$: Observable<Priority>,
    private _optimized$: Observable<boolean>,
  ) {}


  init(
    trackByFn: TrackByFunction<T> | null,
    renderCb: NextObserver<NzForOfInput<T, U>> | null,
    interruptCb: NextObserver<void> | null,
  ): void {
    if (this._isInit) { return; }

    this._trackByFn = trackByFn;
    this._renderCb = renderCb;
    this._interruptCb = interruptCb;

    this._subscription.add(
      this._optimized$.subscribe((optimized) => this._unoptimized = !optimized)
    );

    this._subscription.add(
      this._priority$.subscribe((priority) => {
        this._priority = priority;
      })
    );

    this._subscription.add(
      this._nzForOf$.subscribe((nzForOf) => {
        if (this.nonobservable && !this._unoptimized) { return; }

        if (!this._changeTracker && nzForOf) {
          this._changeTracker = this._iterableChangeTrackers.find(nzForOf).create(this._trackByFn);
        }

        if (this._changeTracker) {

          this._nzForOf = nzForOf;

          if (!this._renderingComplete) {
            if (this._interruptCb) {
              this._interruptCb.next();
            }
            const currentState: T[] = [];
            this._abort$.next();
            for (let i = 0; i < this._viewContainerRef.length; i++) {
              currentState[i] = (this._viewContainerRef.get(i) as EmbeddedViewRef<DefaultNzForContext<T, U>>).context.$implicit
            }
            this._changeTracker.findChanges(currentState);
          }

          if (this._changeTracker.findChanges(nzForOf)) {
            this._renderingComplete = false;
            this._chachedUnoptimized = this._unoptimized;
            this._count = this._changeTracker.length || 0;
            this._changeTracker.applyChanges(this);
          } else if (!this._renderingComplete) {
            this.onDone();
          }

        }
      })
    );

    this._isInit = true;
  }

  dispose(): void {
    this._subscription.unsubscribe();
    this._abort$.next();
    this._abort$.complete();
  }

  onAdd(record: IterableChangeRecord<T>, index: number | undefined): void {
    scheduleWork(this._priority, this._abort$, () => {
      const context = new DefaultNzForContext<T, U>(
        record.item, this._nzForOf!, record.currentIndex!, this._count
      );
      const viewRef = this._viewContainerRef.createEmbeddedView(
        this._templateRef, context, index
      );
      context.cdRef = viewRef;
      detectChangesSync(viewRef);
    });
    this._shouldRiseRenderCb = true;
  }

  onRemove(_: IterableChangeRecord<T>, adjustedIndex: number): void {
    scheduleWork(this._priority, this._abort$, () => {
      const viewRef = this._viewContainerRef.get(adjustedIndex)!;
      this._viewContainerRef.remove(adjustedIndex);
      viewRef.detectChanges();
    });
    this._shouldRiseRenderCb = true;
  }

  onMove(record: IterableChangeRecord<T>, adjustedPreviousIndex: number, currentIndex: number, changed: boolean): void {
    scheduleWork(this._priority, this._abort$, () => {
      const viewRef = this._viewContainerRef.get(adjustedPreviousIndex) as EmbeddedViewRef<DefaultNzForContext<T, U>>;
      this._viewContainerRef.move(viewRef, currentIndex);
      const context = viewRef.context;
      context.nzForOf = this._nzForOf || [] as any;
      if (changed) {
        context.$implicit = record.item;
      }
      if (context.count !== this._count) {
        context.count = this._count;
      }
      context.index = record.currentIndex!;
      if (this._chachedUnoptimized) {
        detectChangesSync(viewRef);
      }
    });
    this._shouldRiseRenderCb = true;
  }

  onUpdate(record: IterableChangeRecord<T>, index: number): void {
    scheduleWork(this._priority, this._abort$, () => {
      const viewRef = this._viewContainerRef.get(index) as EmbeddedViewRef<DefaultNzForContext<T, U>>;
      const context = viewRef.context;
      context.nzForOf = this._nzForOf || [] as any;
      context.$implicit = record.item;
      if (context.count !== this._count) {
        context.count = this._count;
      }
      if (context.index !== record.currentIndex!) {
        context.index = record.currentIndex!;
      }
      if (this._chachedUnoptimized) {
        detectChangesSync(viewRef);
      }
    });
  }

  onIterate(record: IterableChangeRecord<T>, index: number): void {
    scheduleWork(this._priority, this._abort$, () => {
      const viewRef = this._viewContainerRef.get(index) as EmbeddedViewRef<DefaultNzForContext<T, U>>;
      const context = viewRef.context;
      context.nzForOf = this._nzForOf || [] as any;
      if (context.count !== this._count) {
        context.count = this._count;
      }
      if (context.index !== record.currentIndex!) {
        context.index = record.currentIndex!
      }
      if (this._chachedUnoptimized) {
        detectChangesSync(viewRef);
      }
    });
  }

  onDone(): void {
    this._cachedRiseRenderCb = this._shouldRiseRenderCb;
    this._shouldRiseRenderCb = false;
    scheduleWork(this._priority, this._abort$, () => {
      this._renderingComplete = true;
      this._changeTracker!.reset();
      if ((this._chachedUnoptimized || this._cachedRiseRenderCb) && this._renderCb) {
        this._renderCb.next(this._nzForOf);
      }
    });
  }

}

class _ServerNzForView<T, U extends NgIterable<T> = NgIterable<T>> implements _NzForView<T, U>, IterableChangeObserver<T> {

  private _viewContainerRef = inject(ViewContainerRef);
  private _templateRef: TemplateRef<DefaultNzForContext<T, U>> = inject(TemplateRef);
  private _iterableChangeTrackers = inject(IterableChangeTrackers);
  private _cdRef = inject(ChangeDetectorRef);
  private _nzForOf: NzForOfInput<T, U> = null;
  private _changeTracker: IterableChangeTracker<T> | null = null;
  private _trackByFn: TrackByFunction<T> | null = null;
  private _renderCb: NextObserver<NzForOfInput<T, U>> | null = null;
  private _count = 0;
  private _isInit = false;
  private _subscription = new Subscription();
  private _shouldRiseRenderCb = false;

  public optimized = false;
  public nonobservable = false;
  // public readonly optimized = false;

  constructor(private _nzForOf$: Observable<NzForOfInput<T, U>>, private _optimized$: Observable<boolean>) {}

  init(
    trackByFn: TrackByFunction<T> | null,
    renderCb: NextObserver<NzForOfInput<T, U>> | null,
    interruptCb: NextObserver<void> | null,
  ): void {
    if (this._isInit) { return; }
    this._trackByFn = trackByFn;

    this._subscription.add(this._optimized$.subscribe((optimized) => this.optimized = optimized));

    this._subscription.add(
      this._nzForOf$.subscribe((nzForOf) => {
        if (this.nonobservable && this.optimized) { return; }

        if (!this._changeTracker && nzForOf) {
          this._changeTracker = this._iterableChangeTrackers.find(nzForOf).create(this._trackByFn);
        }

        if (this._changeTracker) {
          this._nzForOf = nzForOf;
          if (this._changeTracker.findChanges(nzForOf)) {
            this._count = this._changeTracker.length || 0;
            this._changeTracker.applyChanges(this);
          }
        }
      })
    );

    this._isInit = true;
  }

  dispose(): void {
    this._subscription.unsubscribe();
  }

  onAdd(record: IterableChangeRecord<T>, index: number | undefined): void {
    const context = new DefaultNzForContext<T, U>(
      record.item, this._nzForOf!, record.currentIndex!, this._count
    );
    const viewRef = this._viewContainerRef.createEmbeddedView(
      this._templateRef, context, index
    );
    context.cdRef = viewRef;
    this._shouldRiseRenderCb = true;
  }

  onRemove(_: IterableChangeRecord<T>, adjustedIndex: number | undefined): void {
    this._viewContainerRef.remove(adjustedIndex);
    this._shouldRiseRenderCb = true;
  }

  onMove(record: IterableChangeRecord<T>, adjustedPreviousIndex: number, currentIndex: number, changed: boolean): void {
    const viewRef = this._viewContainerRef.get(adjustedPreviousIndex) as EmbeddedViewRef<DefaultNzForContext<T, U>>;
    this._viewContainerRef.move(viewRef, currentIndex);
    this._updateContext(viewRef.context, record.currentIndex!, changed ? record.item  : null);
    this._shouldRiseRenderCb = true;
  }

  onUpdate(record: IterableChangeRecord<T>, index: number): void {
    const viewRef = this._viewContainerRef.get(index) as EmbeddedViewRef<DefaultNzForContext<T, U>>;
    this._updateContext(viewRef.context, record.currentIndex!, record.item);
  }

  onIterate(record: IterableChangeRecord<T>, index: number): void {
    const viewRef = this._viewContainerRef.get(index) as EmbeddedViewRef<DefaultNzForContext<T, U>>;
    this._updateContext(viewRef.context, record.currentIndex!, null);
  }

  onDone(): void {
    this._cdRef.markForCheck();
    this._changeTracker!.reset();
    if ((!this.optimized || this._shouldRiseRenderCb) && this._renderCb) {
      this._renderCb.next(this._nzForOf);
    }
    this._shouldRiseRenderCb = false;
  }

  private _updateContext(context: NzForContext<T>, index: number, item: T | null): void {
    context.nzForOf = this._nzForOf!;
    if (item) {
      context.$implicit = item;
    }
    if (context.count !== this._count) {
      context.count = this._count;
    }
    if (context.index !== index) {
      context.index = index;
    }
  }

}


@Directive({
  selector: '[nzFor][nzForOf]',
  standalone: true
})
export class NzForDirective<T, U extends NgIterable<T> = NgIterable<T>> implements DoCheck, OnInit, OnDestroy {

  private _nzForOf$$ = new ReplaySubject<Observable<NzForOfInput<T, U>>>(1);
  private _priority$$ = new ReplaySubject<Observable<Priority>>(1);
  private _nonobservable$: Observable<NzForOfInput<T, U>> | null = null;
  private _optimized$$ = new ReplaySubject<Observable<boolean>>(1);
  private _trackByFn: TrackByFunction<T> | null = null;
  private _nzForView: _NzForView<T, U>;

  @Input()
  set nzForOf(nzForOf: Signal<NzForOfInput<T,U>> | Observable<NzForOfInput<T,U>> | Subscribable<NzForOfInput<T,U>> | Promise<NzForOfInput<T,U>> | PromiseLike<NzForOfInput<T,U>> | NzForOfInput<T,U>) {
    if (isSignal(nzForOf)) {
      this._nonobservable$ = null;
      this._nzForView.nonobservable = false;
      this._nzForOf$$.next(fromSignal(nzForOf, this._injector));
    } else if (isSubscribable(nzForOf)) {
      this._nonobservable$ = null;
      this._nzForView.nonobservable = false;
      this._nzForOf$$.next(fromSubscribable(nzForOf));
    } else {
      if (isPromiseLike(nzForOf)) {
        this._nonobservable$ = fromPromiseLike(nzForOf);
      } else {
        this._nonobservable$ = of(nzForOf);
      }
      this._nzForView.nonobservable = true
      this._nzForOf$$.next(this._nonobservable$);
    }
  }

  @Input()
  set nzForOfOptimized(optimized: Signal<boolean> | Observable<boolean> | Subscribable<boolean> | boolean) {
    if (isSignal(optimized)) {
      this._optimized$$.next(fromSignal(optimized, this._injector))
    } else if (isSubscribable(optimized)) {
      this._optimized$$.next(fromSubscribable(optimized));
    } else {
      this._optimized$$.next(of(optimized));
    }
  }

  @Input()
  set nzForTrackBy(trackByFn: TrackByFunction<T> | keyof T) {
    if (typeof trackByFn === 'function') {
      this._trackByFn = trackByFn;
    } else {
      this._trackByFn = function(_, item) { return item[trackByFn] };
    }
  }

  @Input()
  set nzForPriority(priority: Signal<Priority> | Observable<Priority> | Subscribable<Priority> | Priority) {
    if (isSignal(priority)) {
      this._priority$$.next(fromSignal(priority, this._injector));
    } else if (isSubscribable(priority)) {
      this._priority$$.next(fromSubscribable(priority));
    } else {
      this._priority$$.next(of(priority));
    }
  }

  @Input() nzForRenderCallback: NextObserver<NzForOfInput<T, U>> | null = null;
  @Input() nzForInterruptCallback: NextObserver<void> | null = null

  constructor(@Optional() @Inject(NZ_FOR_CONFIG) config: NzForConfiguration | null,
              private _injector: Injector) {
    assertNoopZoneEnviroment();

    const nzForOf$ = this._nzForOf$$.pipe(switchAll());
    const optimized$ = this._optimized$$.pipe(switchAll());
    const priority$ = this._priority$$.pipe(switchAll());

    if (NzScheduler.enabled) {
      this._nzForView = new _ClientNzForView(nzForOf$, priority$, optimized$)
    } else {
      this._nzForView = new _ServerNzForView(nzForOf$, optimized$)
    }

    const optimized = config?.optimized ?? false;
    const defaultPriority = config?.defaultPriority ?? Priority.normal
    this._priority$$.next(of(defaultPriority));
    this._optimized$$.next(of(optimized));
  }

  ngDoCheck(): void {
    if (this._nonobservable$ && !this._nzForView.optimized) {
      this._nzForOf$$.next(this._nonobservable$);
    }
  }


  ngOnInit(): void {
    this._nzForView.init(this._trackByFn, this.nzForRenderCallback, this.nzForInterruptCallback);
  }

  ngOnDestroy(): void {
    this._nzForView.dispose();
  }

  static ngTemplateGuard_nzFor: 'binding';

  static ngTemplateContextGuard<T, U extends NgIterable<T>>(nzForDir: NzForDirective<T, U>, ctx: any): ctx is NzForContext<T, U> {
    return true;
  }
}

export interface NzForContext<T, U extends NgIterable<T> = NgIterable<T>> {
  $implicit: T;
  nzForOf: U;
  index: number;
  count: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly even: boolean;
  readonly odd: boolean;

  readonly item$: Observable<T>;
  readonly nzForOf$: Observable<U>;
  readonly index$: Observable<number>;
  readonly count$: Observable<number>;
  readonly first$: Observable<boolean>;
  readonly last$: Observable<boolean>;
  readonly even$: Observable<boolean>;
  readonly odd$: Observable<boolean>;

  cdRef: ChangeDetectorRef;
}

class DefaultNzForContext<T, U extends NgIterable<T> = NgIterable<T>> implements NzForContext<T, U> {

  private _item$: BehaviorSubject<T>;
  private _nzForOf$: BehaviorSubject<U>;
  private _index$: BehaviorSubject<number>;
  private _count$: BehaviorSubject<number>;

  get $implicit(): T {
    return this._item$.getValue();
  }
  set $implicit(value: T) {
    this._item$.next(value);
  }

  get nzForOf(): U {
    return this._nzForOf$.getValue();
  }
  set nzForOf(value: U) {
    this._nzForOf$.next(value);
  }

  get index(): number {
    return this._index$.getValue();
  }
  set index(value: number) {
    this._index$.next(value);
  }

  get count(): number {
    return this._count$.getValue();
  }
  set count(value: number) {
    this._count$.next(value);
  }

  get first(): boolean {
    return this._index$.getValue() === 0;
  }

  get last(): boolean {
    return this._index$.getValue() === this._count$.getValue() - 1;
  }

  get even(): boolean {
    return this._index$.getValue() % 2 === 0;
  }

  get odd(): boolean {
    return this._index$.getValue() % 2 !== 0;
  }

  readonly item$: Observable<T>;
  readonly nzForOf$: Observable<U>;
  readonly index$: Observable<number>;
  readonly count$: Observable<number>;
  readonly first$: Observable<boolean>;
  readonly last$: Observable<boolean>;
  readonly even$: Observable<boolean>;
  readonly odd$: Observable<boolean>;

  cdRef!: ChangeDetectorRef;

  constructor(item: T, nzForOf: U, index: number, count: number) {
    this._item$ = new BehaviorSubject(item);
    this.item$ = this._item$.asObservable();
    this._nzForOf$ = new BehaviorSubject(nzForOf);
    this.nzForOf$ = this._nzForOf$.asObservable();
    this._count$ = new BehaviorSubject(count);
    this.count$ = this._count$.asObservable();
    this._index$ = new BehaviorSubject(index);
    this.index$ = this._index$.asObservable();
    this.even$ = this._index$.pipe(map((value) => value % 2 === 0));
    this.odd$ = this._index$.pipe(map((value) => value % 2 !== 0));
    this.first$ = this._index$.pipe(map((value) => value === 0));
    this.last$ = merge(
      this._index$,
      this._count$
    ).pipe(
      map(() => this._index$.getValue() === this._count$.getValue() - 1),
      distinctUntilChanged()
    )
  }
}
