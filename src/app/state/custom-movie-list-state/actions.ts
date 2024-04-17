import { createAction, props } from "@ngrx/store";
import { Genre } from "../../models/object-model";
import { MovieCategory, MovieListState } from "../../models/abstract-models";

export const enum CustomMovieListActionNames {
  replaceOrExtendMovieListByGenre = '[CustomMovieListActionNames] replace or extend movies by genre',
  replaceMovieListByGenre = '[CustomMovieListActionNames] replace movies by genre',
  extendMovieListByGenre = '[CustomMovieListActionNames] extend movies by genre',
  replaceOrExtendMovieListByCategory = '[CustomMovieListActionNames] replace or extend movies by category',
  replaceMovieListByCategory = '[CustomMovieListActionNames] replace movies by category',
  extendMovieListByCategory = '[CustomMovieListActionNames] extend movies by category',
  searchMoviesWithKey = '[CustomMovieListActionNames] search movies witch key',
  searchMoviesWithKeyStart = '[CustomMovieListActionNames] search movies witch key start',
  customMovieListStateError = '[CustomMovieListActionNames] custom movie list state error',
  updateCustomMovieListState = '[CustomMovieListActionNames] update custom movie list state',
  clearCustomMovieListState = '[CustomMovieListActionNames] clear custom movie list state'
}

export const replaceOrExtendCustomMovieListByGenre = createAction(CustomMovieListActionNames.replaceOrExtendMovieListByGenre, props<{ genreId: Genre }>());
export const replaceCustomMovieListByGenre = createAction(CustomMovieListActionNames.replaceMovieListByGenre, props<{ genreId: Genre }>());
export const extendCustomMovieListByGenre = createAction(CustomMovieListActionNames.extendMovieListByGenre, props<{ genreId: Genre }>());
export const replaceOrExtendCustomMovieListByCategory = createAction(CustomMovieListActionNames.replaceOrExtendMovieListByCategory, props<{ category: MovieCategory }>());
export const replaceCustomMovieListByCategory = createAction(CustomMovieListActionNames.replaceMovieListByCategory, props<{ category: MovieCategory }>());
export const extendCustomMovieListByCategoty = createAction(CustomMovieListActionNames.extendMovieListByCategory, props<{ category: MovieCategory }>());
export const searchMoviesWithKey = createAction(CustomMovieListActionNames.searchMoviesWithKey, props<{ key: string }>());
export const searchMoviesWithKyeStart = createAction(CustomMovieListActionNames.searchMoviesWithKeyStart, props<{ key: string }>());
export const customMovieListStateError = createAction(CustomMovieListActionNames.customMovieListStateError, props<{ error: any }>());
export const updateCustomMovieListState = createAction(CustomMovieListActionNames.updateCustomMovieListState, props<{ oldState: MovieListState, newState: MovieListState }>());
export const clearCustomMovieListState = createAction(CustomMovieListActionNames.clearCustomMovieListState);
