import { isEnabled, onSchedulerDone, onStable } from './../enviroment/enviroment';
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { Priority } from "../scheduler/priority";
import { MonoTypeOperatorFunction, Observable, Observer, Subscription } from "rxjs";
import { cancelCallback, scheduleCallback } from "../scheduler/scheduler";
import { ReactSchedulerTask } from "../scheduler/scheduler-min-heap";
import { assertNoopZoneEnviroment, onSchedulerStart } from "../enviroment/enviroment";

@Injectable({ providedIn: 'root' })
export class NzScheduler {

  readonly onSchedulerStart: Observable<void>;
  readonly onSchedulerDone: Observable<void>;
  readonly onStable: Observable<void>;
  readonly enabled = isEnabled();

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    assertNoopZoneEnviroment();

    if (!this.enabled) {
      this.onSchedulerStart = new Observable();
      this.onSchedulerDone = new Observable();
      this.onStable = new Observable();
    } else {
      this.onSchedulerDone = onSchedulerDone;
      this.onSchedulerStart = onSchedulerStart;
      this.onStable = onStable;
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
            nextTask = scheduleCallback(priority, () => {
              observer.next(val)
              nextTask = null;
            })
          },
          complete: () => {
            completeTask = scheduleCallback(priority, () => {
              observer.complete();
              completeTask = null;
            })
          },
          error: (err) => {
            errorTask = scheduleCallback(priority, () => {
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
            nextTask = scheduleCallback(priority, () => {
              observer.next(val)
              nextTask = null;
            })
          },
          complete: () => {
            if (completeTask) {
              cancelCallback(completeTask);
              completeTask = null;
            }
            completeTask = scheduleCallback(priority, () => {
              observer.complete();
              completeTask = null;
            })
          },
          error: (err) => {
            if (errorTask) {
              cancelCallback(errorTask);
              errorTask = null;
            }
            errorTask = scheduleCallback(priority, () => {
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

        const task = scheduleCallback(priority, () => {
          subscription = observable.subscribe(observer);
        });

        return () => {
          cancelCallback(task);
          if (subscription) { subscription.unsubscribe(); }
        };
      });

      return newObservable;
    }
  }
}

export class FakeNzScheduler implements NzScheduler {

  readonly onSchedulerStart = new Observable<void>();
  readonly onSchedulerDone = new Observable<void>();
  readonly onStable = new Observable<void>();

  get enabled(): boolean { return isEnabled(); }

  constructor() {}

  observeOn<T>(priority: Priority): MonoTypeOperatorFunction<T> {
    return (observable) => observable;
  }
  switchOn<T>(priority: Priority): MonoTypeOperatorFunction<T> {
    return (observable) => observable
  }
  subscribeOn<T>(priority: Priority): MonoTypeOperatorFunction<T> {
    return (observable) => observable;
  }

}
