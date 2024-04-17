import { AfterContentChecked, ChangeDetectorRef, Directive, DoCheck, EffectRef, EventEmitter, Host, Inject, Input, NgZone, OnChanges, OnDestroy, OnInit, Optional, Output, Signal, SimpleChanges, TemplateRef, ViewContainerRef, ViewRef } from "@angular/core";
import { Subject } from "rxjs";
import { NzScheduler, Priority, assertNoopZoneEnviroment, detectChangesSync, scheduleWork } from "../../core";
import { NZ_SWITCH_CONFIG, SigSwitchConfiguration } from "../injection-tokens/injection-tokens";
import { Watch, createWatch, setActiveConsumer } from "@angular/core/primitives/signals";
import { createInputReadEffect } from "../utils/utils";

interface CaseView {
  enforceState(sigSwitch: any): boolean;
}

interface DefaultView {
  create(): void;
  destroy(): void;
}

@Directive({ selector: '[sigSwitch]', standalone: true })
export class SigSwitchDirective implements OnInit, DoCheck, OnDestroy {
  private _caseViews: CaseView[] = [];
  private _defaultViews: DefaultView[] = [];
  private _initCount = 0;
  private _priority: Priority;
  private _sealed = false;
  private _match = false;
  private _inputWacher: EffectRef = null!;
  private _viewHasChange = false;
  private _abort$ = new Subject<void>();

  @Input() priority?: Signal<Priority> | Priority;

  @Input() sigSwitch: Signal<any> = null!;

  @Output() render = new EventEmitter<any>();

  constructor(@Optional() @Inject(NZ_SWITCH_CONFIG) config: SigSwitchConfiguration | null,
              private _changeDetectorRef: ChangeDetectorRef) {
    assertNoopZoneEnviroment();

    this._priority = config?.defaultPriority ?? Priority.normal;
  }

  ngOnInit(): void {
    if (!this._caseViews.length && !this._defaultViews.length) {
      this._init();
    }
  }

  ngDoCheck(): void {
    if (NzScheduler.disabled && this._inputWacher) {
      (this._inputWacher as Watch).run();
    }
  }

  ngOnDestroy(): void {
    this._inputWacher.destroy();
  }

  isSealed(): boolean {
    return this._sealed;
  }

  _getPriority(): Priority {
    if (typeof this.priority === 'number') {
      return this.priority;
    }
    const prevConsumer = setActiveConsumer(null);
    try {
      return this.priority ? this.priority() : this._priority;
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }

  _addCase(caseView: CaseView): void {
    if (this._sealed) { return; }
    this._caseViews.push(caseView);
  }

  _addDefault(defaultView: DefaultView): void {
    if (this._sealed) { return; }
    this._defaultViews.push(defaultView);
  }

  _increaseInitCount(): void {
    if (this._sealed) { return; }
    this._initCount++;
    if (this._initCount === this._caseViews.length + this._defaultViews.length) {
      this._init();
    }
  }

  _viewChange(): void {
    this._viewHasChange = true;
  }

  private _init(): void {
    if (NzScheduler.enabled) {
      const prevConsumer = setActiveConsumer(null);
      try {
        this._inputWacher = createInputReadEffect(() => this._update(), false);
      } finally {
        setActiveConsumer(prevConsumer);
      }
    } else {
      const prevConsumer = setActiveConsumer(null);
      try {
        this._inputWacher = createWatch(
          () => this._update(),
          () => this._changeDetectorRef.markForCheck(),
          false
        );
        (this._inputWacher as Watch).notify();
        (this._inputWacher as Watch).run();
      } finally {
        setActiveConsumer(prevConsumer);
      }
    }
    this._sealed = true;
  }

  private _matchState(sigSwitch: any, caseView: CaseView) {
    this._match = caseView.enforceState(sigSwitch) || this._match;
  }

  private _update(): void {
    const value = this.sigSwitch();
    this._match = false;
    this._viewHasChange = false;

    for (let i = 0; i < this._caseViews.length; i++) {
      this._matchState(value, this._caseViews[i])
    }

    if (this._match) {
      for(let i = 0; i < this._defaultViews.length; i++) {
        this._defaultViews[i].destroy();
      }
    } else {
      for(let i = 0; i < this._defaultViews.length; i++) {
        this._defaultViews[i].create();
      }
    }

    this._riseEventIfViewChange(value);
  }

  private _riseEventIfViewChange(value: any): void {
    if (NzScheduler.enabled) {
      if (this._viewHasChange) {
        scheduleWork(this._getPriority(), this._abort$, () => this.render.emit(value));
      }
    } else {
      this.render.emit(value);
    }
  }
}

@Directive({ selector: '[sigSwitchCase]', standalone: true })
export class SigSwitchCaseDirective implements CaseView, OnInit, OnDestroy {
  private _abort$ = new Subject<void>();
  private _scheduled = false;
  private _watcher: Watch | null = null;
  private _viewRef: ViewRef | null = null;
  private _match = false;
  private _sigSwitchCase: any;
  private _init = false;

  @Input() set sigSwitchCase(value: any) {
    if (this._init) { return; }
    this._sigSwitchCase = value;
  };

  constructor(
    private _templateRef: TemplateRef<unknown>,
    private _viewContainerRef: ViewContainerRef,
    @Host() private _sigSwitchDir: SigSwitchDirective) {
    assertNoopZoneEnviroment();
    _sigSwitchDir._addCase(this);
  }

  enforceState(sigSwitch: any): boolean {
    this._match = this._sigSwitchCase === sigSwitch;

    if (NzScheduler.enabled) {
      if (this._match && !this._watcher) {
        this._createView();
        this._sigSwitchDir._viewChange();
      } else if (!this._match && this._watcher) {
        this._destoryView();
        this._sigSwitchDir._viewChange();
      }
    } else {
      if (this._match && !this._viewRef) {
        this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef);
        this._sigSwitchDir._viewChange();
      } else if (!this._match && this._viewRef) {
        this._viewContainerRef.clear();
        this._viewRef = null;
        this._sigSwitchDir._viewChange();
      }
    }

    return this._match;
  }

  ngOnInit(): void {
    this._init = true;
    this._sigSwitchDir._increaseInitCount();
  }

  ngOnDestroy(): void {
    this._abort$.next();
    this._abort$.complete();
    if (this._watcher) { this._watcher.destroy(); }
  }

  private _createView(): void {
    const prevConsumer = setActiveConsumer(null);

    try {
      this._watcher = createWatch(
        () => {
          if (!this._viewRef) {
            this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef);
          }
          detectChangesSync(this._viewRef);
          this._scheduled = false;
        },
        () => {
          if (this._scheduled) { return; }
          this._scheduled = true;
          scheduleWork(this._sigSwitchDir._getPriority(), this._abort$, () => {
            if (!this._match && this._viewRef) {
              this._viewContainerRef.clear()
              this._viewRef.detectChanges();
              this._viewRef = null;
              this._watcher!.destroy();
              this._watcher = null;
              this._scheduled = false;
              return;
            }

            this._watcher!.run();
          });
        },
        false
      );

      this._watcher.notify();
    } finally {
      setActiveConsumer(prevConsumer);
    }

  }

  private _destoryView(): void {
    this._watcher!.notify();
  }
}

@Directive({ selector: '[sigSwitchDefault]', standalone: true })
export class SigSwitchDefaultDirective implements DefaultView, OnInit, OnDestroy {

  private _scheduled = false;
  private _watcher: Watch | null = null;
  private _abort$ = new Subject<void>();
  private _viewRef: ViewRef | null = null
  private _destroy = false;

  constructor(
    private _templateRef: TemplateRef<unknown>,
    private _viewContainerRef: ViewContainerRef,
    @Host() private _sigSwitchDir: SigSwitchDirective
  ) {
    assertNoopZoneEnviroment();
    _sigSwitchDir._addDefault(this);
  }

  create(): void {
    if (NzScheduler.enabled) {
      this._destroy = false;

      if (this._watcher) { return; }
      const prevConsumer = setActiveConsumer(null);
      try {
        this._watcher = createWatch(
          () => {
            if (!this._viewRef) {
              this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef);
            }

            detectChangesSync(this._viewRef);
            this._scheduled = false;
          },
          () => {
            if (this._scheduled) { return; }
            this._scheduled = true;
            scheduleWork(this._sigSwitchDir._getPriority(), this._abort$, () => {
              if (this._destroy && this._viewRef) {
                this._viewContainerRef.clear();
                this._viewRef.detectChanges();
                this._viewRef = null;
                this._watcher!.destroy();
                this._watcher = null;
                this._scheduled = false;
                return;
              }
              this._watcher!.run();
            });
          },
          false
        );

        this._watcher.notify();
      } finally {
        setActiveConsumer(prevConsumer);
      }
      this._sigSwitchDir._viewChange();
    } else {
      if (this._viewRef) { return; }
      this._viewRef = this._viewContainerRef.createEmbeddedView(this._templateRef);
      this._sigSwitchDir._viewChange();
    }

  }

  destroy(): void {
    if (NzScheduler.enabled) {
      this._destroy = true;
      if (this._watcher) {
        this._watcher.notify();
        this._sigSwitchDir._viewChange();
      }
    } else {
      if (this._viewRef) {
        this._viewContainerRef.clear();
        this._viewRef = null;
        this._sigSwitchDir._viewChange();
      }
    }
  }

  ngOnInit(): void {
    this._sigSwitchDir._increaseInitCount();
  }

  ngOnDestroy(): void {
    this._abort$.next();
    this._abort$.complete();
    if (this._watcher) { this._watcher.destroy(); }
  }

}
