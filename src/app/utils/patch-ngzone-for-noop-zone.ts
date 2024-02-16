import { inject, NgZone } from "@angular/core";
import { Subject, skipUntil, filter, observeOn, asapScheduler } from "rxjs";
import { onStable } from "../noop-zone";

export function patchNgZoneForAngularMaterial(): void {
  const zone = inject(NgZone);
  const constructor = (zone as any).constructor  as { prototype: any }
  const zoneTrigger = new Subject<void>();

  let allaw = true;

  zoneTrigger.pipe(
    skipUntil(onStable),
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
    return originalRun.call(this, cb)
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
