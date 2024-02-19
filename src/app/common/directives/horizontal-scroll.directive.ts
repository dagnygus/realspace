import { Platform } from "@angular/cdk/platform";
import { Directive, ElementRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { fromEvent } from "rxjs";

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
      fromEvent<WheelEvent>(hostElRef.nativeElement, 'wheel').pipe(
        takeUntilDestroyed()
      ).subscribe((e) => {
        if (hostElRef.nativeElement.offsetWidth !== hostElRef.nativeElement.scrollWidth) {
          e.preventDefault();
          hostElRef.nativeElement.scrollLeft += e.deltaY;
        }
      })
    }
  }
}
