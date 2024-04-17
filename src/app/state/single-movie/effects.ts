import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { SingleMovieRef, initialSingleMovieState } from "./state";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { clearSingleMovieState, getSignleMovieById, getSignleMovieByIdStart, singleMovieStateError, updateSingleMovieState } from "./actions";
import { catchError, filter, map, of, switchMap, takeUntil, tap } from "rxjs";
import { Genre, genreMap } from "../../models/object-model";
import { MovieState, MovieStateDetails } from "../../models/abstract-models";
import { NzScheduler, Priority } from "../../noop-zone";
import { Platform } from "@angular/cdk/platform";
import { ServerDataCache } from "../../common/services/server-data-cache.service";

const SINGLE_MOVIE_STATE_CACHE_KEY = 'realspace-single-movie-state';

@Injectable()
export class SingleMovieEffects {

  getMovieById$ = createEffect(() => this._actions$.pipe(
    ofType(getSignleMovieById),
    filter(({ id }) => this._signleMovieRef.state.details?.id !== id),
    map(({ id }) => getSignleMovieByIdStart({ id }))
  ));

  getMovieByIdFromBackend$ = createEffect(() => this._actions$.pipe(
    ofType(getSignleMovieByIdStart),
    this._nzScheduler.switchOn(Priority.idle),
    switchMap(({ id }) => this._moviesHttpService.getMovieById(id).pipe(
      map(({ id, title, overview, tagline, runtime, release_date, vote_average, backdrop_path, poster_path, genres }) => {
        const genreArr: string[] = [];

        for(let i = 0; i < genres.length; i++) {
          genreArr.push(genreMap.get(genres[i].id)!)
        }

        const details: MovieStateDetails = {
          id,
          title,
          overview,
          tagline,
          runtime,
          releaseDate: release_date,
          voteAverage: vote_average,
          backdropPath: backdrop_path,
          posterPath: poster_path,
          genres: genreArr
        }

        const newState: MovieState = {
          details
        }

        return updateSingleMovieState({ oldState: this._signleMovieRef.state, newState })
      }),
      catchError((error) => of(singleMovieStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearSingleMovieState)))
    ))
  ));

  clearMovieState$ = createEffect(() => this._actions$.pipe(
    ofType(clearSingleMovieState),
    filter(() => this._signleMovieRef.state !== initialSingleMovieState),
    map(() => updateSingleMovieState({ oldState: this._signleMovieRef.state, newState: initialSingleMovieState }))
  ));

  cacheStateOnServer$ = createEffect(() => this._actions$.pipe(
    ofType(updateSingleMovieState),
    filter(() => !this._platform.isBrowser),
    tap(({ newState }) => this._serverDataCache.setObject(SINGLE_MOVIE_STATE_CACHE_KEY, newState))
  ), { dispatch: false });

  retrieveStateFromServerCacheInBrowser = createEffect(() => of(this._serverDataCache.getObject<MovieState>(SINGLE_MOVIE_STATE_CACHE_KEY)!).pipe(
    filter((state) => this._platform.isBrowser && state !== null),
    map((newState) => updateSingleMovieState({ oldState: this._signleMovieRef.state, newState })),
    tap(() => this._serverDataCache.removeKey(SINGLE_MOVIE_STATE_CACHE_KEY))
  ));

  constructor(
    private _actions$: Actions,
    private _signleMovieRef: SingleMovieRef,
    private _moviesHttpService: MoviesHttpService,
    private _nzScheduler: NzScheduler,
    private _platform: Platform,
    private _serverDataCache: ServerDataCache
  ) {}
}
