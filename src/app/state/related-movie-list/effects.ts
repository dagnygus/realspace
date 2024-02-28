import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { RelatedMoviesRef } from "./state";
import { NzScheduler, Priority } from "../../noop-zone";
import { clearRelatedMovieListState, getRelatedMoviesById, getRelatedMoviesByIdStart, relatedMovieListStateError, updateRelatedMovieListState } from "./actions";
import { catchError, filter, map, of, switchMap, takeUntil, tap } from "rxjs";
import { isRelatedMovieListState } from "../../utils/type-checkers";
import { MovieListState, MovieListStateItem, RelatedMovieListState } from "../../models/models";
import { movieListInitialState } from "../movie-list-initial-state";
import { Platform } from "@angular/cdk/platform";
import { ServerDataCache } from "../../common/services/server-data-cache.service";

const RELATED_MOVIES_STATE_CACHE_KEY = 'realspace-related-movies';

@Injectable()
export class RelatedMoviesEffects {

  getRelatedMoviesById$ = createEffect(() => this._actions$.pipe(
    ofType(getRelatedMoviesById),
    filter(({ id }) => !(isRelatedMovieListState(this._relatedMoviessRef.state) && this._relatedMoviessRef.state.id === id)),
    map(({ id }) => getRelatedMoviesByIdStart({ id }))
  ));

  getRelatedMoviesFromBackend$ = createEffect(() => this._actions$.pipe(
    ofType(getRelatedMoviesByIdStart),
    this._nzScheduler.switchOn(Priority.idle),
    switchMap(({ id }) => this._moviesHttpService.getRelatedMovieListById(id).pipe(
      map(({ results }) => {

        const movies: MovieListStateItem[] = [];

        for (let i = 0; i < results.length; i++) {
          movies.push({
            id: results[i].id,
            title: results[i].title,
            posterPath: results[i].poster_path,
            voteAvarage: results[i].vote_average,
            realeaseDate: results[i].release_date
          });
        }

        const newState: RelatedMovieListState = {
          id,
          lastRequestedPage: 1,
          movies
        };

        return updateRelatedMovieListState({ oldState: this._relatedMoviessRef.state, newState });
      }),
      catchError((error) => of(relatedMovieListStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearRelatedMovieListState)))
    ))
  ));

  clearRelatedMovieListState$ = createEffect(() => this._actions$.pipe(
    ofType(clearRelatedMovieListState),
    filter(() => this._relatedMoviessRef.state !== movieListInitialState),
    map(() => updateRelatedMovieListState({ oldState: this._relatedMoviessRef.state, newState: movieListInitialState }))
  ));

  cacheStateOnServer$ = createEffect(() => this._actions$.pipe(
    ofType(updateRelatedMovieListState),
    filter(() => !this._platform.isBrowser),
    tap(({ newState }) => this._serverDataCache.setObject(RELATED_MOVIES_STATE_CACHE_KEY, newState))
  ), { dispatch: false });

  retrieveStateFromServerCacheInBrowser$ = createEffect(() => of(this._serverDataCache.getObject<MovieListState>(RELATED_MOVIES_STATE_CACHE_KEY)!).pipe(
    filter((state) => this._platform.isBrowser && state !== null),
    map((newState) => updateRelatedMovieListState({ oldState: this._relatedMoviessRef.state, newState })),
    tap(() => this._serverDataCache.removeKey(RELATED_MOVIES_STATE_CACHE_KEY))
  ))

  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _relatedMoviessRef: RelatedMoviesRef,
    private _nzScheduler: NzScheduler,
    private _platform: Platform,
    private _serverDataCache: ServerDataCache
  ) {}
}
