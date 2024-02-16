import { ChangeDetectorRef, Directive, Host, Inject, Input, OnDestroy, OnInit, Optional, PLATFORM_ID, TemplateRef, ViewContainerRef, ViewRef } from "@angular/core";
import { NzScheduler, Priority, assertNoopZoneEnviroment, detectChanges, detectChangesSync, scheduleWork } from "../../core";
import { DefaultNzContext } from "../utils/utils";
import { NZ_LOCAL_VIEW_CONFIG, NZ_QUERY_VIEW, NzLocalViewConfiguration, QueryView } from "../injection-tokens/injection-tokens";
import { NextObserver, Observable, Subject } from "rxjs";

@Directive({
  selector: '[nzLocalView]',
  standalone: true
})
export class NzLocalViewDirective implements OnInit, OnDestroy {

  private _abort$ = new Subject<void>();
  private _queryView: QueryView | null = null;
  private _priority = Priority.normal;
  private _isInit = true;
  private _viewRef: ViewRef | null = null;
  private _syncCreation?: boolean

  @Input()
  set nzLocalView(priority: Priority | '') {
    if (this._isInit || typeof priority === 'string') {
      return;
    }

    this._priority = priority;
  }

  @Input() nzLocalViewRenderCallback: NextObserver<void> | null = null;

  constructor(private _viewContainerRef: ViewContainerRef,
              private _templateRef: TemplateRef<DefaultNzContext>,
              private _changeDetectorRef: ChangeDetectorRef,
              @Optional() @Inject(NZ_LOCAL_VIEW_CONFIG) config: NzLocalViewConfiguration | null,
              @Optional() @Host() @Inject(NZ_QUERY_VIEW) queryView: QueryView | null,
              private _nzScheduler: NzScheduler) {
    assertNoopZoneEnviroment();

    this.nzLocalView = config?.defaultPriority ?? Priority.normal;
    this._syncCreation = config?.syncCreation
    const notifyQueryView = config?.notifyQueryView ?? true;

    if (notifyQueryView && this._nzScheduler.enabled) {
      this._queryView = queryView;
    }
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
      this._changeDetectorRef.markForCheck();
    }
  }

  ngOnInit(): void {

    if (this._nzScheduler.enabled && !this._syncCreation) {

      scheduleWork(this._priority, this._abort$, () => {
        const context = new DefaultNzContext();
        const viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef, context);
        context.$implicit = context.cdRef = viewRef;
        detectChangesSync(viewRef);

        if (this._queryView) {
          this._queryView.notify(this);
        }
      });

      if (this.nzLocalViewRenderCallback) {
        const renderCb = this.nzLocalViewRenderCallback;
        scheduleWork(this._priority, this._abort$, () => {
          renderCb.next();
        });
      }

    } else {

      const context = new DefaultNzContext();
      const viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef, context);
      context.$implicit = context.cdRef = viewRef;
      if (this.nzLocalViewRenderCallback) {
        this.nzLocalViewRenderCallback.next();
      }

    }

    this._isInit = true;
  }

  ngOnDestroy(): void {
    this._abort$.next();
    this._abort$.complete();
    if (this._queryView) {
      this._queryView.dismiss(this)
    }
  }

  static ngTemplateGuard_nzQueryView: 'binding';

  static ngTemplateContextGuard(dir: NzLocalViewDirective, ctx: any): ctx is DefaultNzContext {
    return true;
  }

}
