import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { TopRatedMoviesRef } from "./state";
import { clearTopRatedMovieListState, getTopRatedMovies, getTopRatedMoviesStart, topRatedListStateError, updateTopRatedMovieListState } from "./actions";
import { catchError, exhaustMap, filter, map, of, repeat, switchMap, takeUntil, tap } from "rxjs";
import { MovieListState, MovieListStateItem } from "../../models/abstract-models";
import { NzScheduler, Priority } from "../../noop-zone";
import { movieListInitialState } from "../../models/object-model";
import { Platform } from "@angular/cdk/platform";
import { ServerDataCache } from "../../common/services/server-data-cache.service";

const TOP_RATED_MOVIES_STATE_CACHE_KEY = 'realspace-top-rated-state'

@Injectable({ providedIn: 'root' })
export class TopRatedMoviesEffects {

  getTopRagtedMovies$ = createEffect(() => this._actions$.pipe(
    ofType(getTopRatedMovies),
    filter(() => this._topRatedMoviesRef.state.movies.length === 0),
    this._nzScheduler.switchOn(Priority.idle),
    map(() => getTopRatedMoviesStart())
  ));

  getTopRatedMoviesFromBackend$ = createEffect(() => this._actions$.pipe(
    ofType(getTopRatedMoviesStart),
    exhaustMap(() => this._moviesHttpService.getTopRatedMovies(1).pipe(
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

        return updateTopRatedMovieListState({ oldState: this._topRatedMoviesRef.state, newState })
      }),
      catchError((error) => of(topRatedListStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearTopRatedMovieListState)))
    )),
  ));

  clearTopRatedMovieListState$ = createEffect(() => this._actions$.pipe(
    ofType(clearTopRatedMovieListState),
    filter(() => this._topRatedMoviesRef.state !== movieListInitialState),
    map(() => updateTopRatedMovieListState({ oldState: this._topRatedMoviesRef.state, newState: movieListInitialState }))
  ));

  cacheStateOnServer$ = createEffect(() => this._actions$.pipe(
    ofType(updateTopRatedMovieListState),
    filter(() => !this._platform.isBrowser),
    tap(({ newState }) => this._serverDataCache.setObject(TOP_RATED_MOVIES_STATE_CACHE_KEY, newState))
  ), { dispatch: false });

  retrieveStateFromServerCacheInBrowser$ = createEffect(() => of(this._serverDataCache.getObject<MovieListState>(TOP_RATED_MOVIES_STATE_CACHE_KEY)!).pipe(
    filter((state) => this._platform.isBrowser && state !== null),
    map((newState) => updateTopRatedMovieListState({ oldState: this._topRatedMoviesRef.state, newState })),
    tap(() => this._serverDataCache.removeKey(TOP_RATED_MOVIES_STATE_CACHE_KEY))
  ))

  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _topRatedMoviesRef: TopRatedMoviesRef,
    private _nzScheduler: NzScheduler,
    private _platform: Platform,
    private _serverDataCache: ServerDataCache
  ) {}
}
