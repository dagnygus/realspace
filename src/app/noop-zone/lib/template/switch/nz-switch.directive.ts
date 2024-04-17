import { ChangeDetectorRef, Directive, DoCheck, EventEmitter, Host, Inject, Injector, Input, OnDestroy, OnInit, Optional, Output, Signal, TemplateRef, ViewContainerRef, ViewRef, isSignal } from "@angular/core";
import { Observable, ReplaySubject, Subject, Subscribable, Subscription, of, switchAll } from "rxjs";
import { NzScheduler, Priority, assertNoopZoneEnviroment, detectChanges, detectChangesSync, fromPromiseLike, fromSignal, fromSubscribable, isPromiseLike, isSubscribable, scheduleWork } from "../../core";
import {  NZ_SWITCH_CONFIG, NzSwitchConfiguration } from "../injection-tokens/injection-tokens";
import { DefaultNzContext } from "../utils/utils";

interface CaseView<T> {
  enforceState(nzSwitch: T): boolean;
}

@Directive({ selector: '[nzSwitch]', standalone: true })
export class NzSwitchDirective<T> implements OnInit, DoCheck, OnDestroy {

  private _subscription = new Subscription();
  private _nzSwitch$$ = new ReplaySubject<Observable<T>>(1);
  private _nzSwitch$ = new ReplaySubject<T>(1);
  private _priority$$ = new ReplaySubject<Observable<Priority>>(1);
  private _priority: Priority;
  private _optimized$$ = new ReplaySubject<Observable<boolean>>(1);
  private _optimized = false;
  private _noonobservable$: Observable<T> | null = null;
  private _onMatch = new ReplaySubject<boolean>(1);
  private _match = false;
  private _viewCount = 0;
  private _initCount = 0;
  private _abort$ = new Subject<void>();
  private _sealed = false;
  private _shouldRiseEvent = false;

  readonly onMatch = this._onMatch.asObservable();
  readonly onSwitch = this._nzSwitch$.asObservable();

  @Input()
  set nzSwitch(nzSwitch: Signal<T> | Observable<T> | Subscribable<T> | Promise<T> | PromiseLike<T> | T) {
    if (isSignal(nzSwitch)) {
      this._noonobservable$ = null;
      this._nzSwitch$$.next(fromSignal(nzSwitch, this._injector));
    } else if (isSubscribable(nzSwitch)) {
      this._noonobservable$ = null;
      this._nzSwitch$$.next(fromSubscribable(nzSwitch));
    } else {
      if (isPromiseLike(nzSwitch)) {
        this._noonobservable$ = fromPromiseLike(nzSwitch);
      } else {
        this._noonobservable$ = of(nzSwitch);
      }
    }
  }

  @Input()
  set priority(priority: Signal<Priority> | Observable<Priority> | Subscribable<Priority> | Priority) {
    if (isSignal(priority)) {
      this._priority$$.next(fromSignal(priority, this._injector))
    } else if (isSubscribable(priority)) {
      this._priority$$.next(fromSubscribable(priority));
    } else {
      this._priority$$.next(of(priority));
    }
  }

  @Input()
  set optimized(optimized: Signal<boolean> | Observable<boolean> | Subscribable<boolean> | boolean) {
    if (isSignal(optimized)) {
      this._optimized$$.next(fromSignal(optimized, this._injector))
    } else if (isSubscribable(optimized)) {
      this._optimized$$.next(fromSubscribable(optimized));
    } else {
      this._optimized$$.next(of(optimized));
    }
  }

  @Output() render = new EventEmitter<T>();

  constructor(@Optional() @Inject(NZ_SWITCH_CONFIG) config: NzSwitchConfiguration | null,
              private _injector: Injector) {
    assertNoopZoneEnviroment();
    const defaultPriority = config?.defaultPriority ?? Priority.normal;
    const optimized = config?.optimized ?? false;

    this._priority = defaultPriority;
    this._priority$$.next(of(defaultPriority));
    this._optimized = NzScheduler.enabled ? optimized : false;
    this._optimized$$.next(of(this._optimized));

    if (NzScheduler.enabled) {
      this._subscription.add(this._priority$$.pipe(
        switchAll()
      ).subscribe((priority) =>  this._priority = priority));
      this._subscription.add(this._optimized$$.pipe(
        switchAll()
      ).subscribe((optimized) => this._optimized = optimized));
    }
  }

  ngOnInit(): void {
    if (!this._viewCount) {
      this._subscription.add(this._nzSwitch$$.pipe(switchAll()).subscribe((nzSwitch) => {
        if (this._noonobservable$ && this._optimized) { return; }
        this._shouldRiseEvent = false;
        this._match = false;
        this._abort$.next();
        this._nzSwitch$.next(nzSwitch);
        this._onMatch.next(this._match);
        if (this._shouldRiseEvent) {
          this._riseRenderEvent(nzSwitch);
        }
      }));

      this._sealed = true;
    }
  }

  ngDoCheck(): void {
    if (this._noonobservable$ && !this.optimized) {
      this._nzSwitch$$.next(this._noonobservable$);
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._abort$.next();
    this._abort$.complete();
  }

  getPriority(): Priority {
    return this._priority;
  }

  getAbort(): Observable<void> {
    return this._abort$;
  }

  getOptimized(): boolean {
    return this._optimized;
  }

  isSealed(): boolean {
    return this._sealed;
  }

  private _riseRenderEvent(nzSwitch: T): void {
    if (NzScheduler.enabled && this.render.observed) {
      scheduleWork(this._priority, this._abort$, () => {
        this.render.emit(nzSwitch);
      });
    } else {
      this.render.emit(nzSwitch);
    }
  }

  _matchState(nzSwitch: T, caseView: CaseView<T>): void {
    this._match = caseView.enforceState(nzSwitch) || this._match;
  }

  _increaseViewCount(): void {
    if (this._sealed) { return; }

    this._viewCount++;
  }

  _increaseInitCount(): void {
    if (this._sealed) { return; }

    this._initCount++;
    if (this._initCount === this._viewCount) {

      this._subscription.add(this._nzSwitch$$.pipe(switchAll()).subscribe((nzSwitch) => {
        if (this._noonobservable$ && this._optimized) { return; }
        this._shouldRiseEvent = false;
        this._match = false;
        this._abort$.next();
        this._nzSwitch$.next(nzSwitch);
        this._onMatch.next(this._match);
        if (this._shouldRiseEvent) {
          this._riseRenderEvent(nzSwitch);
        }
      }));

      this._sealed = true;
    }
  }

  _viewChange(): void {
    this._shouldRiseEvent = true;
  }
}

@Directive({ selector: '[nzSwitchCase]', standalone: true })
export class NzSwitchCaseDirective<T extends object | number | boolean | string> implements OnInit, OnDestroy, CaseView<T> {

  private _subscription = new Subscription();
  private _viewRef: ViewRef | null = null;
  private _init = false;
  private _nzSwitchCase!: T

  @Input() set nzSwitchCase(value: T) {
    if (this._init) { return; }
    this._nzSwitchCase = value;
  }

  constructor(private _templateRef: TemplateRef<DefaultNzContext>,
              private _viewContainerRef: ViewContainerRef,
              @Host() private _nzSwitchDir: NzSwitchDirective<T>,
              private _changeDetectorRef: ChangeDetectorRef) {
    assertNoopZoneEnviroment();
    _nzSwitchDir._increaseViewCount();
  }

  enforceState(nzSwitch: T): boolean {
    const match = nzSwitch === this._nzSwitchCase;
    if (match && !this._viewRef) {
      this._createView();
    } if (!match && this._viewRef) {
      this._destroyView();
    } else if (this._viewRef && !this._nzSwitchDir.getOptimized()) {
      if (NzScheduler.enabled) {
        detectChanges(this._viewRef, {
          abort$: this._nzSwitchDir.getAbort(),
          priority: this._nzSwitchDir.getPriority()
        });
      } else {
        this._changeDetectorRef.markForCheck();
      }
    }
    return match;
  }

  ngOnInit(): void {
    this._init = true;
    if (this._nzSwitchDir.isSealed()) { return; }

    this._subscription.add(this._nzSwitchDir.onSwitch.subscribe((nzSwitch) => {
      this._nzSwitchDir._matchState(nzSwitch, this);
    }));
    this._nzSwitchDir._increaseInitCount();
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  private _createView(): void {
    if (NzScheduler.enabled) {
      scheduleWork(this._nzSwitchDir.getPriority(), this._nzSwitchDir.getAbort(), () => {
        const context = new DefaultNzContext();
        this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef, context);
        context.$implicit = context.cdRef = this._viewRef;
        detectChangesSync(this._viewRef);
      });
    } else {
      const context = new DefaultNzContext();
      this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef, context);
      context.$implicit = context.cdRef = this._viewRef;
      this._changeDetectorRef.markForCheck();
    }

    this._nzSwitchDir._viewChange();
  }

  private _destroyView(): void {
    if (NzScheduler.enabled) {
      scheduleWork(this._nzSwitchDir.getPriority(), this._nzSwitchDir.getAbort(), () => {
        this._viewContainerRef.clear();
        this._viewRef!.detectChanges();
        this._viewRef = null;
      });
    } else {
      this._viewContainerRef.clear();
      this._viewRef = null;
      this._changeDetectorRef.markForCheck();
    }
    this._nzSwitchDir._viewChange();
  }

  static ngTemplateGuard_nzSwitchCase: 'binding';

  static ngTemplateContextGuard(dir: NzSwitchCaseDirective<any>, ctx: any): ctx is DefaultNzContext {
    return true;
  }
}

@Directive({ selector: '[nzSwitchDefault]', standalone: true })
export class NzSwitchDefaultDirective implements OnInit, OnDestroy {

  private _subscription = new Subscription();
  private _viewRef: ViewRef | null = null;

  constructor(private _viewContainerRef: ViewContainerRef,
              private _templateRef: TemplateRef<DefaultNzContext>,
              @Host() private _nzSwitchDir: NzSwitchDirective<any>,
              private _changeDetectorRef: ChangeDetectorRef) {
    assertNoopZoneEnviroment();
    _nzSwitchDir._increaseViewCount();
  }

  ngOnInit(): void {
    if (this._nzSwitchDir.isSealed()) { return; }

    if (NzScheduler.enabled) {
      this._subscription.add(this._nzSwitchDir.onMatch.subscribe((match) => {
        if (match && this._viewRef) {
          scheduleWork(this._nzSwitchDir.getPriority(), this._nzSwitchDir.getAbort(), () => {
            this._viewContainerRef.clear();
            this._viewRef!.detectChanges();
            this._viewRef = null;
          });
          this._nzSwitchDir._viewChange();
        } else if (!match && !this._viewRef) {
          scheduleWork(this._nzSwitchDir.getPriority(), this._nzSwitchDir.getAbort(), () => {
            const context = new DefaultNzContext();
            this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef);
            context.$implicit = context.cdRef = this._viewRef;
            detectChangesSync(this._viewRef);
          });
          this._nzSwitchDir._viewChange();
        } else if (this._viewRef && !this._nzSwitchDir.getOptimized()) {
          detectChanges(this._viewRef, {
            abort$: this._nzSwitchDir.getAbort(),
            priority: this._nzSwitchDir.getPriority()
          })
        }
      }));
    } else {
      this._subscription.add(this._nzSwitchDir.onMatch.subscribe((match) => {
        if (match && this._viewRef) {
          this._viewContainerRef.clear();
          this._viewRef = null;
          this._changeDetectorRef.markForCheck();
        } else if (!match && !this._viewRef) {
          const context = new DefaultNzContext();
          this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef);
          context.$implicit = context.cdRef = this._viewRef;
          this._changeDetectorRef.markForCheck();
        } else if (this._viewRef && !this._nzSwitchDir.getOptimized()) {
          this._changeDetectorRef.markForCheck();
        }
      }))
    }



    this._nzSwitchDir._increaseInitCount();
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  static ngTemplateGuard_nzSwitchDefault: 'binding';

  static ngTemplateContextGuard(dir: NzSwitchDefaultDirective, ctx: any): ctx is DefaultNzContext {
    return true;
  }

}
