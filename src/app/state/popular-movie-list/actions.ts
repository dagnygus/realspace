import { createAction, props } from "@ngrx/store";
import { MovieListState } from "../../models/abstract-models";

export const enum PopularMovieListActionNames {
  getPopularMovies = '[PopularMovieListActionNames] get now plaing movies',
  getPopularMoviesStart = '[PopularMovieListActionNames] get now plaing movie start',
  clearPopularMovieListState = '[PopularMovieListActionNames] clear state',
  PopularMovieListStateError = '[PopularMovieListActionNames] state error',
  updatePopularMovieListState = '[PopularMovieListActionNames] updateState'
}

export const getPopularMovies = createAction(PopularMovieListActionNames.getPopularMovies);
export const getPopularMoviesStart = createAction(PopularMovieListActionNames.getPopularMoviesStart);
export const clearPopularMovieListState = createAction(PopularMovieListActionNames.clearPopularMovieListState);
export const popularMoviesListStateError = createAction(PopularMovieListActionNames.PopularMovieListStateError, props<{ error: any }>());
export const updatePopularMovieListState = createAction(PopularMovieListActionNames.updatePopularMovieListState, props<{ oldState: MovieListState, newState: MovieListState }>());
