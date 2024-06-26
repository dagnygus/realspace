import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { asyncScheduler, subscribeOn } from 'rxjs';
import { InPipeModule, NzClassModule, NzForModule, NzIfModule, NzLetModule, Priority, initializeComponent } from '../../noop-zone';
import { YearFromDatePipe } from '../../common/pipes/year-from-date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MovieListPageViewModel } from './movie-list-page.vm';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MovieCardImgSrcPipe } from '../../common/pipes/movie-card-img-src.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PosterSrcPipe, PosterSrcSetPipe } from '../../common/pipes/poster-src.pipe';
import { Route, RouterModule } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { CustomMovieListEffects } from '../../state/custom-movie-list-state/effects';
import { customMovieListReducer } from '../../state/custom-movie-list-state/reducer';
import { getStateName } from '../../utils/utils';

const _RANGE_16 = [...Array(16).keys()];


@Component({
  selector: 'app-movie-list-page',
  standalone: true,
  imports: [
    NzForModule,
    NzLetModule,
    NzIfModule,
    NzClassModule,
    InPipeModule,
    YearFromDatePipe,
    MatIconModule,
    MovieCardImgSrcPipe,
    PosterSrcPipe,
    PosterSrcSetPipe,
    RouterModule,
  ],
  templateUrl: './movie-list-page.component.html',
  styleUrl: './movie-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ MovieListPageViewModel ]
})
export class MovieListPageComponent {
  cdRef = initializeComponent(this);
  vm = inject(MovieListPageViewModel);
  Priority = Priority;
  range16 = _RANGE_16

  constructor(scrollable: CdkScrollable) {

    scrollable.elementScrolled().pipe(
      subscribeOn(asyncScheduler),
      takeUntilDestroyed()
    ).subscribe(() => {

      const element = scrollable.getElementRef().nativeElement;

      if (Math.ceil(element.scrollTop) > Math.ceil(element.scrollHeight - element.offsetHeight) - 200) {
        this.vm.extendMovieListState();
      }

    });
  }

}

export const MOVIE_LIST_PAGE_ROUTES: Route[] = [{
  path: '',
  component: MovieListPageComponent,
  providers: [
    provideState(getStateName('customMovieList'), customMovieListReducer),
    provideEffects(CustomMovieListEffects)
  ]
}]
