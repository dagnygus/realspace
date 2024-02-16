import { Observable, Observer, Subscribable } from "rxjs";

export function isSubscribable<T = any>(target: any): target is Subscribable<T> {
  return target != null && typeof target === 'object' && typeof (target as Subscribable<any>).subscribe === 'function';
}

export function isPromiseLike<T = any>(target: any): target is PromiseLike<T> {
  return target != null && typeof target === 'object' && typeof (target as PromiseLike<any>).then === 'function';
}

export function fromSubscribable<T = any>(target: Subscribable<T>): Observable<T> {
  if (target instanceof Observable) {
    return target;
  }

  return new Observable((observer) => {
    const subscription = target.subscribe(observer);
    return subscription;
  })
}

export function fromPromiseLike<T>(target: PromiseLike<T>): Observable<T> {
  let resolved = false;
  let rejected = false;
  let unsubscribed = false;
  let latestValue: any;
  let latestErr: any;

  return new Observable((observer) => {

    const observers: Observer<T>[] = [];

    if (resolved) {
      observer.next(latestValue);
      observer.complete();
      return;
    } else {
      observers.push(observer);
    }

    if (rejected) {
      observer.error(latestErr);
      return
    }

    target.then(
      (value) => {
        resolved = true;
        latestValue = value
        for (let i = 0; i < observers.length; i++) {
          observers[i].next(value);
        }
      },
      (err) => {
        rejected = true;
        latestErr = err;
        for (let i = 0; i < observers.length; i++) {
          observers[i].error(err);
        }
      }
    );

    return () => {
      const index = observers.indexOf(observer);
      observers.splice(index, 1);
    }
  })
}
