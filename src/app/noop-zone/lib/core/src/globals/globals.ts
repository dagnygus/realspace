import { ChangeDetectorRef, DestroyRef, Type } from "@angular/core";
import { Subject } from "rxjs";
import { Priority } from "../scheduler/priority";

let isServer = false;

export const NZ_GLOBALS = Symbol('NZ_GLOBALS');

export const NOOP_ZONE_FLAGS = 0;
export const NZ_POTENCIAL_ROOT_CMPS = 1;
export const NZ_ROOT_CMPS = 2;
export const NZ_SUSPENDED_VIEWS = 3;
// export const NZ_CMP_ON_INIT_LISTENERS = 4;
export const NZ_LAST_USED_VIEW = 4;
export const NZ_WORK_DONE_LISTENERS = 5;
export const NZ_ON_START = 6;
export const NZ_ON_DONE = 7;
export const NZ_ON_STABLE = 8;
export const NZ_ON_UNSTABLE = 9;
export const NGZONE_ON_STABLE = 10;
export const NZ_NOOP_VOID_FN = 11;
export const NZ_NOOP_FN_WITH_CB = 12;

declare const process: any
declare const global: any
declare const window: any;
declare const globalThis: any;
declare const __noop_zone_globals__: any

export interface NzGlobals {
  [NOOP_ZONE_FLAGS]: number;
  [NZ_POTENCIAL_ROOT_CMPS]: object[] | null;
  [NZ_ROOT_CMPS]: object[] | null;
  [NZ_SUSPENDED_VIEWS]: [ChangeDetectorRef, Priority][] | null;
  // [NZ_CMP_ON_INIT_LISTENERS]: WeakMap<object, (() => void)[]>;
  [NZ_LAST_USED_VIEW]: ChangeDetectorRef | null;
  [NZ_WORK_DONE_LISTENERS]: (() => void)[];
  [NZ_ON_START]: Subject<void>;
  [NZ_ON_DONE]: Subject<void>;
  [NZ_ON_STABLE]: Subject<void>;
  [NZ_ON_UNSTABLE]: Subject<void>;
  [NGZONE_ON_STABLE]: Subject<void>;
  [NZ_NOOP_VOID_FN]: () => void;
  [NZ_NOOP_FN_WITH_CB]: (cb: () => void) => void;
}

export interface NzGlobalsRef {
  [NZ_GLOBALS]: NzGlobals
}

export const enum NzFlags {
  Noop =                 0b00000000,
  EnviromentProvided =   0b00000001,
  TestMode =             0b00000010,
  SchedulerInitilized =  0b00000100,
  BootsrapScheduled =    0b00001000,
  BootsrapDone =         0b00010000,
  WorkRunnig =           0b00100000,
  SchdulerStable =       0b01000000,
  SchdulerDisabled =     0b10000000,

  _SchdulerStableInit =  0b01000100,

  __ContinueCmpInit =    0b00010010,
  __ValidEnv =           0b00000011
}

const _global = (function () {
  if (typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node != null) {
    isServer = true
    return global || globalThis;
  }

  if (typeof window === 'object' && typeof document === 'object') {
    return window;
  }

  throw new Error('Unknown JS runtime!');
})();

const _nzGlobals = [
  NzFlags.SchdulerStable,
  null,
  null,
  null,
  null,
  [],
  new Subject(),
  new Subject(),
  new Subject(),
  new Subject(),
  new Subject(),
  () => {},
  (cb: () => void) => { cb(); },
]



Object.defineProperty(_global, '__noop_zone_globals__', {
  writable: isServer,
  value: {
    [NZ_GLOBALS]: _nzGlobals
  }
});

