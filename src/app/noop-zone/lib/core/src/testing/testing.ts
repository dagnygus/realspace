import { Observable, Subject, asapScheduler, asyncScheduler, delay, firstValueFrom, merge, observeOn, take } from "rxjs";
import { isNoopZoneModuleImported, isNoopZoneTestingEnviroment, onDoneSubject, onStableSubject, onStartSubject } from "../enviroment/enviroment";
import { Priority } from "../scheduler/priority";
import { getTaskQueue, scheduleCallback } from "../scheduler/scheduler";
import { pop } from "../scheduler/scheduler-min-heap";


export async function waitUntilSchedulingDone(): Promise<void> {

  if (!isNoopZoneTestingEnviroment()) {
    throw new Error('[waitUntilSchedulingDone()] This function can be used only in testing enviroment!');
  }

  if (isNoopZoneModuleImported()) {
    throw new Error('[flushScheduler()] NoopZoneEnviromentModule detected! Test prevented!');
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
      onStartSubject,
      timeoutSource
    ))
  }

  while(taskQueue.length) {
    await firstValueFrom(onStableSubject.pipe(observeOn(asyncScheduler)))
  }

}

export function flushScheduler(): void {

  if (!isNoopZoneTestingEnviroment()) {
    throw new Error('[waitUntilSchedulingDone()] This function can be used only in testing enviroment!');
  }

  if (isNoopZoneModuleImported()) {
    throw new Error('[flushScheduler()] NoopZoneEnviromentModule detected! Test prevented!');
  }

  const taskQueue = getTaskQueue();

  let task = pop(taskQueue);

  onStartSubject.next();
  while (task) {
    const callback = task.callback;
    if (callback) { callback(); }
    task = pop(taskQueue);
  }
  onDoneSubject.next();

  if (taskQueue.length > 0) {
    flushScheduler();
  } else {
    onStableSubject.next();
  }

}
