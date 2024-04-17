import { ChangeDetectorRef, Injectable } from "@angular/core";
import { Priority } from "../scheduler/priority";
import { MonoTypeOperatorFunction, Observable, Observer, Subscription } from "rxjs";
import { cancelCallback, scheduleCallback } from "../scheduler/scheduler";
import { ReactSchedulerTask } from "../scheduler/scheduler-min-heap";
import { assertNoopZoneEnviroment } from "../enviroment/enviroment";
import { internalScheduleWork } from '../change-detection/change-detection';
import { NOOP_ZONE_FLAGS, NZ_GLOBALS, NZ_NOOP_VOID_FN, NZ_ON_DONE, NZ_ON_STABLE, NZ_ON_START, NZ_ON_UNSTABLE, NZ_WORK_DONE_LISTENERS, NzFlags, NzGlobals, NzGlobalsRef } from '../globals/globals';

declare const __noop_zone_globals__: NzGlobalsRef;
const nzGlobals = __noop_zone_globals__[NZ_GLOBALS];

@Injectable({ providedIn: 'root' })
export class NzScheduler {

  readonly onSchedulerStart: Observable<void>;
  readonly onSchedulerDone: Observable<void>;
  readonly onStable: Observable<void>;
  readonly onUnstable: Observable<void>;
  // readonly enabled = isEnabled();

  get workRunning(): boolean {
    return (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.WorkRunnig) === NzFlags.WorkRunnig;
  }

  get enabled(): boolean {
    return (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) !== NzFlags.SchdulerDisabled;
  }

  get disabled(): boolean {
    return (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) === NzFlags.SchdulerDisabled;
  }

  static get workRunning(): boolean {
    return (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.WorkRunnig) === NzFlags.WorkRunnig;
  }

  static get enabled(): boolean {
    return (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) !== NzFlags.SchdulerDisabled;
  }

  static get disabled(): boolean {
    return (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.SchdulerDisabled) === NzFlags.SchdulerDisabled;
  }

  constructor() {
    assertNoopZoneEnviroment();

    this.onSchedulerStart = nzGlobals[NZ_ON_START].asObservable();
    this.onSchedulerDone = nzGlobals[NZ_ON_DONE].asObservable();
    this.onStable = nzGlobals[NZ_ON_STABLE].asObservable();
    this.onUnstable = nzGlobals[NZ_ON_UNSTABLE].asObservable();

  }

  static onWorkDone(cb: () => void): () => void {
    if (nzGlobals[NOOP_ZONE_FLAGS] & NzFlags.WorkRunnig) {
      nzGlobals[NZ_WORK_DONE_LISTENERS].push(cb);
      return () => {
        const index = nzGlobals[NZ_WORK_DONE_LISTENERS].indexOf(cb);
        nzGlobals[NZ_WORK_DONE_LISTENERS].splice(index, 1);
      }
    } else {
      return nzGlobals[NZ_NOOP_VOID_FN];
    }
  }

  observeOn<T>(priority: Priority): MonoTypeOperatorFunction<T> {
    return (observable) => {

      if (!this.enabled) {
        return observable;
      }

      priority = Math.round(Math.max(1, Math.min(priority, 5)));

      const newObservable = new Observable<T>((observer) => {
        let nextTask: ReactSchedulerTask | null = null;
        let completeTask: ReactSchedulerTask | null = null;
        let errorTask: ReactSchedulerTask | null = null;

        const innserObserver: Observer<T> = {
          next: (val) => {
            nextTask = internalScheduleWork(priority, () => {
              observer.next(val);
              nextTask = null
            });
          },
          complete: () => {
            completeTask = internalScheduleWork(priority, () => {
              observer.complete();
              completeTask = null;
            });
          },
          error: (err) => {
            errorTask = internalScheduleWork(priority, () => {
              observer.error(err);
              errorTask = null;
            })
          }
        }

        const subscription = observable.subscribe(innserObserver);

        return () => {
          subscription.unsubscribe();
          if (nextTask) { cancelCallback(nextTask); }
          if (completeTask) { cancelCallback(completeTask); }
          if (errorTask) { cancelCallback(errorTask); }
        };
      });

      return newObservable;
    }
  }

  switchOn<T>(priority: Priority): MonoTypeOperatorFunction<T> {
    return (observable) => {
      if (!this.enabled) {
        return observable;
      }

      priority = Math.round(Math.max(1, Math.min(priority, 5)));

      const newObservable = new Observable<T>((observer) => {
        let nextTask: ReactSchedulerTask | null = null;
        let completeTask: ReactSchedulerTask | null = null;
        let errorTask: ReactSchedulerTask | null = null;

        const innserObserver: Observer<T> = {
          next: (val) => {
            if (nextTask) {
              cancelCallback(nextTask);
              nextTask = null;
            }
            nextTask = internalScheduleWork(priority, () => {
              observer.next(val);
              nextTask = null;
            })
          },
          complete: () => {
            if (completeTask) {
              cancelCallback(completeTask);
              completeTask = null;
            }
            completeTask = internalScheduleWork(priority, () => {
              observer.complete();
              completeTask = null;
            })
          },
          error: (err) => {
            if (errorTask) {
              cancelCallback(errorTask);
              errorTask = null;
            }
            errorTask = internalScheduleWork(priority, () => {
              observer.error(err);
              errorTask = null;
            })
          }
        }

        const subscription = observable.subscribe(innserObserver);

        return () => {
          subscription.unsubscribe();
          if (nextTask) { cancelCallback(nextTask); }
          if (completeTask) { cancelCallback(completeTask); }
          if (errorTask) { cancelCallback(errorTask); }
        };
      });

      return newObservable;
    }
  }

  subscribeOn<T>(priority: Priority): MonoTypeOperatorFunction<T> {
    return (observable) => {

      if (!this.enabled) {
        return observable;
      }

      priority = Math.round(Math.max(1, Math.min(priority, 5)));

      const newObservable = new Observable<T>((observer) => {
        let subscription: Subscription | null = null;
        let task: ReactSchedulerTask | null = null;

        task = internalScheduleWork(priority, () => {
          subscription = observable.subscribe(observer);
        });

        return () => {
          if (task) { cancelCallback(task); }
          if (subscription) { subscription.unsubscribe(); }
        };
      });

      return newObservable;
    }
  }

}
