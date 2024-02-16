import { APP_BOOTSTRAP_LISTENER, ComponentRef, Inject, NgModule, NgZone, PLATFORM_ID, ValueProvider, ɵNoopNgZone } from "@angular/core";
import { forceFrameRate, setOnDoneCallback, setOnStableCallback, setOnStartCallback } from "../scheduler/scheduler";
import { Subject } from "rxjs";
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
  rootComponents!.push(componentRef.instance);

  if (!timeoutRequested) {
    timeoutRequested = true;
    setTimeout(() => {
      onBootstrap.next(rootComponents!)
      rootComponents = null;
    });
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
