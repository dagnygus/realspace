import { ChangeDetectorRef, ViewRef, inject, ɵNG_COMP_DEF } from "@angular/core";
import { cancelCallback, scheduleCallback } from "../scheduler/scheduler";
import { Priority } from "../scheduler/priority";
import { Subscribable, Unsubscribable, take } from "rxjs";
import { ReactSchedulerTask } from "../scheduler/scheduler-min-heap";
import { assertNoopZoneEnviroment, isDisabled, isNoopZoneTestingEnviroment, onBootstrap, onZoneStable } from "../enviroment/enviroment";

declare const ngDevMode: any;

const potentialRootComponents: object[] = [];
const coalescingScopes = new WeakSet<ChangeDetectorRef>();

let bootstraped = false;
let suspendedCdRefs = new Map<object, [ChangeDetectorRef, Priority]>();

onBootstrap.subscribe((rootComponents) => {
  if (isDisabled()) {
    return;
  }

  let bootstrapCount = 0

  for (let i = 0; i < rootComponents.length; i++) {
    bootstrapCount = 0;
    if (potentialRootComponents.includes(rootComponents[i])) {
      bootstrapCount++
    }
  }

  if (bootstrapCount === rootComponents.length) {
    bootstraped = true;
    for (let i = 0; i < potentialRootComponents.length; i++) {
      const [ cdRef, priority ] = suspendedCdRefs.get(potentialRootComponents[i])!
      detectChanges(cdRef, priority);
    }
  } else {
    throw new Error('One of bootsraped components is not initialize! Please use [initializeComponent(this, priority?)] function in constructor!')
  }
});


export function initializeComponent(component: object, priority: Priority = Priority.normal): ChangeDetectorRef {

  const cdRef = inject(ChangeDetectorRef);

  if (isDisabled()) {
    return cdRef;
  }

  cdRef.detach();


  if ((typeof ngDevMode === 'undefined' || ngDevMode)) {
    if ((component.constructor as any)[ɵNG_COMP_DEF] === 'undefined') {
      throw new Error('Provided instance is not component instance');
    }
  }

  if (bootstraped || isNoopZoneTestingEnviroment()) {
    detectChanges(cdRef, priority);
  } else {
    potentialRootComponents.push(component);
    suspendedCdRefs.set(component, [cdRef, priority]);
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

  if (isDisabled()) {
    cdRef.markForCheck();

    if (typeof options === 'object' && options.onDone) {
      const onDone = options.onDone;
      onZoneStable.pipe(take(1)).subscribe(() => onDone())
    }

    return;
  }

  let priority: Priority;
  let abort$: Subscribable<any> | null = null;
  let onDone: (() => void) | null = null;

  if (typeof options === 'object') {
    priority = (options && options.priority) || Priority.normal
    priority = Math.round(Math.max(1, Math.min(priority, 5)));
    abort$ = (options && options.abort$) || null;
    onDone = (options && options.onDone) || null;
  } else {
    priority = options || Priority.normal
  }

  if ((cdRef as ViewRef).destroyed || coalescingScopes.has(cdRef)) { return; }

  let abortSubscription: Unsubscribable | null = null;
  let task: ReactSchedulerTask | null

  coalescingScopes.add(cdRef);
  task = scheduleCallback(priority, () => {
    task = null;
    if (abortSubscription) {
      abortSubscription.unsubscribe();
      abortSubscription = null;
    }
    cdRef.detectChanges();
    coalescingScopes.delete(cdRef);
    if (onDone) { onDone() }
  });

  if (abort$) {
    abortSubscription = abort$.subscribe({
      next: () => {
        if (task) {
          coalescingScopes.delete(cdRef);
          cancelCallback(task);
          task = null;
          abortSubscription!.unsubscribe();
          abortSubscription = null;
        }
      }
    });
  }
}

export function detectChangesSync(cdRef: ChangeDetectorRef) {

  assertNoopZoneEnviroment();

  if (isDisabled()) {
    cdRef.markForCheck();
    return;
  }

  if ((cdRef as ViewRef).destroyed || coalescingScopes.has(cdRef)) { return; }

  coalescingScopes.add(cdRef);
  cdRef.detectChanges();
  coalescingScopes.delete(cdRef);
}

export function scheduleWork(priority: Priority, abort$: Subscribable<void | unknown> | null, work: () => void): void {

  assertNoopZoneEnviroment();

  if (isDisabled()) {
    work();
    return;
  }

  priority = Math.round(Math.max(1, Math.min(priority, 5)));

  if (abort$) {
    let abortSubscription: Unsubscribable | null = null;

    const task = scheduleCallback(priority, () => {
      work();
      if (abortSubscription) {
        abortSubscription.unsubscribe();
        abortSubscription = null;
      }
    });

    abortSubscription = abort$.subscribe({
      next: () => {
        cancelCallback(task);
        abortSubscription!.unsubscribe();
        abortSubscription = null;
      }
    });

  } else {
    scheduleCallback(priority, work);
  }
}
