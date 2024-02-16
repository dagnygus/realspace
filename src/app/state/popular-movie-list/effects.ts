import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { PopularMoviesRef } from "./state";
import { filter, map, exhaustMap, catchError, of, takeUntil } from "rxjs";
import { MovieListStateItem, MovieListState } from "../../models/models";
import { clearPopularMovieListState, getPopularMovies, getPopularMoviesStart, popularMoviesListStateError, updatePopularMovieListState } from "./actions";
import { NzScheduler, Priority } from "../../noop-zone";
import { movieListInitialState } from "../movie-list-initial-state";

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
  ))

  clearNowPlayingMovieListState$ = createEffect(() => this._actions$.pipe(
    ofType(clearPopularMovieListState),
    filter(() => this._popularMoviesRef.state !== movieListInitialState),
    this._nzScheduler.switchOn(Priority.idle),
    map(() => updatePopularMovieListState({ oldState: this._popularMoviesRef.state, newState: movieListInitialState }))
  ))


  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _popularMoviesRef: PopularMoviesRef,
    private _nzScheduler: NzScheduler
  ) {}
}


