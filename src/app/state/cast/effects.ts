import { CastState } from './../../models/models';
import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { NzScheduler, Priority } from "../../noop-zone";
import { CastRef, initialCastState } from "./state";
import { castSateError, clearCastState, getCastForMovieById, getCastForMovieByIdStart, updateCastState } from "./actions";
import { catchError, filter, map, of, switchMap, takeUntil } from "rxjs";

@Injectable()
export class CastEffects {

  getCastForMovieById$ = createEffect(() => this._actions$.pipe(
    ofType(getCastForMovieById),
    filter(({ id }) => this._castRef.state.movieId !== id),
    map(({ id }) => getCastForMovieByIdStart({ id }))
  ));

  getCastForMovieFromBackend$ = createEffect(() => this._actions$.pipe(
    ofType(getCastForMovieByIdStart),
    this._nzScheduler.switchOn(Priority.idle),
    switchMap(({ id }) => this._moviesHttpService.getCreditsById(id).pipe(
      map(({ cast }) => {
        const persons: { id: number, name: string, profilePath: string }[] = [];

        for (let i = 0; i < cast.length; i++) {
          if (cast[i].profile_path) {
            persons.push({
              id: cast[i].id,
              name: cast[i].name,
              profilePath: cast[i].profile_path
            });
          }
        }

        const newState: CastState = {
          movieId: id,
          persons
        }

        return updateCastState({ oldState: this._castRef.state, newState });
      }),
      catchError((error) => of(castSateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearCastState)))
    )),
  ));

  clearCastState$ = createEffect(() => this._actions$.pipe(
    ofType(clearCastState),
    filter(() => this._castRef.state !== initialCastState),
    map(() => updateCastState({ oldState: this._castRef.state, newState: initialCastState }))
  ));

  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _nzScheduler: NzScheduler,
    private _castRef: CastRef
  ) {}
}
