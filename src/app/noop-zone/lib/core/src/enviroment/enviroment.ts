import { APP_BOOTSTRAP_LISTENER, ComponentRef, Inject, NgModule, NgZone, PLATFORM_ID, ValueProvider, inject, ɵNoopNgZone } from "@angular/core";
import { forceFrameRate, setOnDoneCallback, setOnStableCallback, setOnStartCallback } from "../scheduler/scheduler";
import { Subject, asapScheduler, filter, observeOn, skipUntil } from "rxjs";
import { isPlatformServer } from "@angular/common";

forceFrameRate(60);

let noopZoneFlag = false;
let noopZoneTestFlag = false;
let moduleImported = false;
let schedulerDisabled = true;
let schedulerEnabled = false;
let timeoutRequested = false;
let rootComponents: object[] | null = [];

export const onBootstrap = new Subject<object[]>();

export const onStartSubject = new Subject<void>();
export const onDoneSubject = new Subject<void>();
export const onStableSubject = new Subject<void>();

export const onSchedulerStart = onStartSubject.asObservable();
export const onSchedulerDone = onDoneSubject.asObservable();
export const onStable = onStableSubject.asObservable();

export const onZoneStable = new Subject<any>();

setOnStartCallback(() => onStartSubject.next());
setOnDoneCallback(() => onDoneSubject.next());
setOnStableCallback(() => onStableSubject.next());



export function isDisabled(): boolean {
  return schedulerDisabled;
}

export function isEnabled(): boolean {
  return schedulerEnabled;
}

export function initialNoopZoneTestingEnviroment(disableScheduler = false): void {
  if (noopZoneTestFlag) {
    throw new Error('[initialNoopZoneTestingEnviroment(..)] Testing enviroment was not disposed!')
  }

  if (moduleImported) {
    throw new Error('[initialNoopZoneTestingEnviroment(..)] NoopZoneEnviromentModule detected! Test prevented!');
  }

  noopZoneFlag = true;
  noopZoneTestFlag = true;
  schedulerDisabled = disableScheduler;
  schedulerEnabled = !disableScheduler;
}


export function disposeNoopZoneTestingEnviroment(): void {
  if (noopZoneTestFlag) {
    noopZoneFlag = false;
    noopZoneTestFlag = false;
    schedulerDisabled = true;
    schedulerEnabled = false;
  }
}

export function provideNgNoopZone(): ValueProvider {
  if (noopZoneTestFlag) {
    return { provide: NgZone, useValue: new ɵNoopNgZone() }
  }

  throw new Error('Noop zone testing enviroment was not initialized!');
}

export function isNoopZoneEnviroment(): boolean {
  return noopZoneFlag;
}

export function isNoopZoneTestingEnviroment(): boolean {
  return noopZoneTestFlag;
}

export function assertNoopZoneEnviroment(): void {
  if (!noopZoneFlag) {
    throw new Error('NoopZoneEnviromentModule is not imported to root module!');
  }
}

export function isNoopZoneModuleImported(): boolean {
  return moduleImported
}

function bootstrapListener(componentRef: ComponentRef<any>): void {
  if (schedulerDisabled) { return; }

  rootComponents!.push(componentRef.instance);

  if (!timeoutRequested) {
    timeoutRequested = true;
    setTimeout(() => {
      onBootstrap.next(rootComponents!);
      rootComponents = null;
    });
  }
}

export function patchNgNoopZoneForAngularCdk(): void {
  const zone = inject(NgZone);

  if (schedulerEnabled) {
    if (!(zone instanceof ɵNoopNgZone)) {
      throw new Error('Patching zone insatance for @angular/cdk package is allawed only for noop zone instance!');
    }

    const constructor = (zone as any).constructor  as { prototype: any }
    const zoneTrigger = new Subject<void>();

    let allaw = true;

    zoneTrigger.pipe(
      skipUntil(onStableSubject),
      filter(() => {
        if (allaw) {
          allaw = false;
          return true;
        } else {
          return allaw
        }
      }),
      observeOn(asapScheduler)
    ).subscribe(() => {
      zone.onMicrotaskEmpty.emit();
      zone.onStable.emit();
      allaw = true;
    });

    const originalRun = constructor.prototype.run;
    const originalRunTask = constructor.prototype.runTask

    constructor.prototype.run = function(cb: any) {
      zoneTrigger.next();
      return originalRun.call(this, cb);
    }
    constructor.prototype.runTusk = function(cb: any) {
      zoneTrigger.next();
      return originalRunTask.call(this, cb);
    }

    const originalOnEmptySubscribe = zone.onMicrotaskEmpty.subscribe;
    const originalOnStableSubscribe = zone.onStable.subscribe;

    zone.onMicrotaskEmpty.subscribe = function(...args: any[]) {
      zoneTrigger.next();
      return originalOnEmptySubscribe.apply(this, args as any)
    }

    zone.onStable.subscribe = function(...args: any[]) {
      zoneTrigger.next();
      return originalOnStableSubscribe.apply(this, args as any);
    }
  }
}

@NgModule({
  providers: [{
    provide: APP_BOOTSTRAP_LISTENER,
    multi: true,
    useValue: bootstrapListener
  }]
})
export class NoopZoneEnviromentModule {
  constructor(ngZone: NgZone, @Inject(PLATFORM_ID) platformId: object) {
    if (noopZoneTestFlag) {
      throw new Error('Importing NoopZoneEnviromentModule is forbidden when test mode is enabled!');
    }

    if (isPlatformServer(platformId)) {
      if (!(ngZone instanceof NgZone)) {
        throw new Error('Server application requires a default ngZone based on zone.js!')
      }
      noopZoneFlag = true;

      ngZone.onStable.subscribe(onZoneStable);

      return;
    }

    if (ngZone instanceof ɵNoopNgZone) {
      noopZoneFlag = true;
      moduleImported = true;
      schedulerDisabled = false;
      schedulerEnabled = true;
    } else {
      throw new Error('Application bootstraped with incorrect configuration! provide { ngZone: \'noop\' }!');
    }
  }
}
