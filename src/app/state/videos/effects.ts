import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { VideosRef, initialVideosState } from "./state";
import { clearVideosState, getVideosForMovieById, getVideosForMovieByIdStart, updateVideosState, videosStateError } from "./actions";
import { catchError, filter, map, of, switchMap, takeUntil, tap } from "rxjs";
import { NzScheduler, Priority } from "../../noop-zone";
import { VideosState } from "../../models/models";
import { Platform } from "@angular/cdk/platform";
import { ServerDataCache } from "../../common/services/server-data-cache.service";

const VIDEOS_STATE_CACHE_KEY = 'realspace-videos-state';

@Injectable()
export class VideosEffects {

  getVideosById$ = createEffect(() => this._actions$.pipe(
    ofType(getVideosForMovieById),
    filter(({ id }) => this._videosRef.state.id !== id),
    map(({ id }) => getVideosForMovieByIdStart({ id }))
  ));

  getVideosByIdFromBackend$ = createEffect(() => this._actions$.pipe(
    ofType(getVideosForMovieByIdStart),
    this._nzScheduler.switchOn(Priority.idle),
    switchMap(({ id }) => this._moviesHttpService.getVideosForMovieById(id).pipe(
      map(({ results }) => {
        const links: string[] = [];

        for(let i = 0; i < results.length; i++) {
          links.push(`https://www.youtube.com/embed/${results[i].key}`)
        }

        const newState: VideosState = {
          id,
          links
        }

        return updateVideosState({ oldState: this._videosRef.state, newState });
      }),
      catchError((error) => of(videosStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearVideosState)))
    ))
  ));

  clearVideosState$ = createEffect(() => this._actions$.pipe(
    ofType(clearVideosState),
    filter(() => this._videosRef.state !== initialVideosState),
    map(() => updateVideosState({ oldState: this._videosRef.state, newState: initialVideosState }))
  ));

  cacheStateOnServer$ = createEffect(() => this._actions$.pipe(
    ofType(updateVideosState),
    filter(() => !this._platform.isBrowser),
    tap(({ newState }) => this._serverDataCache.setObject(VIDEOS_STATE_CACHE_KEY, newState))
  ), { dispatch: false });

  retrieveStateFromServerCacheInBrowser = createEffect(() => of(this._serverDataCache.getObject<VideosState>(VIDEOS_STATE_CACHE_KEY)!).pipe(
    filter((state) => this._platform.isBrowser && state !== null),
    map((newState) => updateVideosState({ oldState: this._videosRef.state, newState })),
    tap(() => this._serverDataCache.removeKey(VIDEOS_STATE_CACHE_KEY))
  ))

  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _videosRef: VideosRef,
    private _nzScheduler: NzScheduler,
    private _platform: Platform,
    private _serverDataCache: ServerDataCache
  ) {}
}
