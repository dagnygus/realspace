import { ChangeDetectorRef, Directive, DoCheck, EmbeddedViewRef, Host, Inject, Injector, Input, OnDestroy, OnInit, Optional, PLATFORM_ID, Signal, TemplateRef, ViewContainerRef, isSignal } from "@angular/core";
import { NextObserver, Observable, ReplaySubject, Subject, Subscribable, Subscription, filter, of, switchAll } from "rxjs";
import { Priority, detectChanges, detectChangesSync, scheduleWork, fromPromiseLike, fromSubscribable, isSubscribable, assertNoopZoneEnviroment, NzScheduler, fromSignal } from "../../core";
import { NZ_LET_CONFIG, NzLetConfiguration } from "../injection-tokens/injection-tokens";

@Directive({ selector: '[nzLet]', standalone: true })
export class NzLetDirective<T> implements DoCheck, OnInit, OnDestroy {

  private _abort$ = new Subject<void>();
  private _subscription = new Subscription();
  private _priority$$ = new ReplaySubject<Observable<Priority>>(1);
  private _priority: Priority;
  private _nzLet$$ = new ReplaySubject<Observable<T>>
  private _viewRef: EmbeddedViewRef<NzLetContext<T>> | null = null;
  private _detach$$ = new ReplaySubject<Observable<boolean>>(1);
  private _detach = false;
  private _optimized$$ = new ReplaySubject<Observable<boolean>>();
  private _optimized = false;
  private _nonobservable$: Observable<T> | null = null;
  private _syncCreation?: boolean;

  @Input() set nzLet(nzLet: Signal<T> | Observable<T> | Subscribable<T> | Promise<T> | PromiseLike<T>) {
    if (isSignal(nzLet)) {
      this._nonobservable$ = null;
      this._nzLet$$.next(fromSignal(nzLet, this._injector));
    } else if (isSubscribable(nzLet)) {
      this._nonobservable$ = null;
      this._nzLet$$.next(fromSubscribable(nzLet));
    } else {
      this._nonobservable$ = fromPromiseLike(nzLet);
      this._nzLet$$.next(this._nonobservable$);
    }
  }

  @Input() set nzLetPriority(priority: Signal<Priority> | Observable<Priority> | Subscribable<Priority> | Priority) {
    if (isSignal(priority)) {
      this._priority$$.next(fromSignal(priority, this._injector))
    } else if (isSubscribable(priority)) {
      this._priority$$.next(fromSubscribable(priority));
    } else {
      this._priority$$.next(of(priority));
    }
  }

  @Input() set nzLetDetach(detach: Signal<boolean> | Observable<boolean> | Subscribable<boolean> | boolean) {
    if (isSignal(detach)) {
      this._detach$$.next(fromSignal(detach, this._injector))
    } else if (isSubscribable(detach)) {
      this._detach$$.next(fromSubscribable(detach));
    } else {
      this._detach$$.next(of(detach));
    }
  }

  @Input() set nzLetOptimized(optimized: Signal<boolean> | Observable<boolean> | Subscribable<boolean> | boolean) {
    if (isSignal(optimized)) {
      this._optimized$$.next(fromSignal(optimized, this._injector))
    } else if (isSubscribable(optimized)) {
      this._optimized$$.next(fromSubscribable(optimized));
    } else {
      this._optimized$$.next(of(optimized));
    }
  }

  @Input() nzLetRenderCallback: NextObserver<T> | null = null;

  constructor(private _viewContainerRef: ViewContainerRef,
              private _templateRef: TemplateRef<NzLetContext<T>>,
              private _changeDetectorRef: ChangeDetectorRef,
              @Optional() @Inject(NZ_LET_CONFIG) config: NzLetConfiguration | null,
              private _injector: Injector) {

    assertNoopZoneEnviroment();
    const defaultPriority = config?.defaultPriority ?? Priority.normal;
    const detach = config?.detach ?? false;
    const optimized = config?.optimized ?? false;

    this._syncCreation = config?.syncCreation;

    this._optimized = optimized && NzScheduler.enabled;
    this._optimized$$.next(of(this._optimized))

    this._priority = defaultPriority;
    this._priority$$.next(of(this._priority));

    this._detach = detach;
    this._detach$$.next(of(detach));

  }

  ngDoCheck(): void {
    if (this._nonobservable$ && !this._optimized) {
      this._nzLet$$.next(this._nonobservable$);
    }
  }

  ngOnInit(): void {

    if (NzScheduler.enabled) {
      this._subscription.add(this._optimized$$.pipe(
        switchAll()
      ).subscribe((optimized) => this._optimized = optimized));

      this._subscription.add(this._priority$$.pipe(
        switchAll(),
      ).subscribe((priority) => {
        this._priority = priority;
      }));

      this._subscription.add(this._detach$$.pipe(
        switchAll()
      ).subscribe((detach) => {
        if (this._viewRef) {
          if (detach) {
            this._viewRef.detach();
          } else {
            this._viewRef.reattach();
          }
          this._detach = detach;
        }
      }));

      let isSync = true
      this._subscription.add(this._nzLet$$.pipe(
        switchAll()
      ).subscribe((nzLet) => {

        if (this._nonobservable$ && this._optimized) {
          return;
        }

        this._abort$.next();
        if (this._viewRef) {
          this._updateView(this._viewRef, nzLet);
        } else {

          if (this._syncCreation && isSync) {
            this._createViewSync(nzLet);
          } else {
            this._createView(nzLet);
          }

        }
      }));
      isSync = false
    } else {
      this._subscription.add(this._nzLet$$.pipe(
        switchAll()
      ).subscribe((nzLet) => {

        if (this._nonobservable$ && this._optimized) {
          return;
        }

        if (this._viewRef) {
          this._updateViewSync(this._viewRef, nzLet);
        } else {
          this._createViewSync(nzLet);
        }
      }));
    }

  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._abort$.next();
    this._abort$.complete();
  }

  private _updateView(view: EmbeddedViewRef<NzLetContext<T>>, nzLet: T): void {
    view.context.$implicit = nzLet;
    detectChanges(view, { priority: this._priority, abort$: this._abort$ });
    this._riseRenderCallback(nzLet);
  }

  private _createView(nzLet: T): void {
    scheduleWork(this._priority, this._abort$, () => {
      const viewRef = this._viewRef = this._viewContainerRef.createEmbeddedView(
        this._templateRef, new NzLetContext(nzLet),
      ) as EmbeddedViewRef<NzLetContext<T>>;

      if (this._detach) {
        viewRef.detach();
      }
      detectChangesSync(viewRef);
    });
    this._riseRenderCallback(nzLet);
  }

  private _updateViewSync(view: EmbeddedViewRef<NzLetContext<T>>, nzLet: T ) {
    view.context.$implicit = nzLet;
    this._changeDetectorRef.markForCheck();
    this._riseRenderCallback(nzLet);
  }

  private _createViewSync(nzLet: T): void {
    this._viewRef = this._viewContainerRef.createEmbeddedView(
      this._templateRef, new NzLetContext(nzLet)
    ) as EmbeddedViewRef<NzLetContext<T>>;
    this._riseRenderCallback(nzLet);
    this._changeDetectorRef.markForCheck();
  }

  private _riseRenderCallback(nzLet: T): void {
    if (this.nzLetRenderCallback) {
      const renderCb = this.nzLetRenderCallback;
      scheduleWork(this._priority, this._abort$, () => {
        renderCb.next(nzLet);
      });
    }
  }

  static ngTemplateGuard_nzLet: 'binding';
  static ngTemplateContextGuard<T>(dir: NzLetDirective<T>, ctx: any): ctx is NzLetContext<T> {
    return true;
  }
}

export class NzLetContext<U> {
  constructor(public $implicit: U) {}
}
