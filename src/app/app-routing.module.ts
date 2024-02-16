import { NgModule, inject } from '@angular/core';
import { Route, Router, RouterModule, Routes, UrlSegment } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { GENRE_ID_REGEX, MOVIE_CATEGORIES, ROUTER_KING } from './utils/constants';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { provideState } from '@ngrx/store';
import { customMovieListReducer } from './state/custom-movie-list-state/reducer';
import { provideEffects } from '@ngrx/effects';
import { CustomMovieListEffects } from './state/custom-movie-list-state/effects';
import { singleMovieReducer } from './state/single-movie/reducer';
import { videosReducer } from './state/videos/reducer';
import { castReducer } from './state/cast/reducer';
import { relatedMoviesReducer } from './state/related-movie-list/reducer';
import { CastEffects } from './state/cast/effects';
import { RelatedMoviesEffects } from './state/related-movie-list/effects';
import { SingleMovieEffects } from './state/single-movie/effects';
import { VideosEffects } from './state/videos/effects';

const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    component: HomePageComponent
  },

  {
    path: ':movieListKind/:movieListParam',
    providers: [
      provideState('customMovieList', customMovieListReducer),
      provideEffects(CustomMovieListEffects)
    ],
    canMatch:  [
        (_: Route, segments: UrlSegment[]) => {
          if (ROUTER_KING.includes(segments[0].path)) {
            if (segments[0].path === 'genre' && GENRE_ID_REGEX.test(segments[1].path)) {
              return true;
            }
            if (segments[0].path === 'category' && MOVIE_CATEGORIES.includes(segments[1].path)) {
              return true
            }
            if (segments[0].path === 'search' && segments[1].path.length > 0) {
              return true
            }
          }
        return false
      }
    ],
    loadComponent: () => import('./pages/movie-list-page/movie-list-page.component').then((m) => m.MovieListPageComponent)
  },

  {
    path: 'movie/:movieId',
    providers: [
      provideState('singleMovie', singleMovieReducer),
      provideState('videos', videosReducer),
      provideState('cast', castReducer),
      provideState('relatedMovies', relatedMoviesReducer),
      provideEffects([
        SingleMovieEffects,
        VideosEffects,
        CastEffects,
        RelatedMoviesEffects
      ])
    ],
    loadComponent: () => import('./pages/movie-page/movie-page.component').then((m) => m.MoviePageComponent)
  },

  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
