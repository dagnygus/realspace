import { ChangeDetectorRef, DestroyRef, EffectRef, effect, inject } from "@angular/core";
import { Watch, createWatch } from "@angular/core/primitives/signals";
import { NzScheduler, Priority, scheduleWork } from "../../core";
import { Subject } from "rxjs";

export class DefaultNzContext {
  $implicit: ChangeDetectorRef = null!;
  cdRef: ChangeDetectorRef = null!;
}

class _EffectHandle implements EffectRef {

  private _watcher: Watch;
  private _abort$ = new Subject<void>();
  private _unregisterCallback: (() => void) | null = null;
  private _scheduled = false;

  constructor(effectFn: () => void, allowSignalWrites: boolean) {
    this._watcher = createWatch(effectFn, () => this._schedule(), allowSignalWrites);
    this._watcher.notify();
  }

  destroy(): void {
    if (this._unregisterCallback) { this._unregisterCallback(); }
    this._abort$.next();
    this._abort$.complete();
    this._watcher.destroy();
  }

  private _schedule(): void {
    if (this._scheduled) { return; }
    this._scheduled = true;

    if (NzScheduler.workRunning) {
      this._unregisterCallback = NzScheduler.onWorkDone(() => {
        this._unregisterCallback = null;
        this._watcher.run();
        this._scheduled = false;
      });
    } else {
      scheduleWork(Priority.immediate, this._abort$, () => {
        this._watcher.run();
        this._scheduled = false;
      });
    }
  }
}

export function createInputReadEffect(effectFn: () => void, allowSignlaWrites: boolean): EffectRef {
  return new _EffectHandle(effectFn, allowSignlaWrites);
}
