import { ChangeDetectorRef, Directive, DoCheck, EmbeddedViewRef, EventEmitter, Host, Inject, Injector, Input, OnDestroy, OnInit, Optional, Output, PLATFORM_ID, Signal, TemplateRef, ViewContainerRef, ViewRef, isSignal } from "@angular/core";
import { BehaviorSubject, NextObserver, Observable, ReplaySubject, Subject, Subscribable, Subscription, distinctUntilChanged, of, switchAll, tap } from "rxjs";
import { NZ_IF_CONFIG, NzIfConfiguration } from "../injection-tokens/injection-tokens";
import { Priority, assertNoopZoneEnviroment, detectChanges, detectChangesSync, scheduleWork, fromPromiseLike, fromSubscribable, isPromiseLike, isSubscribable, NzScheduler, fromSignal } from "../../core";

@Directive({
  selector: '[nzIf]', standalone: true
})
export class NzIfDirective<T> implements OnInit, DoCheck, OnDestroy {

  private _subscription = new Subscription();
  private _abort$ = new Subject<void>();
  private _thenTemplateRef: TemplateRef<NzIfContext<T>>;
  private _elseTemplateRef: TemplateRef<NzIfContext<T>> | null = null;
  private _thenTemplateRef$$ = new ReplaySubject<Observable<TemplateRef<NzIfContext<T>>>>(1);
  private _elseTemplateRef$$ = new ReplaySubject<Observable<TemplateRef<NzIfContext<T>>>>(1);
  private _thenViewRef: EmbeddedViewRef<NzIfContext<T>> | null = null;
  private _elseViewRef: EmbeddedViewRef<NzIfContext<T>> | null = null;
  private _nzIf$ = new ReplaySubject<Observable<T>>(1);
  private _context: NzIfContext<T> | null = null;
  private _nonobservable$: Observable<T> | null = null;
  private _priority: Priority;
  private _priority$$ = new ReplaySubject<Observable<Priority>>(1);
  private _optimized$$ = new ReplaySubject<Observable<boolean>>(1);
  private _optimized = false;
  private _valueRecived = false;
  private _dirty = false;

  @Input() set nzIf(value: Signal<T> | Observable<T> | Subscribable<T> | PromiseLike<T> | Promise<T> | T) {
    this._dirty = true;
    if (isSignal(value)) {
      this._nonobservable$ = null;
      this._valueRecived = true;
      this._nzIf$.next(fromSignal(value, this._injector));
    } else if (isSubscribable(value)) {
      this._nonobservable$ = null;
      this._valueRecived = false
      this._nzIf$.next(fromSubscribable(value));
    } else {
      if (isPromiseLike<T>(value)) {
        this._valueRecived = false;
        this._nonobservable$ = fromPromiseLike(value);
      } else {
        this._valueRecived = true;
        this._nonobservable$ = of(value);
      }
      this._nzIf$.next(this._nonobservable$);
    }
  }

  @Input() set nzIfThen(thenTemplateRef: Signal<TemplateRef<NzIfContext<T>>> | Observable<TemplateRef<NzIfContext<T>>> | Subscribable<TemplateRef<NzIfContext<T>>> | TemplateRef<NzIfContext<T>>) {
    this._dirty = true;
    if (isSignal(thenTemplateRef)) {
      this._thenTemplateRef$$.next(fromSignal(thenTemplateRef, this._injector))
    } else if (isSubscribable(thenTemplateRef)) {
      this._thenTemplateRef$$.next(fromSubscribable(thenTemplateRef));
    } else {
      this._thenTemplateRef$$.next(of(thenTemplateRef));
    }
  }

  @Input() set nzIfElse(elseTemplateRef: Signal<TemplateRef<NzIfContext<T>>> | Observable<TemplateRef<NzIfContext<T>>> | Subscribable<TemplateRef<NzIfContext<T>>> | TemplateRef<NzIfContext<T>>) {
    this._dirty = true;
    if (isSignal(elseTemplateRef)) {
      this._elseTemplateRef$$.next(fromSignal(elseTemplateRef, this._injector))
    } else if (isSubscribable(elseTemplateRef)) {
      this._elseTemplateRef$$.next(fromSubscribable(elseTemplateRef));
    } else {
      this._elseTemplateRef$$.next(of(elseTemplateRef));
    }
  }

  @Input() set nzIfPriority(priority: Signal<Priority> | Observable<Priority> | Subscribable<Priority> | Priority) {
    if (isSignal(priority)) {
      this._priority$$.next(fromSignal(priority, this._injector))
    } else if (isSubscribable(priority)) {
      this._priority$$.next(fromSubscribable(priority));
    } else {
      this._priority$$.next(of(priority));
    }
  }

  @Input() set nzIfOptimized(optimized: Signal<boolean> | Observable<boolean> | Subscribable<boolean> | boolean) {
    this._dirty = true;
    if (isSignal(optimized)) {
      this._optimized$$.next(fromSignal(optimized, this._injector))
    } else if (isSubscribable(optimized)) {
      this._optimized$$.next(fromSubscribable(optimized));
    } else {
      this._optimized$$.next(of(optimized));
    }
  }

  @Input() nzIfRenderCallback: NextObserver<T> | null = null;

  @Output() render = new EventEmitter<T>(false);

  constructor(templateRef: TemplateRef<NzIfContext<T>>,
              private _viewContainerRef: ViewContainerRef,
              @Optional() @Inject(NZ_IF_CONFIG) config: NzIfConfiguration | null,
              private _injector: Injector) {

    assertNoopZoneEnviroment();
    this._thenTemplateRef = templateRef;

    const priority = config?.defaultPriority ?? Priority.normal;
    const optimized = config?.optimized ?? false;

    this._priority = priority;
    this._priority$$.next(of(priority));

    this._optimized = optimized;
    this._optimized$$.next(of(optimized));
  }

  ngDoCheck(): void {

    if (this._nonobservable$ && !this._optimized) {
      this._nzIf$.next(this._nonobservable$);
      return;
    }
    if (this._context && this._thenViewRef && !(this._nonobservable$ || this._valueRecived)) {
      this._update(this._context);
      return;
    }
  }

  ngOnInit(): void {

    this._subscription.add(this._optimized$$.pipe(
      switchAll()
    ).subscribe((optimized) => this._optimized = optimized));

    this._subscription.add(this._priority$$.pipe(
      switchAll()
    ).subscribe((priority) => this._priority = priority));

    this._subscription.add(this._thenTemplateRef$$.pipe(
      switchAll(),
      distinctUntilChanged()
    ).subscribe((tempalteRef) => {
      this._thenTemplateRef = tempalteRef
      if (this._context && this._context.$implicit && this._thenViewRef) {
        this._clearThenView(this._context);
        this._update(this._context);
      }
    }));

    this._subscription.add(this._elseTemplateRef$$.pipe(
      switchAll(),
      distinctUntilChanged()
    ).subscribe((templateRef) => {
      this._elseTemplateRef = templateRef;
      if (this._context && !this._context.$implicit && this._elseViewRef) {
        this._clearElseView(this._context);
        this._update(this._context);
      }
    }));

    const innerNzIf$ = new Subject<Observable<T>>();

    if (NzScheduler.enabled) {

      this._subscription.add(innerNzIf$.pipe(
        switchAll()
      ).subscribe((value) => {
        if (this._nonobservable$ && this._optimized) { return; }

        this._valueRecived = true;

        if (!this._context) {
          this._context = new DefaultNzIfContext(value);
        } else if (this._context.$implicit !== value) {
          this._context.$implicit = value;
        }

        this._update(this._context);
      }));

      this._subscription.add(this._nzIf$.pipe(
        tap((nzIf$) => innerNzIf$.next(nzIf$))
      ).subscribe(() => {
        if (this._context && this._thenViewRef && !this._valueRecived) {
          this._update(this._context);
        }
      }));

    } else {
      this._subscription.add(innerNzIf$.pipe(
        switchAll()
      ).subscribe((value) => {
        if (this._nonobservable$ && this._optimized) { return; }

        this._valueRecived = true;

        if (!this._context) {
          this._context = new DefaultNzIfContext(value);
        } else if (this._context.$implicit !== value) {
          this._context.$implicit = value;
        }

        this._syncUpdate(this._context);
      }));

      this._subscription.add(this._nzIf$.pipe(
        tap((nzIf$) => innerNzIf$.next(nzIf$))
      ).subscribe(() => {
        if (this._context && this._thenViewRef && !this._valueRecived) {
          this._syncUpdate(this._context);
        }
      }));
    }
  }



  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._abort$.next();
    this._abort$.complete();
  }

  private _update(context: NzIfContext<T>): void {
    this._abort$.next();
    if (context.$implicit && this._valueRecived) {
      if (!this._thenViewRef) {
        scheduleWork(this._priority, this._abort$, () => {
          this._clearElseView(context)
          const viewRef = this._createThenView(context);
          this._detectChangesSyncOn(viewRef);
        });
        this._riseRenderCallback(context);
      } else {
        if (!(this._dirty || this._optimized)) {
          this._detectChangesOn(this._thenViewRef);
          this._riseRenderCallback(context);
        }
      }

    } else {
      if (!this._elseViewRef) {
        scheduleWork(this._priority, this._abort$, () => {
          this._clearThenView(context);
          const viewRef = this._createElseView(context);
          if (viewRef) {
            this._detectChangesSyncOn(viewRef);
          }
        });
        this._riseRenderCallback(context);
      } else {
        if (!(this._dirty || this._optimized)) {
          this._detectChangesOn(this._elseViewRef);
          this._riseRenderCallback(context);
        }
      }
    }

    this._dirty = false;
  }

  _syncUpdate(context: NzIfContext<T>): void {

    if (context.$implicit && this._valueRecived) {
      if (!this._thenViewRef) {
        if (this._elseViewRef) {
          this._viewContainerRef.clear();
          context.cdRef = null!;
          this._elseViewRef = null;
        }
        this._thenViewRef = this._viewContainerRef.createEmbeddedView(
          this._thenTemplateRef, context
        );
        context.cdRef = this._thenViewRef;
        if (this.nzIfRenderCallback) {
          this.nzIfRenderCallback.next(context.$implicit);
        }
      } else {
        if (!(this._dirty || this._optimized)) {
          if (this.nzIfRenderCallback) {
            this.nzIfRenderCallback.next(context.$implicit);
          }
        }
      }
    } else {
      if (this._thenViewRef) {
        this._viewContainerRef.clear();
        context.cdRef = null!;
        this._thenViewRef = null;

        if (this._elseTemplateRef) {
          this._elseViewRef = this._viewContainerRef.createEmbeddedView(
          this._elseTemplateRef, context
          );
          context.cdRef = this._elseViewRef;
        }
        if (this.nzIfRenderCallback) {
          this.nzIfRenderCallback.next(context.$implicit);
        }
      } else {
        if (!(this._dirty || this._optimized)) {
          if (this.nzIfRenderCallback) {
            this.nzIfRenderCallback.next(context.$implicit);
          }
        }
      }

    }

    this._dirty = false;
  }

  private _createThenView(context: NzIfContext<T>): ViewRef {
    this._thenViewRef = this._viewContainerRef.createEmbeddedView(
      this._thenTemplateRef, context,
    );
    context.cdRef = this._thenViewRef;
    return this._thenViewRef;
  }

  private _createElseView(context: NzIfContext<T>): ViewRef | null {
    if (this._elseTemplateRef) {
      this._elseViewRef = this._viewContainerRef.createEmbeddedView(
        this._elseTemplateRef, context,
      );
      context.cdRef = this._elseViewRef;
      return this._elseViewRef;
    }
    return null;
  }

  private _detectChangesOn(viewRef: ViewRef) {
    detectChanges(viewRef, this._priority);
  }

  private _detectChangesSyncOn(viewRef: ViewRef) {
    if (this._dirty) { return; }
    detectChangesSync(viewRef)
  }


  private _riseRenderCallback(context: NzIfContext<T>): void {
    if (this.nzIfRenderCallback) {
      const renderCb = this.nzIfRenderCallback;
      scheduleWork(this._priority, this._abort$, () => {
          renderCb.next(context.$implicit);
      });
    }
  }

  private _clearElseView(context: NzIfContext<T>): void {
    if (this._elseViewRef) {
      context.cdRef = null!;
      this._viewContainerRef.clear();
      this._elseViewRef.detectChanges();
      this._elseViewRef = null;
    }
  }

  private _clearThenView(context: NzIfContext<T>): void {
    if (this._thenViewRef) {
      context.cdRef = null!;
      this._viewContainerRef.clear();
      this._thenViewRef.detectChanges();
      this._thenViewRef = null;
    }
  }

  static ngTemplateGuard_nzIf: 'binding';

  static ngTemplateContextGuard<T>(dir: NzIfDirective<T>, ctx: any): ctx is NzIfContext<Exclude<T, false|0|''|null|undefined>> {
    return true;
  }
}

export interface NzIfContext<T> {
  cdRef: ChangeDetectorRef;
  nzIf$: Observable<T>;
  $implicit: T
  nzIf: T
}

export class DefaultNzIfContext<T = unknown> implements NzIfContext<T> {

  private _nzIf$: BehaviorSubject<T>

  nzIf$: Observable<T>;
  cdRef!: ChangeDetectorRef

  get $implicit(): T {
    return this._nzIf$.getValue();
  }

  set $implicit(value: T) {
    this._nzIf$.next(value);
  }

  get nzIf(): T {
    return this._nzIf$.getValue();
  }

  constructor(value: T) {
    this._nzIf$ = new BehaviorSubject(value);
    this.nzIf$ = this._nzIf$.asObservable();
  }
}
