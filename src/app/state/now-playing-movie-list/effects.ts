import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { clearNowPlayingMovieListState, getNowPlayingMovies, getNowPlayingMoviesStart, nowPlayingMovieListStateError, updateNowPlayingMovieListState } from "./actions";
import { NowPlaingMoviesRef } from "./state";
import { catchError, exhaustMap, filter, map, of, takeUntil } from "rxjs";
import { MovieListState, MovieListStateItem } from "../../models/models";
import { movieListInitialState } from "../movie-list-initial-state";
import { NzScheduler, Priority } from "../../noop-zone";

@Injectable()
export class NowPlaingMoviesEffects {

  getNowPlayingMovies$ = createEffect(() => this._actions$.pipe(
    ofType(getNowPlayingMovies),
    filter(() => this._nowPlayingMoviesRef.state.movies.length === 0),
    this._nzScheduler.switchOn(Priority.idle),
    map(() => getNowPlayingMoviesStart())
  ));

  getNowPlayingMoviesFromBackend$ = createEffect(() => this._actions$.pipe(
    ofType(getNowPlayingMoviesStart),
    exhaustMap(() => this._moviesHttpService.getNowPlayingMovies(1).pipe(
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

        return updateNowPlayingMovieListState({ oldState: this._nowPlayingMoviesRef.state, newState })
      }),
      catchError((error) => of(nowPlayingMovieListStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearNowPlayingMovieListState)))
    ))
  ));

  clearNowPlayingMovieListState$ = createEffect(() => this._actions$.pipe(
    ofType(clearNowPlayingMovieListState),
    filter(() => this._nowPlayingMoviesRef.state !== movieListInitialState),
    this._nzScheduler.switchOn(Priority.idle),
    map(() => updateNowPlayingMovieListState({ oldState: this._nowPlayingMoviesRef.state, newState: movieListInitialState }))
  ))

  constructor(private _actions$: Actions,
              private _moviesHttpService: MoviesHttpService,
              private _nowPlayingMoviesRef: NowPlaingMoviesRef,
              private _nzScheduler: NzScheduler) {}
}
