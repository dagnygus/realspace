import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { VideosRef, initialVideosState } from "./state";
import { clearVideosState, getVideosForMovieById, getVideosForMovieByIdStart, updateVideosState, videosStateError } from "./actions";
import { catchError, filter, map, of, switchMap, takeUntil } from "rxjs";
import { NzScheduler, Priority } from "../../noop-zone";
import { VideosState } from "../../models/models";

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

  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _videosRef: VideosRef,
    private _nzScheduler: NzScheduler
  ) {}
}
