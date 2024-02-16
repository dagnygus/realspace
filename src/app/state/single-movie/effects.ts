import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { SingleMovieRef, initialSingleMovieState } from "./state";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { clearSingleMovieState, getSignleMovieById, getSignleMovieByIdStart, singleMovieStateError, updateSingleMovieState } from "./actions";
import { catchError, filter, map, of, switchMap, takeUntil } from "rxjs";
import { Genre, genreMap } from "../../utils/genres";
import { MovieState, MovieStateDetails } from "../../models/models";
import { NzScheduler, Priority } from "../../noop-zone";

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

  constructor(
    private _actions$: Actions,
    private _signleMovieRef: SingleMovieRef,
    private _moviesHttpService: MoviesHttpService,
    private _nzScheduler: NzScheduler
  ) {}
}
