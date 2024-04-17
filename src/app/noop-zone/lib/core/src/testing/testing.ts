import { Observable, asyncScheduler, firstValueFrom, merge, observeOn } from "rxjs";
import { getTaskQueue } from "../scheduler/scheduler";
import { NOOP_ZONE_FLAGS, NZ_GLOBALS, NZ_ON_DONE, NZ_ON_STABLE, NzFlags, NzGlobalsRef } from "../globals/globals";

declare const __noop_zone_globals__: NzGlobalsRef;
const nzGlobals = __noop_zone_globals__[NZ_GLOBALS];

export async function waitUntilAllWorkDone(): Promise<void> {

  if ((nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.TestMode ) === NzFlags.Noop) {
    throw new Error('[waitUntilAllWorkDone()] This function can be used only in testing enviroment!');
  }

  if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.ModuleImported) {
    throw new Error('[waitUntilAllWorkDone()] NoopZoneEnviromentModule detected! Test prevented!');
  }


  const taskQueue = getTaskQueue();

  if (!taskQueue.length) {

    const timeoutSource = new Observable((observer) => {
      setTimeout(() => {
        observer.next();
        observer.complete();
      }, 50)
    })

    await firstValueFrom(merge(
      nzGlobals[NZ_ON_DONE],
      timeoutSource
    ))
  }

  if(taskQueue.length) {
    await firstValueFrom(nzGlobals[NZ_ON_STABLE].pipe(observeOn(asyncScheduler)))
  }

}
