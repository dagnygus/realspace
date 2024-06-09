import { InjectionToken, inject } from "@angular/core";
import { NOOP_ZONE_FLAGS, NZ_GLOBALS, NzFlags, NzGlobalsRef } from "../globals/globals";

declare const __noop_zone_globals__: NzGlobalsRef;
const nzGlobals = __noop_zone_globals__[NZ_GLOBALS];

export const ENVIROMENT_PROVIDED = new InjectionToken<boolean>('ENVIROMENT_PROVIDED', {
  providedIn: 'root',
  factory: () => {
    if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.TestMode) {
      return true
    }
    return false
  }
});

export function assertNoopZoneEnviroment(): void {
  if (inject(ENVIROMENT_PROVIDED)) {
    return;
  }
  throw new Error('INVALID ENVIROMENT!');
}
