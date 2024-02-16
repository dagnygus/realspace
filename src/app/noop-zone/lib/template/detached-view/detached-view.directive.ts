import { AfterContentChecked, ChangeDetectorRef, Directive, Host, Inject, Input, OnDestroy, OnInit, Optional, TemplateRef, ViewContainerRef, ViewRef } from "@angular/core";
import { NZ_DETACHED_VIEW_CONFIG, NZ_QUERY_VIEW, NzDetachedViewConfiguration, QueryView, QueryViewItem } from "../injection-tokens/injection-tokens";
import { NzScheduler, Priority, assertNoopZoneEnviroment, detectChanges, detectChangesSync, scheduleWork } from "../../core";
import { NextObserver, Observable, Subject, Subscription } from "rxjs";
import { DefaultNzContext } from "../utils/utils";

@Directive({
  selector: '[nzDetachedView]',
  standalone: true,
})
export class NzDetachedViewDirective implements OnInit, AfterContentChecked, OnDestroy, QueryViewItem {

  private _priority: Priority;
  private _subscription = new Subscription;
  private _abort$ = new Subject<void>;
  private _queryView: QueryView | null = null;
  private _viewRef: ViewRef | null = null;
  private _isInit = false;
  private _syncCreation?: boolean;

  @Input() set nzDetachedView(priority: Priority | '') {
    if (this._isInit || typeof priority === 'string') {
      return;
    }
    this._priority = priority;
  }

  @Input() nzDetachedViewRenderCallback: NextObserver<void> | null = null;


  constructor(private _viewContainerRef: ViewContainerRef,
              private _templateRef: TemplateRef<DefaultNzContext>,
              private _changeDetectorRef: ChangeDetectorRef,
              @Optional() @Inject(NZ_DETACHED_VIEW_CONFIG) config: NzDetachedViewConfiguration | null,
              @Optional() @Host() @Inject(NZ_QUERY_VIEW) queryView: QueryView | null,
              private _nzScheduler: NzScheduler) {

    assertNoopZoneEnviroment();

    this._priority = config?.defaultPriority ?? Priority.normal;
    this._syncCreation = config?.syncCreation
    const notifyQueryView = config?.notifyQueryView ?? true;
    if (notifyQueryView && this._nzScheduler.enabled) {
      this._queryView = queryView;
    }
  }

  onBeforeQueryViewCheck(): void {
    if (this._viewRef) {
      this._viewRef.reattach();
    }
  }

  onAfterQueryViewCheck(): void {
    if (this._viewRef) {
      this._viewRef.detach();
    }
  }

  onQueryViewCheckRequested(): void {
    // noop
  }

  onQueryViewCheckAborted(): void {
    // noop
  }

  detectChanges(priority?: Priority, abort$?: Observable<void | unknown>): void {
    if (!this._viewRef) { return; }

    if (typeof priority === 'undefined') {
      priority = this._priority;
    }

    if (this._nzScheduler.enabled) {
      if (this._abort$) {
        detectChanges(this._viewRef, { priority, abort$ });
      } else {
        detectChanges(this._viewRef, priority);
      }
    } else {
      this._changeDetectorRef.checkNoChanges();
    }
  }

  ngOnInit(): void {

    if (this._queryView) {
      this._queryView.register(this)
    }

    if (this._nzScheduler.enabled && !this._syncCreation) {

      scheduleWork(this._priority, this._abort$, () => {
        const context = new DefaultNzContext();
        this._viewRef = this._viewContainerRef.createEmbeddedView(
          this._templateRef, context
        );
        context.$implicit = context.cdRef = this._viewRef;

        this._viewRef.detach();
        detectChangesSync(this._viewRef);
      });

      if (this.nzDetachedViewRenderCallback) {
        const renderCb = this.nzDetachedViewRenderCallback
        scheduleWork(this._priority, this._abort$, () => {
          renderCb.next();
        });
      }

      if (this._queryView) {
        if (this._queryView.isChecking()) {
          const queryView = this._queryView;
          scheduleWork(this._priority, this._abort$, () => {
            queryView.notify(this);
          })
        } else {
          this._queryView.notify(this);
        }
      }

    } else {

      const context = new DefaultNzContext();
      this._viewRef = this._viewContainerRef.createEmbeddedView(
        this._templateRef, context
      );
      context.$implicit = context.cdRef = this._viewRef;

      if (this.nzDetachedViewRenderCallback) {
        const renderCb = this.nzDetachedViewRenderCallback
        scheduleWork(this._priority, this._abort$, () => {
          renderCb.next();
        });
      }

    }

    this._isInit = true;
  }

  ngAfterContentChecked(): void {
    if (this._viewRef) {
      this._viewRef.detach();
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    this._abort$.next();
    this._abort$.complete();
    if (this._queryView) {
      this._queryView.dismiss(this);
      this._queryView.unregister(this);
    }
  }

  static ngTemplateGuard_nzDetachedView: 'binding';

  static ngTemplateContextGuard(dir: NzDetachedViewDirective, ctx: any): ctx is DefaultNzContext {
    return true;
  }
}
