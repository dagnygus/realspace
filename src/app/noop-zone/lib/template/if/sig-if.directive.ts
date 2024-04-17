import { ChangeDetectorRef, Directive, DoCheck, EffectRef, Inject, Input, OnDestroy, OnInit, Optional, Signal, TemplateRef, ViewContainerRef, ViewRef } from "@angular/core";
import { NzScheduler, Priority, assertNoopZoneEnviroment, detectChangesSync, scheduleWork } from "../../core";
import { Watch, createWatch, setActiveConsumer } from "@angular/core/primitives/signals";
import { NextObserver, Subject } from "rxjs";
import { createInputReadEffect } from "../utils/utils";
import { SIG_IF_CONFIG, SigIfConfiguration } from "../injection-tokens/injection-tokens";

@Directive({ selector: '[sigIf]', standalone: true })
export class SigIfDirective<T> implements DoCheck, OnInit, OnDestroy {

  private _inputWatcher: EffectRef = null!;
  private _thenTemplateRef: TemplateRef<SigIfContext<T>>;
  private _elseTemplateRef: TemplateRef<SigIfContext<T>> | null = null;
  private _thenViewRef: ViewRef | null = null;
  private _elseViewRef: ViewRef | null = null;
  private _priority: Priority
  private _thenViewWatcher: Watch | null = null;
  private _elseViewWatcher: Watch | null = null;
  private _abort$ = new Subject<void>();
  private _context!: SigIfContext<T>;
  private _scheduled = false;
  private _thenViewNeedsCheck = false;
  private _elseViewNeedsCheck = false;

  @Input() sigIfPriority?: Signal<Priority> | Priority;

  @Input()  sigIf: Signal<T> = null!

  @Input() sigIfRenderCallback: NextObserver<T> | null = null;

  @Input() set sigIfThen(thenTemplateRef: TemplateRef<SigIfContext<T>>) {
    this._thenTemplateRef = thenTemplateRef
    if (this._context) {
      this._clearThenView();
      if (NzScheduler.enabled) {
        this._update();
      } else {
        this._syncUpdate();
      }
    }
  }

  @Input() set sigIfElse(elseTemplateRef: TemplateRef<SigIfContext<T>>) {
    this._elseTemplateRef = elseTemplateRef;
    if (this._context) {
      this._clearElseView();
      if (NzScheduler.enabled) {
        this._update();
      } else {
        this._syncUpdate();
      }
    }
  }

  constructor(private _viewContainerRef: ViewContainerRef,
              templateRef: TemplateRef<SigIfContext<T>>,
              changeDetectorRef: ChangeDetectorRef,
              @Optional() @Inject(SIG_IF_CONFIG) config: SigIfConfiguration | null) {
    assertNoopZoneEnviroment();

    this._thenTemplateRef = templateRef
    this._priority = config?.defaultPriority ?? Priority.normal;

    if(NzScheduler.disabled) {
      const prevConsumer = setActiveConsumer(null);
      try {
        this._inputWatcher = createWatch(
          () => {
            this._syncUpdate();
            this._scheduled = false;
          },
          () => {
            if (this._scheduled) { return; }
            this._scheduled = true;
            if (this._context) {
              changeDetectorRef.markForCheck();
            }
          },
          false
        );
        (this._inputWatcher as Watch).notify()
      } finally {
        setActiveConsumer(prevConsumer);
      }
    }
  }

  ngDoCheck(): void {
    if (NzScheduler.disabled && this._context && this._scheduled) {
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
      const prevConsumer = setActiveConsumer(null);
      try {
        this._inputWatcher = createInputReadEffect(() => {
          if (!this._context) {
            this._context = new DefaultSigIfContext(this.sigIf);
          }
          this._update();
        }, false);
      } finally {
        setActiveConsumer(prevConsumer);
      }
    } else {
      this._context = new DefaultSigIfContext(this.sigIf);
      (this._inputWatcher as Watch).run();
    }
  }

  ngOnDestroy(): void {
    this._abort$.next();
    this._abort$.complete();
    this._inputWatcher.destroy();
    if (this._thenViewWatcher) { this._thenViewWatcher.destroy(); }
    if (this._elseViewWatcher) { this._elseViewWatcher.destroy(); }
  }

  private _update(): void {
    if (this._context.$implicit()) {
      if (!this._thenViewWatcher) {
        this._createThenView();
      } else if (this._thenViewNeedsCheck) {
        this._thenViewWatcher.notify();
      }
    } else {
      if (!this._elseViewWatcher) {
        this._createElseView();
      } else if (this._elseViewNeedsCheck) {
        this._elseViewWatcher.notify();
      }
    }
  }

  private _syncUpdate(): void {
    if (this._context.$implicit()) {
      if (!this._thenViewRef) {
        if (this._elseViewRef) {
          this._viewContainerRef.clear();
          this._elseViewRef = null;
        }
        this._thenViewRef = this._viewContainerRef.createEmbeddedView(
          this._thenTemplateRef,
          this._context
        );

        if (this.sigIfRenderCallback) {
          this.sigIfRenderCallback!.next(this._context.$implicit());
        }
      }
    } else {
      if (this._thenViewRef) {
        this._viewContainerRef.clear();
        this._thenViewRef = null;

        if (this._elseTemplateRef) {
          this._elseViewRef = this._viewContainerRef.createEmbeddedView(
            this._elseTemplateRef,
            this._context
          );
        }

        if (this.sigIfRenderCallback) {
          this.sigIfRenderCallback!.next(this._context.$implicit());
        }
      }
    }
  }

  private _createThenView(): void {
    const prevConsumer = setActiveConsumer(null);

    try {
      this._thenViewNeedsCheck = false;
      if (this._scheduled) {
        this._abort$.next();
        this._scheduled = false;
      }

      const effectFn = () => {
        if (this._elseViewRef) {
          this._elseViewWatcher!.destroy();
          this._elseViewWatcher = null;
          this._viewContainerRef.clear();
          this._elseViewRef.detectChanges();
          this._elseViewRef = null;
        } else if (this._elseViewWatcher) {
          this._elseViewWatcher.destroy();
          this._elseViewWatcher = null;
        }

        if (!this._thenViewRef) {
          this._thenViewRef = this._viewContainerRef.createEmbeddedView(
            this._thenTemplateRef,
            this._context
          );
        }

        detectChangesSync(this._thenViewRef);
        this._thenViewNeedsCheck = false;
        this._scheduled = false;
      };

      this._thenViewWatcher = createWatch(
        effectFn,
        () => {
          if (this._scheduled) { return; }
          this._scheduled = true;
          if (this._thenViewRef) {
            this._thenViewNeedsCheck = true;
          }
          scheduleWork(this._getPriority(), this._abort$, () => {
            this._thenViewWatcher!.run();
            if (this._scheduled) {
              effectFn();
            }
          });
          if (!this._thenViewRef) {
            this._scheduleRenderCallback();
          }
        },
        false
      );

      this._thenViewWatcher.notify();
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }

  private _createElseView(): void {
    const prevConsumer = setActiveConsumer(null);

    try {
      this._elseViewNeedsCheck = false;
      if (this._scheduled) {
        this._abort$.next();
        this._scheduled = false;
      }

      if (this._elseTemplateRef) {
        const elseTemplateRef = this._elseTemplateRef;

        const effectFn = () => {
          if (this._thenViewRef) {
            this._thenViewWatcher!.destroy();
            this._thenViewWatcher = null;
            this._viewContainerRef.clear();
            this._thenViewRef.detectChanges();
            this._thenViewRef = null;
          } else if (this._thenViewWatcher) {
            this._thenViewWatcher.destroy();
            this._thenViewWatcher = null;
          }

          if (!this._elseViewRef) {
            this._elseViewRef = this._viewContainerRef.createEmbeddedView(
              elseTemplateRef,
              this._context
            );
          }

          detectChangesSync(this._elseViewRef);
          this._elseViewNeedsCheck = false;
          this._scheduled = false;
        };

        this._elseViewWatcher = createWatch(
          effectFn,
          () => {
            if (this._scheduled) { return; }
            this._scheduled = true;
            if (this._elseViewRef) {
              this._elseViewNeedsCheck = true;
            }
            scheduleWork(this._getPriority(), this._abort$, () => {
              this._elseViewWatcher!.run();
              if (this._scheduled) {
                effectFn();
              }
            });
            if (!this._elseViewRef) {
              this._scheduleRenderCallback();
            }
          },
          false
        );

        this._elseViewWatcher.notify();

      } else {
        if (this._thenViewRef) {
          scheduleWork(this._getPriority(), this._abort$, () => {
            this._thenViewWatcher!.destroy();
            this._thenViewWatcher = null;
            this._viewContainerRef.clear();
            this._thenViewRef!.detectChanges();
            this._thenViewRef = null;
          });
          this._scheduleRenderCallback();
        } else if (this._thenViewWatcher) {
          this._thenViewWatcher.destroy();
          this._thenViewWatcher = null;
        }
      }
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }

  private _clearThenView(): void {
    if (this._thenViewRef) {
      this._thenViewWatcher!.destroy();
      this._thenViewWatcher = null;
      this._viewContainerRef.clear();
      this._thenViewRef.detectChanges();
      this._thenViewRef = null;
    }
  }

  private _clearElseView(): void {
    if (this._elseViewRef) {
      this._elseViewWatcher!.destroy();
      this._elseViewWatcher = null;
      this._viewContainerRef.clear();
      this._elseViewRef.detectChanges();
      this._elseViewRef = null;
    }
  }

  private _scheduleRenderCallback(): void {
    if (this.sigIfRenderCallback) {
      const renderCb = this.sigIfRenderCallback;
      scheduleWork(this._getPriority(), this._abort$, () => renderCb.next(this._context.$implicit()))
    }
  }

  private _getPriority(): Priority {
    if (typeof this.sigIfPriority === 'number') {
      return this.sigIfPriority;
    }
    const prevConsumer = setActiveConsumer(null);
    try {
      return this.sigIfPriority ? this.sigIfPriority() : this._priority;
    } finally {
      setActiveConsumer(prevConsumer);
    }
  }

  static ngTemplateGuard_sigIf: 'binding';

  static ngTemplateContextGuard<T>(dir: SigIfDirective<T>, ctx: any): ctx is SigIfContext<Exclude<T, false|0|''|null|undefined>> {
    return true;
  }
}

export interface SigIfContext<T> {
  $implicit: Signal<T>;
  sigIf: Signal<T>;
}

class DefaultSigIfContext<T> implements SigIfContext<T> {

  $implicit: Signal<T>;
  sigIf: Signal<T>;

  constructor(
    valueSource: Signal<T>,
  ) {
    this.$implicit = this.sigIf = valueSource;
  }
}
