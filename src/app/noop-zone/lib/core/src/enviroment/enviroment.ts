import { APP_BOOTSTRAP_LISTENER, ApplicationConfig, ApplicationRef, ComponentRef, ENVIRONMENT_INITIALIZER, EnvironmentProviders, Inject, InjectionToken, NgModule, NgZone, PLATFORM_ID, Type, ValueProvider, inject, makeEnvironmentProviders, ɵNoopNgZone } from "@angular/core";
import { deinitializeScheduler, forceFrameRate, initializeScheduler, initializeSchedulerForTesting } from "../scheduler/scheduler";
import { Subject, asapScheduler, filter, observeOn, skipUntil } from "rxjs";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { NGZONE_ON_STABLE, NOOP_ZONE_FLAGS, NZ_GLOBALS, NZ_ON_STABLE, NZ_POTENCIAL_ROOT_CMPS, NZ_ROOT_CMPS, NZ_SUSPENDED_VIEWS, NzFlags, NzGlobalsRef } from "../globals/globals";
import { internalDetectChanges } from "../change-detection/change-detection";
import { createApplication } from "@angular/platform-browser";
import { ENVIROMENT_PROVIDED } from "../assertions/assertions";

declare const __noop_zone_globals__: NzGlobalsRef;
declare const ngDevMode: any;
const nzGlobals = __noop_zone_globals__[NZ_GLOBALS];

forceFrameRate(60);

export function initialNoopZoneTestingEnviroment(disableScheduler = false): void {
  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.TestMode) {
    throw new Error('[initialNoopZoneTestingEnviroment(..)] Testing enviroment was not disposed!')
  }

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.ModuleImported) {
    throw new Error('[initialNoopZoneTestingEnviroment(..)] NoopZoneEnviromentModule detected! Test prevented!');
  }

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.StandaloneApp) {
    throw new Error('[initialNoopZoneTestingEnviroment(..)] Standalne enviroemnt enabled! Test prevented!');
  }

  nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.TestMode;
  if (disableScheduler) {
    nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.SchdulerDisabled;
    return;
  }
  initializeSchedulerForTesting();
}


export function disposeNoopZoneTestingEnviroment(): void {
  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchedulerInitilized) {
    deinitializeScheduler();
  }

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.TestMode) {
    nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.TestMode;
  }
  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) {
    nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.SchdulerDisabled;
  }
}

function bootstrapListener(componentRef: ComponentRef<any>): void {
  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) { return; }

  nzGlobals[NZ_ROOT_CMPS]!.push(componentRef.instance);

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.BootsrapScheduled) { return; }
  nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.BootsrapScheduled;
  setTimeout(afterBootsrapCallback);
}

function afterBootsrapCallback(): void {
  nzGlobals[NOOP_ZONE_FLAGS] ^= NzFlags.BootsrapScheduled;
  const rootComponents = nzGlobals[NZ_ROOT_CMPS]!;
  const potencialRootComponents = nzGlobals[NZ_POTENCIAL_ROOT_CMPS]!;
  const suspendedViews = nzGlobals[NZ_SUSPENDED_VIEWS]!;

  let count = 0

  for (let i = 0; i < rootComponents.length; i++) {
    if (potencialRootComponents.includes(rootComponents[i])) {
      count++
    }
  }

  if (count === rootComponents.length) {
    nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.BootsrapDone;
    for (let i = 0; i < suspendedViews.length; i++) {
      internalDetectChanges(suspendedViews[i][0], suspendedViews[i][1]);
    }

    nzGlobals[NZ_ROOT_CMPS] = null;
    nzGlobals[NZ_POTENCIAL_ROOT_CMPS] = null;
    nzGlobals[NZ_SUSPENDED_VIEWS] = null;

  } else {
    throw new Error('One of bootstraped components is not initialize! Please use [initializeComponent(this, priority?)] function in constructor!');
  }
}

export function patchNgNoopZoneForAngularCdk(): void {
  const zone = inject(NgZone);

  if ((nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) === NzFlags.Noop) {
    if (!(zone instanceof ɵNoopNgZone)) {
      throw new Error('Patching zone insatance for @angular/cdk package is allawed only for noop zone instance!');
    }

    const constructor = (zone as any).constructor  as { prototype: any }
    const zoneTrigger = new Subject<void>();

    let allaw = true;

    zoneTrigger.pipe(
      skipUntil(nzGlobals[NZ_ON_STABLE]),
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
  providers: [
    {
    provide: APP_BOOTSTRAP_LISTENER,
    multi: true,
    useValue: bootstrapListener
    },
    { provide: ENVIROMENT_PROVIDED, useValue: true }
  ]
})
export class NoopZoneEnviromentModule {
  constructor(ngZone: NgZone, @Inject(PLATFORM_ID) platformId: object, appRef: ApplicationRef) {
    if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.TestMode) {
      throw new Error('Importing NoopZoneEnviromentModule is forbidden when test mode is enabled!');
    }

    if (isPlatformServer(platformId)) {
      nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.ModuleImported;
      nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.SchdulerDisabled;
      ngZone.onStable.subscribe(nzGlobals[NGZONE_ON_STABLE]);
      return;
    }

    if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.StandaloneApp) {
      throw new Error('Importing NoopZoneEnviromentModule is forbidden when enviroment is enabled for standalone applications')
    }

    if (!(ngZone instanceof ɵNoopNgZone)) {
      throw new Error('Application bootstraped with incorrect configuration! provide { ngZone: \'noop\' }!');
    }

    nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.ModuleImported;
    nzGlobals[NZ_ROOT_CMPS] ??= [];
    nzGlobals[NZ_POTENCIAL_ROOT_CMPS] ??= [];
    nzGlobals[NZ_SUSPENDED_VIEWS] ??= [];


    initializeScheduler();

    appRef.onDestroy(() => deinitializeScheduler());
  }
}

const DEFAULT_NG_ZONE = new InjectionToken<NgZone>('DEFAULT_NG_ZONE');
const NOOP_NG_ZONE = new InjectionToken<NgZone>('NOOP_NG_ZONE');

function defaultNgZoneFactoryProvider(): () => NgZone {
  let ngZone: NgZone | null = null
  return () => {
    if (ngZone === null) {
      ngZone = new NgZone({
        enableLongStackTrace: typeof ngDevMode === 'undefined' ? false : !!ngDevMode,
        shouldCoalesceEventChangeDetection: false,
        shouldCoalesceRunChangeDetection: false,
      });
    }
    return ngZone;
  }
}

function ngZoneFactoryFn(): NgZone {
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return inject(DEFAULT_NG_ZONE)
  } else {
    return inject(NOOP_NG_ZONE)
  }
}

export function provideNoopZoneEnviroment(): EnvironmentProviders {

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.TestMode) {
    throw new Error('Providing enviroment for standalone applications is forbidden when test mode is enabled!');
  }

  return makeEnvironmentProviders([
    { provide: DEFAULT_NG_ZONE, useFactory: defaultNgZoneFactoryProvider() },
    { provide: NOOP_NG_ZONE, useClass: ɵNoopNgZone },
    { provide: NgZone, useFactory: ngZoneFactoryFn },
    { provide: ENVIROMENT_PROVIDED, useValue: true },
    { provide: APP_BOOTSTRAP_LISTENER, useValue: bootstrapListener, multi: true },
    {
      provide:  ENVIRONMENT_INITIALIZER,
      useFactory: () => {
        const platformId = inject(PLATFORM_ID)
        const appRef = inject(ApplicationRef)
        return () => {
          if (isPlatformServer(platformId)) {
            nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.StandaloneApp
            nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.SchdulerDisabled;
            return;
          }

          nzGlobals[NOOP_ZONE_FLAGS] |= NzFlags.StandaloneApp
          nzGlobals[NZ_ROOT_CMPS] ??= [];
          nzGlobals[NZ_POTENCIAL_ROOT_CMPS] ??= [];
          nzGlobals[NZ_SUSPENDED_VIEWS] ??= [];

          initializeScheduler();
          appRef.onDestroy(() => deinitializeScheduler());
        }
      },
      multi: true
    }
  ])
}
