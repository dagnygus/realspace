import { createAction, props } from "@ngrx/store";
import { MovieListState } from "../../models/models";

export const enum NowPlayingMovieListActionNames {
  getNowPlayingMovies = '[NowPlayingMovieListState] get now plaing movies',
  getNowPlayingMoviesStart = '[NowPlayingMovieListState] get now plaing movie start',
  clearNowPlayignMovieListState = '[NowPlayingMovieListState] clear state',
  nowPlayingMovieListStateError = '[NowPlayingMovieListState] state error',
  updateNowPlaingMovieListState = '[NowPlayingMovieListState] updateState'
}

export const getNowPlayingMovies = createAction(NowPlayingMovieListActionNames.getNowPlayingMovies);
export const getNowPlayingMoviesStart = createAction(NowPlayingMovieListActionNames.getNowPlayingMoviesStart);
export const clearNowPlayingMovieListState = createAction(NowPlayingMovieListActionNames.clearNowPlayignMovieListState);
export const nowPlayingMovieListStateError = createAction(NowPlayingMovieListActionNames.nowPlayingMovieListStateError, props<{ error: any }>());
export const updateNowPlayingMovieListState = createAction(NowPlayingMovieListActionNames.updateNowPlaingMovieListState, props<{ oldState: MovieListState, newState: MovieListState }>());
