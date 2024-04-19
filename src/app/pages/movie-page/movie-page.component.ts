import { StateStatus } from '../../models/abstract-models';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MoviePageViewModel } from './movie-page.vm';
import { InPipeModule, NzForModule, NzIfModule, NzLetModule, NzSwitchModule, initializeComponent } from '../../noop-zone';
import { BackdropSrcPipe, BackdropSrcSetPipe } from '../../common/pipes/backdrop-src.pipe';
import { YearFromDatePipe } from '../../common/pipes/year-from-date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Route, RouterModule } from '@angular/router';
import { MovieSliderComponent } from '../../common/components/movie-slider/movie-slider.component';
import { ProfileSrcPipe, ProfileSrcSetPipe } from '../../common/pipes/profile-src.pipe';
import { ImageSrcPipe } from '../../common/pipes/image-src.pipe';
import { PosterSrcPipe, PosterSrcSetPipe } from '../../common/pipes/poster-src.pipe';
import { HorizonlaScrollDirective } from '../../common/directives/horizontal-scroll.directive';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { CastEffects } from '../../state/cast/effects';
import { castReducer } from '../../state/cast/reducer';
import { RelatedMoviesEffects } from '../../state/related-movie-list/effects';
import { relatedMoviesReducer } from '../../state/related-movie-list/reducer';
import { SingleMovieEffects } from '../../state/single-movie/effects';
import { singleMovieReducer } from '../../state/single-movie/reducer';
import { VideosEffects } from '../../state/videos/effects';
import { videosReducer } from '../../state/videos/reducer';
import { getStateName } from '../../utils/utils';

const _RANGE_6 = [...Array(6).keys()];
const _RANGE_7 = [...Array(7).keys()];
const _RANGE_9 = [...Array(9).keys()];

@Component({
  selector: 'app-movie-page',
  standalone: true,
  imports: [
    BackdropSrcPipe,
    BackdropSrcSetPipe,
    ProfileSrcPipe,
    ProfileSrcSetPipe,
    PosterSrcPipe,
    PosterSrcSetPipe,
    YearFromDatePipe,
    HorizonlaScrollDirective,
    MatIconModule,
    NzLetModule,
    NzForModule,
    NzIfModule,
    InPipeModule,
    CommonModule,
    RouterModule,
    MovieSliderComponent,
    NzSwitchModule
  ],
  templateUrl: './movie-page.component.html',
  styleUrl: './movie-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ MoviePageViewModel ]
})
export class MoviePageComponent {
  cdRef = initializeComponent(this);
  vm = inject(MoviePageViewModel);
  StateStatus = StateStatus;
  range6 = _RANGE_6
  range7 = _RANGE_7;
  range9 = _RANGE_9
}

export const MOVIE_PAGE_ROUTES: Route[] = [{
  path: '',
  component: MoviePageComponent,
  providers: [
    provideState(getStateName('singleMovie'), singleMovieReducer),
    provideState(getStateName('videos'), videosReducer),
    provideState(getStateName('cast'), castReducer),
    provideState(getStateName('relatedMovies'), relatedMoviesReducer),
    provideEffects([
      SingleMovieEffects,
      VideosEffects,
      CastEffects,
      RelatedMoviesEffects
    ])
  ]
}];
