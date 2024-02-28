import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { PopularMoviesRef } from "./state";
import { filter, map, exhaustMap, catchError, of, takeUntil, tap, take } from "rxjs";
import { MovieListStateItem, MovieListState } from "../../models/models";
import { clearPopularMovieListState, getPopularMovies, getPopularMoviesStart, popularMoviesListStateError, updatePopularMovieListState } from "./actions";
import { NzScheduler, Priority } from "../../noop-zone";
import { movieListInitialState } from "../movie-list-initial-state";
import { Platform } from "@angular/cdk/platform";
import { ServerDataCache } from "../../common/services/server-data-cache.service";

const POPULAR_MOVIES_STATE_CACHE_KEY = 'realspace-popular-movies'

@Injectable({ providedIn: 'root' })
export class PopularMoviesEffects {

  getPopularMovies$ = createEffect(() => this._actions$.pipe(
    ofType(getPopularMovies),
    filter(() => this._popularMoviesRef.state.movies.length === 0),
    this._nzScheduler.switchOn(Priority.idle),
    map(() => getPopularMoviesStart())
  ));

  getPopularMoviesFromBackend$ = createEffect(() => this._actions$.pipe(
    ofType(getPopularMoviesStart),
    exhaustMap(() => this._moviesHttpService.getPopularMovies(1).pipe(
      map((result) => {

        const movies = result.results.map<MovieListStateItem>((item) => ({
          id: item.id,
          title: item.title,
          realeaseDate: item.release_date,
          posterPath: item.poster_path,
          voteAvarage: item.vote_average
        }));

        const newState: MovieListState = {
          lastRequestedPage: 1,
          movies
        };

        return updatePopularMovieListState({ oldState: this._popularMoviesRef.state, newState })
      }),
      catchError((error) => of(popularMoviesListStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearPopularMovieListState)))
    ))
  ));

  clearNowPlayingMovieListState$ = createEffect(() => this._actions$.pipe(
    ofType(clearPopularMovieListState),
    filter(() => this._popularMoviesRef.state !== movieListInitialState),
    this._nzScheduler.switchOn(Priority.idle),
    map(() => updatePopularMovieListState({ oldState: this._popularMoviesRef.state, newState: movieListInitialState }))
  ));

  cacheStateOnServer$ = createEffect(() => this._actions$.pipe(
    ofType(updatePopularMovieListState),
    filter(() => !this._platform.isBrowser),
    tap(({ newState }) => this._serverDataCache.setObject(POPULAR_MOVIES_STATE_CACHE_KEY, newState))
  ), { dispatch: false });

  retrieveStateFromServerCacheInBrowser$ = createEffect(() => of(this._serverDataCache.getObject<MovieListState>(POPULAR_MOVIES_STATE_CACHE_KEY)!).pipe(
    filter((state) => this._platform.isBrowser && state !== null),
    map((newState) => updatePopularMovieListState({ oldState: this._popularMoviesRef.state, newState })),
    tap(() => this._serverDataCache.removeKey(POPULAR_MOVIES_STATE_CACHE_KEY))
  ));

  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _popularMoviesRef: PopularMoviesRef,
    private _nzScheduler: NzScheduler,
    private _platform: Platform,
    private _serverDataCache: ServerDataCache
  ) {}
}


