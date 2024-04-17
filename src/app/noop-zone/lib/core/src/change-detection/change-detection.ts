import { ChangeDetectorRef, DestroyRef, ViewRef, inject, ɵNG_COMP_DEF } from "@angular/core";
import { cancelCallback, scheduleCallback } from "../scheduler/scheduler";
import { Priority, coercePriority } from "../scheduler/priority";
import { Subscribable, Unsubscribable, take } from "rxjs";
import { ReactSchedulerTask } from "../scheduler/scheduler-min-heap";
import { assertNoopZoneEnviroment, } from "../enviroment/enviroment";
import { NGZONE_ON_STABLE, NOOP_ZONE_FLAGS, NZ_GLOBALS, NZ_LAST_USED_VIEW, NZ_POTENCIAL_ROOT_CMPS, NZ_SUSPENDED_VIEWS, NZ_WORK_DONE_LISTENERS, NzFlags, NzGlobals, NzGlobalsRef } from "../globals/globals";

declare const ngDevMode: any;
declare const __noop_zone_globals__: NzGlobalsRef;
const nzGlobals = __noop_zone_globals__[NZ_GLOBALS];

const coalescingScopes = new WeakSet<ChangeDetectorRef>();
let currentScope: ChangeDetectorRef | null = null;

function _isObject(target: unknown): target is object {
  return target != null && typeof target === 'object';
}

export const NOOP_CB = () => {};

function cleanupAfterWork(): void {

  if (nzGlobals[NZ_WORK_DONE_LISTENERS].length) {
    for (let i = 0; i < nzGlobals[NZ_WORK_DONE_LISTENERS].length; i++) {
      nzGlobals[NZ_WORK_DONE_LISTENERS][i]();
    }
    nzGlobals[NZ_WORK_DONE_LISTENERS] = [];
  }

  currentScope = null;
  if (nzGlobals[NZ_LAST_USED_VIEW]) {
    coalescingScopes.delete(nzGlobals[NZ_LAST_USED_VIEW]);
    nzGlobals[NZ_LAST_USED_VIEW] = null;
  }
}

export function coalesceCurrentWork(): void {
  if (currentScope) { return; }

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.WorkRunnig) {
    if (nzGlobals[NZ_LAST_USED_VIEW] == null) {
      throw new Error('To cheduler current work you need to call datectChangesSync(cdRef) first!');
    }

    coalescingScopes.add(nzGlobals[NZ_LAST_USED_VIEW]);
  }
}

export function runInCoalescingScope(scope: ChangeDetectorRef, fn: () => void) {
  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) {
    fn();
    return;
  }

  if (coalescingScopes.has(scope)) {
    fn();
    return;
  }

  coalescingScopes.add(scope);
  currentScope = scope
  fn();
  currentScope = null;
  coalescingScopes.delete(scope);
}


export function initializeComponent(component: object, priority: Priority = Priority.normal): ChangeDetectorRef {


  const cdRef = inject(ChangeDetectorRef);

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) {
    return cdRef;
  }

  cdRef.detach();

  if ((typeof ngDevMode === 'undefined' || ngDevMode)) {
    if ((component.constructor as any)[ɵNG_COMP_DEF] === 'undefined') {
      throw new Error('Provided instance is not component instance');
    }
  }


  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.__ContinueCmpInit) {
    detectChanges(cdRef, priority);
  } else {
    nzGlobals[NZ_POTENCIAL_ROOT_CMPS]!.push(component);
    nzGlobals[NZ_SUSPENDED_VIEWS]!.push([cdRef, priority]);
  }

  return cdRef;
}

export interface DetectChangesOptions {
  priority?: Priority;
  abort$?: Subscribable<void | unknown>;
  onDone?: () => void;
}

export function detectChanges(cdRef: ChangeDetectorRef): void
export function detectChanges(cdRef: ChangeDetectorRef, priority: Priority): void
export function detectChanges(cdRef: ChangeDetectorRef, options: DetectChangesOptions): void
export function detectChanges(cdRef: ChangeDetectorRef, options?: DetectChangesOptions | Priority) {

  assertNoopZoneEnviroment();

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) {
    cdRef.markForCheck();

    if (typeof options === 'object' && options.onDone) {
      const onDone = options.onDone;
      nzGlobals[NGZONE_ON_STABLE].pipe(take(1)).subscribe(() => onDone())
    }

    return;
  }

  let priority: Priority;
  let abort$: Subscribable<any> | null = null;
  let onDone: (() => void) | null = null;

  if (typeof options === 'object') {
    priority = (options && options.priority) || Priority.normal
    priority = coercePriority(priority);
    abort$ = (options && options.abort$) || null;
    onDone = (options && options.onDone) || null;
  } else {
    priority = options || Priority.normal
  }

  if ((cdRef as ViewRef).destroyed || coalescingScopes.has(cdRef)) { return; }

  let abortSubscription: Unsubscribable | null = null;
  let task: ReactSchedulerTask | null = null;

  coalescingScopes.add(cdRef);
  task = scheduleCallback(priority, () => {
    nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.WorkRunnig
    task = null;
    currentScope = cdRef
    if (abortSubscription) {
      abortSubscription.unsubscribe();
    }

    try {
      cdRef.detectChanges();
    } finally {
      coalescingScopes.delete(cdRef);
      if (onDone) { onDone() }
      nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.WorkRunnig
      cleanupAfterWork()
    }
  });

  if (abort$) {
    abortSubscription = abort$.subscribe({
      next: () => {
        if (task) {
          coalescingScopes.delete(cdRef);
          cancelCallback(task);
          abortSubscription!.unsubscribe();
        }
      }
    });
  }
}

export function detectChangesSync(cdRef: ChangeDetectorRef) {

  assertNoopZoneEnviroment();

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) {
    cdRef.markForCheck();
    return;
  }

  if ((cdRef as ViewRef).destroyed || coalescingScopes.has(cdRef)) { return; }

  coalescingScopes.add(cdRef);

  try {
    cdRef.detectChanges();
  } finally {
    coalescingScopes.delete(cdRef);

    // if ((nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.WorkRunnig) && !coalescingScopes.has(cdRef)) {
    //   nzGlobals[NZ_LAST_USED_VIEW] = cdRef;
    // }

    if ((nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.WorkRunnig)) {
      nzGlobals[NZ_LAST_USED_VIEW] = cdRef;
    }

  }
}

export function scheduleWork(priority: Priority, abort$: Subscribable<void | unknown> | null, work: () => void): void {

  assertNoopZoneEnviroment();

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) {
    work();
    return;
  }

  priority = coercePriority(priority);

    let subscription: Unsubscribable | null = null;

     const task = scheduleCallback(priority, () => {
      if (subscription) { subscription.unsubscribe(); }

      nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.WorkRunnig;
      work();
      nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.WorkRunnig;
      cleanupAfterWork();
    });

    if (abort$) {
      subscription = abort$.subscribe({
        next: () => {
          cancelCallback(task);
          subscription!.unsubscribe()
        }
      })

  }
}

export function internalScheduleWork(priority: Priority, work: () => void): ReactSchedulerTask {
  return scheduleCallback(priority, () => {
    nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.WorkRunnig;
    work();
    nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.WorkRunnig;
    cleanupAfterWork();
  })
}
