import { MonoTypeOperatorFunction, Observable, Observer } from "rxjs";
import { Priority } from "../scheduler/priority";
import { ReactSchedulerTask } from "../scheduler/scheduler-min-heap";
import { cancelCallback, scheduleCallback } from "../scheduler/scheduler";

export function withConcurrentScheduler<T>(priority: Priority): MonoTypeOperatorFunction<T> {
  return function (observable) {

    let nextTask: ReactSchedulerTask | null;
    let completeTask: ReactSchedulerTask | null;
    let errorTask: ReactSchedulerTask | null;
    return new Observable((observer) => {

      const innerObserver: Observer<T> = {
        next(v) {
          if (nextTask) {
            cancelCallback(nextTask);
          }
           nextTask = scheduleCallback(priority, function() {
            observer.next(v);
            nextTask = null;
          })
        },
        complete() {
          completeTask = scheduleCallback(priority, function() {
            observer.complete();
          })
        },
        error() {
          errorTask = scheduleCallback(priority, function() {
            observer.error();
          })
        }
      };

      const subscrition = observable.subscribe(innerObserver);

      return function() {
        subscrition.unsubscribe();
        if (nextTask) { cancelCallback(nextTask); }
        if (completeTask) { cancelCallback(completeTask); }
        if (errorTask) { cancelCallback(errorTask); }
      }
    })
  }
}
