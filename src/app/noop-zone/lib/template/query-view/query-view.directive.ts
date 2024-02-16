import { AfterContentChecked, ChangeDetectorRef, Directive, Host, Inject, Input, OnDestroy, OnInit, Optional, PLATFORM_ID, SkipSelf, TemplateRef, ViewContainerRef, ViewRef, inject } from "@angular/core";
import { NZ_QUERY_VIEW, NZ_QUERY_VIEW_CONFIG, NzQueryViewConfiguration, QueryView, QueryViewItem } from "../injection-tokens/injection-tokens";
import { NzScheduler, Priority, assertNoopZoneEnviroment, detectChanges, detectChangesSync, scheduleWork } from "../../core";
import { NextObserver, Observable, Subject, Subscription } from "rxjs";
import { DefaultNzContext } from "../utils/utils";

@Directive({
  selector: '[nzQueryView]',
  standalone: true,
  providers: [{ provide: NZ_QUERY_VIEW, useExisting: NzQueryViewDirective }]
})
export class NzQueryViewDirective implements QueryView, OnInit, AfterContentChecked, OnDestroy {

  private readonly _checkRequested = new Subject<void>;
  private readonly _checkAborted = new Subject<void>;
  private readonly _checkStart = new Subject<void>();
  private readonly _checkDone = new Subject<void>();
  private readonly _subscription = new Subscription();
  private _viewRef: ViewRef | null = null;
  private _isCheckRequested = false;
  private _priority: Priority;
  private _defaultPriority: Priority;
  private _cheking = false;
  private _scopes = new Set<object>();
  private _items: QueryViewItem[] = [];
  private _syncCreation?: boolean;

  readonly onCheckRequested = this._checkRequested.asObservable();
  readonly onCheckAborted = this._checkAborted.asObservable();
  readonly onCheckStart = this._checkStart.asObservable();
  readonly onCheckDone = this._checkDone.asObservable();

  @Input() set nzQueryView(priority: Priority | '') {
    if (typeof priority === 'string') {
      this._priority = this._defaultPriority;
    } else {
      this._priority = priority;
    }
  }

  @Input() nzQueryViewRenderCallback: NextObserver<void> | null = null;

  constructor(private _viewContainerRef: ViewContainerRef,
              private _templateRef: TemplateRef<DefaultNzContext>,
              private _changeDetectorRef: ChangeDetectorRef,
              @Optional() @Inject(NZ_QUERY_VIEW_CONFIG) config: NzQueryViewConfiguration | null,
              @Optional() @Host() @SkipSelf() @Inject(NZ_QUERY_VIEW) queryView: QueryView | null,
              private _nzScheduler: NzScheduler) {
    assertNoopZoneEnviroment();

    if (queryView) {
      throw new Error('[NzQueryViewDirective]:constructor! Nested query view is forbidden!')
    }

    if (this._nzScheduler.enabled) {
      this._subscription.add(_nzScheduler.onSchedulerDone.subscribe(() => {
        if (this._isCheckRequested) {
          // scheduleWork(this._priority, this._checkAborted, () => {
            this._detectChangesSync();
            this._isCheckRequested = false;
            this._scopes.clear();
          // });
        }
      }));
    }


    this._priority = this._defaultPriority = config?.defaultPriority ?? Priority.normal;
    this._syncCreation = config?.syncCreation;
  }

  detectChanges(priority?: Priority, abort$?: Observable<void | unknown>): void {
    if (!this._viewRef) { return; }
    if (typeof priority === 'undefined') {
      priority = this._priority;
    }

    if (this._nzScheduler.enabled) {
      if (abort$) {
        detectChanges(this._viewRef, { priority, abort$ });
      } else {
        detectChanges(this._viewRef, priority);
      }
    } else {
      this._changeDetectorRef.markForCheck();
    }
  }

  notify(scope: object): void {
    if (!this._nzScheduler.enabled) { return; }
    if (!this._viewRef || this._scopes.has(scope)) { return; }
    this._scopes.add(scope);
    this._isCheckRequested = true;

    for (let i = 0; i < this._items.length; i++) {
      this._items[i].onQueryViewCheckRequested();
    }

    this._checkRequested.next();
  }

  register(item: QueryViewItem): void {
    this._items.push(item);
  }

  unregister(item: QueryViewItem): void {
    const index = this._items.indexOf(item);
    if (index < 0) { return; }
    this._items.splice(index, 1);
  }

  dismiss(scope: object): void {
    if (!(this._checkRequested && this._scopes.has(scope))) {
      return;
    }

    this._scopes.delete(scope);
    if (this._scopes.size > 0) { return; }

    this._isCheckRequested = false;

    for (let i = 0; i < this._items.length; i++) {
      this._items[i].onQueryViewCheckAborted();
    }

    this._checkAborted.next();
  }

  isCheckRequested(): boolean {
    return this._isCheckRequested;
  }

  isChecking(): boolean {
    return this._cheking;
  }

  ngOnInit(): void {

    if (this._nzScheduler.enabled && !this._syncCreation) {
      scheduleWork(this._priority, this._checkAborted, () => {
        const context = new DefaultNzContext()
        const viewRef = this._viewRef = this._viewContainerRef.createEmbeddedView(
          this._templateRef!, context,
        );
        context.$implicit = context.cdRef = this._viewRef;
        viewRef.detach();
        this._detectChangesSync();
      });
      if (this.nzQueryViewRenderCallback) {
        const renderCb = this.nzQueryViewRenderCallback;
        scheduleWork(this._priority, this._checkAborted, () => {
          renderCb.next();
        });
      }
    } else {
      const context = new DefaultNzContext()
      this._viewRef = this._viewContainerRef.createEmbeddedView(
        this._templateRef!, context,
      );
      context.$implicit = context.cdRef = this._viewRef;
      if (this.nzQueryViewRenderCallback) {
        this.nzQueryViewRenderCallback.next();
      }
    }

  }

  ngAfterContentChecked(): void {
    if (this._nzScheduler.enabled && !this._syncCreation) {
      this._detectChangesSync();
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    if (this._checkRequested) {
      this._isCheckRequested = false;
      this._checkAborted.next();
    }
    this._scopes.clear();
    this._items.splice(0);
    this._checkAborted.complete();
    this._checkRequested.complete();
  }

  private _detectChangesSync(): void {
    if (this._viewRef) {
      this._cheking = true;

      for (let i = 0; i < this._items.length; i++) {
        this._items[i].onBeforeQueryViewCheck();
      }

      this._checkStart.next();
      detectChangesSync(this._viewRef);
      this._cheking = false;

      for (let i = 0; i < this._items.length; i++) {
        this._items[i].onAfterQueryViewCheck();
      }

      this._checkDone.next();
    }
  }

  static ngTemplateGuard_nzQueryView: 'binding';

  static ngTemplateContextGuard(dir: NzQueryViewDirective, ctx: any): ctx is DefaultNzContext {
    return true;
  }
}
