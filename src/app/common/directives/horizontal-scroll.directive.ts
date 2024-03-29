import { Platform } from "@angular/cdk/platform";
import { Directive, ElementRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime, filter, fromEvent, merge, switchMap, take, takeUntil } from "rxjs";

@Directive({
  selector: '[horizontalScroll]',
  standalone: true,
})
export class HorizonlaScrollDirective {
  constructor(
    hostElRef: ElementRef<HTMLElement>,
    platform: Platform
  ) {
    if (platform.isBrowser) {
      const mouseEnter$ = fromEvent(hostElRef.nativeElement, 'mouseenter');
      const mouseLeave$ = fromEvent(hostElRef.nativeElement, 'mouseleave');
      const wheel$ = fromEvent<WheelEvent>(hostElRef.nativeElement, 'wheel');

      let mouseover = false;

      mouseEnter$.pipe(
        takeUntilDestroyed()
      ).subscribe(() => mouseover = true);

      mouseLeave$.pipe(
        takeUntilDestroyed()
      ).subscribe(() => mouseover = false);

      merge(mouseEnter$, wheel$).pipe(
        debounceTime(500),
        filter(() => mouseover),
        switchMap(() => wheel$.pipe(
          takeUntil(mouseLeave$.pipe(take(1))),
        ))
      ).pipe(
        takeUntilDestroyed()
      ).subscribe((e) => {
        if (hostElRef.nativeElement.offsetWidth !== hostElRef.nativeElement.scrollWidth) {
          e.preventDefault();
          hostElRef.nativeElement.scrollLeft += e.deltaY;
        }
      });
    }
  }
}
