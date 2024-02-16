import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { UpcomingMoviesRef } from "./state";
import { clearUpcomingMovieListState, getUpcomingMovies, getUpcomingMoviesStart, upcomingMovieListStateError, updateUpcomingMovieListState } from "./actions";
import { catchError, exhaustMap, filter, map, of, takeUntil } from "rxjs";
import { MovieListStateItem, MovieListState } from "../../models/models";
import { Injectable } from "@angular/core";
import { NzScheduler, Priority } from "../../noop-zone";
import { movieListInitialState } from "../movie-list-initial-state";

@Injectable()
export class UpcomingMoviesEffects {

  getUpcomingMovies$ = createEffect(() => this._actions$.pipe(
    ofType(getUpcomingMovies),
    filter(() => this._upcomingMoviesRef.state.movies.length === 0),
    this._nzScheduler.switchOn(Priority.idle),
    map(() => getUpcomingMoviesStart())
  ));

  getUpcomingMoviesFromBackend = createEffect(() => this._actions$.pipe(
    ofType(getUpcomingMoviesStart),
    exhaustMap(() => this._moviesHttpService.getUpcomingMovies(1).pipe(
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

        return updateUpcomingMovieListState({ oldState: this._upcomingMoviesRef.state, newState })
      }),
      catchError((error) => of(upcomingMovieListStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearUpcomingMovieListState)))
    ))
  ))

  clearUpcomingMovieListState$ = createEffect(() => this._actions$.pipe(
    ofType(clearUpcomingMovieListState),
    filter(() => this._upcomingMoviesRef.state !== movieListInitialState),
    this._nzScheduler.switchOn(Priority.idle),
    map(() => updateUpcomingMovieListState({ oldState: this._upcomingMoviesRef.state, newState: movieListInitialState }))
  ))

  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _upcomingMoviesRef: UpcomingMoviesRef,
    private _nzScheduler: NzScheduler
  ) {}
}
