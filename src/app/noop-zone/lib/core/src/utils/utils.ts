import { EffectRef, Injector, Signal, effect } from "@angular/core";
import { ReactiveNode, SIGNAL, setActiveConsumer } from "@angular/core/primitives/signals";
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
    };
  })
}

export function fromSignal<T>(target: Signal<T>, injector: Injector): Observable<T> {
  const observers: Observer<T>[] = [];
  const node = target[SIGNAL] as ReactiveNode;
  let effectRef: EffectRef | null = null;
  let error: any
  let latestValue: any = target();

  return new Observable((observer) => {
    if (error) {
      observer.error(error);
      return;
    }

    try {
      observer.next(latestValue);
    } catch (e) {
      error = e
      observer.error(error);
      if (effectRef) { effectRef.destroy(); }
      effectRef = null;
      return;
    }

    observers.push(observer);

    if (effectRef === null) {
      let init = false
      const initialVersion = node.version;

      const prev = setActiveConsumer(null);
      try {

        effectRef = effect(() => {
          const currentValue = target();
          if (init) {
            try {
              for (let i = 0; i < observers.length; i++) {
                observers[i].next(currentValue);
              }
            } catch (e) {
              for (let i = 0; i < observers.length; i++) {
                observers[i].error(e);
              }
              error = e;
              if (effectRef) { effectRef.destroy(); }
              effectRef = null;
            }
          } else {
            init = true;
            if (initialVersion !== node.version) {
              try {
                for (let i = 0; i < observers.length; i++) {
                  observers[i].next(currentValue);
                }
              } catch (e) {
                for (let i = 0; i < observers.length; i++) {
                  observers[i].error(e);
                  error = e;
                  if (effectRef) {
                    effectRef.destroy();
                    effectRef = null;
                  }
                }
              }
            }
          }
        }, { injector, manualCleanup: true });

      } finally {
        setActiveConsumer(prev);
      }
    }

    return () => {
      const index = observers.indexOf(observer);
      observers.splice(index, 1);
      if (observers.length === 0) {
        if (effectRef) {
          effectRef.destroy()
        }
        effectRef = null;
      }
    };
  })
}
