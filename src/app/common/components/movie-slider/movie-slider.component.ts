import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, Pipe, PipeTransform, Renderer2, inject } from '@angular/core';
import { InPipeModule, NzForModule, initializeComponent } from '../../../noop-zone';
import { Observable } from 'rxjs';
import { MovieListStateItem, StateStatus } from '../../../models/models';
import { MatIconModule } from '@angular/material/icon';
import { YearFromDatePipe } from '../../pipes/year-from-date.pipe';
import { MovieCardImgSrcPipe } from '../../pipes/movie-card-img-src.pipe';
import { PosterSrcPipe, PosterSrcSetPipe } from '../../pipes/poster-src.pipe';
import { RouterModule } from '@angular/router';

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
export class MovieSliderComponent {
  cdRef = initializeComponent(this);
  hostElRef: ElementRef<HTMLElement> = inject(ElementRef);
  StateStatus = StateStatus
  range8 = _RANGE_8;

  @Input({ required: true }) movieListSource: Observable<readonly MovieListStateItem[]> = null!
  @Input({ required: true }) movieListStatusSource: Observable<StateStatus> = null!

}
