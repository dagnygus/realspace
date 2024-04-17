import { createAction, props } from "@ngrx/store";
import { MovieListState } from "../../models/abstract-models";

export const enum UpcomingMovieListActionNames {
  getUpcomingMovies = '[UpcomingMovieListActionNames] get now plaing movies',
  getUpcomingMoviesStart = '[UpcomingMovieListActionNames] get now plaing movie start',
  clearUpcomingMovieListState = '[UpcomingMovieListActionNames] clear state',
  UpcomingMovieListStateError = '[UpcomingMovieListActionNames] state error',
  updateUpcomingMovieListState = '[UpcomingMovieListActionNames] updateState'
}

export const getUpcomingMovies = createAction(UpcomingMovieListActionNames.getUpcomingMovies);
export const getUpcomingMoviesStart = createAction(UpcomingMovieListActionNames.getUpcomingMoviesStart);
export const clearUpcomingMovieListState = createAction(UpcomingMovieListActionNames.clearUpcomingMovieListState);
export const upcomingMovieListStateError = createAction(UpcomingMovieListActionNames.UpcomingMovieListStateError, props<{ error: any }>());
export const updateUpcomingMovieListState = createAction(UpcomingMovieListActionNames.updateUpcomingMovieListState, props<{ oldState: MovieListState, newState: MovieListState }>());
