import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, Input, OnDestroy, Pipe, PipeTransform, Renderer2, ViewChild, inject } from '@angular/core';
import { InPipeModule, NzForModule, initializeComponent } from '../../../noop-zone';
import { Observable, Subject, debounceTime, filter, fromEvent, merge, switchMap, take, takeUntil } from 'rxjs';
import { MovieListStateItem, StateStatus } from '../../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { YearFromDatePipe } from '../../pipes/year-from-date.pipe';
import { MovieCardImgSrcPipe } from '../../pipes/movie-card-img-src.pipe';
import { PosterSrcPipe, PosterSrcSetPipe } from '../../pipes/poster-src.pipe';
import { RouterModule } from '@angular/router';
import { Platform } from '@angular/cdk/platform';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const _RANGE_8 = [...Array(8).keys()];

@Pipe({ name: 'isEmptyOrError', standalone: true })
export class IsEmptyOrErrorStatus implements PipeTransform {
  transform(status: StateStatus | null | undefined) {
    return status === StateStatus.empty || status === StateStatus.error
  }
}

@Component({
  selector: 'app-movie-slider',
  standalone: true,
  imports: [
    InPipeModule,
    NzForModule,
    MatIconModule,
    YearFromDatePipe,
    MovieCardImgSrcPipe,
    PosterSrcPipe,
    PosterSrcSetPipe,
    RouterModule,
    IsEmptyOrErrorStatus
  ],
  templateUrl: './movie-slider.component.html',
  styleUrl: './movie-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieSliderComponent implements AfterViewInit {
  cdRef = initializeComponent(this);
  StateStatus = StateStatus
  range8 = _RANGE_8;
  destroyRef = inject(DestroyRef);
  platform = inject(Platform);

  @Input({ required: true }) movieListSource: Observable<readonly MovieListStateItem[]> = null!
  @Input({ required: true }) movieListStatusSource: Observable<StateStatus> = null!

  @ViewChild('container', { static: true }) containerElRef: ElementRef<HTMLElement> | null = null;

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      const mouseEnter$ = fromEvent(this.containerElRef!.nativeElement, 'mouseenter');
      const mouseLeave$ = fromEvent(this.containerElRef!.nativeElement, 'mouseleave');
      const wheel$ = fromEvent<WheelEvent>(this.containerElRef!.nativeElement, 'wheel');

      let mouseover = false;

      mouseEnter$.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => mouseover = true);

      mouseLeave$.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => mouseover = false);

      merge(mouseEnter$, wheel$).pipe(
        debounceTime(500),
        filter(() => mouseover),
        switchMap(() => wheel$.pipe(
          takeUntil(mouseLeave$.pipe(take(1))),
        ))
      ).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((e) => {
        if (this.containerElRef!.nativeElement.offsetWidth !== this.containerElRef!.nativeElement.scrollWidth) {
          e.preventDefault();
          this.containerElRef!.nativeElement.scrollLeft += e.deltaY;
        }
      });
    }

  }

}
