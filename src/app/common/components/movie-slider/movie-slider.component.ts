import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, Input, Pipe, PipeTransform, Renderer2, ViewChild, inject } from '@angular/core';
import { InPipeModule, NzForModule, initializeComponent } from '../../../noop-zone';
import { Observable, fromEvent } from 'rxjs';
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
  // hostElRef: ElementRef<HTMLElement> = inject(ElementRef);
  StateStatus = StateStatus
  range8 = _RANGE_8;
  destroyRef = inject(DestroyRef);
  platform = inject(Platform)

  @Input({ required: true }) movieListSource: Observable<readonly MovieListStateItem[]> = null!
  @Input({ required: true }) movieListStatusSource: Observable<StateStatus> = null!

  @ViewChild('container', { static: true }) containerElRef: ElementRef<HTMLElement> | null = null;

  // constructor(hostElRef: ElementRef<HTMLElement>,
  //             platform: Platform) {
  //   if (platform.isBrowser) {
  //     fromEvent<WheelEvent>(hostElRef.nativeElement, 'wheel').pipe(
  //       takeUntilDestroyed()
  //     ).subscribe((e) => {
  //       if (hostElRef.nativeElement.offsetWidth !== hostElRef.nativeElement.scrollWidth) {
  //         // console.log(e.deltaY);
  //         if (e.deltaY > 0) {
  //           console.log('add')
  //           hostElRef.nativeElement.scrollLeft += 1000;
  //           console
  //           e.preventDefault();
  //         } else {
  //           hostElRef.nativeElement.scrollLeft -= 100;
  //           e.preventDefault();
  //         }
  //       }
  //     })
  //   }
  // }

  ngAfterViewInit(): void {
    if (this.platform.isBrowser) {
      fromEvent<WheelEvent>(this.containerElRef!.nativeElement, 'wheel').pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((e) => {
        if (this.containerElRef!.nativeElement.offsetWidth !== this.containerElRef!.nativeElement.scrollWidth) {
          e.preventDefault();
          this.containerElRef!.nativeElement.scrollLeft += e.deltaY;
        }
      })
    }
  }

}
