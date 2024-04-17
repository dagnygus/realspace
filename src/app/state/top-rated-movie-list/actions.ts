import { createAction, props } from "@ngrx/store";
import { MovieListState } from "../../models/abstract-models";

export const enum TopRatedMovieListActionNames {
  getTopRatedMovies = '[TopRatedMovieListActionNames] get now plaing movies',
  getTopRatedMoviesStart = '[TopRatedMovieListActionNames] get now plaing movie start',
  clearTopRatedMovieListState = '[TopRatedMovieListActionNames] clear state',
  TopRatedMovieListStateError = '[TopRatedMovieListActionNames] state error',
  updateTopRatedMovieListState = '[TopRatedMovieListActionNames] updateState'
}

export const getTopRatedMovies = createAction(TopRatedMovieListActionNames.getTopRatedMovies);
export const getTopRatedMoviesStart = createAction(TopRatedMovieListActionNames.getTopRatedMoviesStart);
export const clearTopRatedMovieListState = createAction(TopRatedMovieListActionNames.clearTopRatedMovieListState);
export const topRatedListStateError = createAction(TopRatedMovieListActionNames.TopRatedMovieListStateError, props<{ error: any }>());
export const updateTopRatedMovieListState = createAction(TopRatedMovieListActionNames.updateTopRatedMovieListState, props<{ oldState: MovieListState, newState: MovieListState }>());
