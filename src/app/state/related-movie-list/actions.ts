import { createAction, props } from "@ngrx/store";
import { MovieListState } from "../../models/abstract-models";

export const enum RelatedMovieListActionNames {
  getRelatedMovieListById = '[RelatedMovieListActionNames] get related movie list by id',
  getRelatedMovieListByIdStart = '[RelatedMovieListActionNames] get related movie list by id start',
  updateRelatedMovieListState = '[RelatedMovieListActionNames] updated related movie list state',
  relatedMovieListStateError = '[RelatedMovieListActionNames] related movie list state error',
  clearRelatedMovieListState = '[RelatedMovieListActionNames] clear related movie list state'
}

export const getRelatedMoviesById = createAction(RelatedMovieListActionNames.getRelatedMovieListById, props<{ id: number }>());
export const getRelatedMoviesByIdStart = createAction(RelatedMovieListActionNames.getRelatedMovieListByIdStart, props<{ id: number }>());
export const updateRelatedMovieListState = createAction(RelatedMovieListActionNames.updateRelatedMovieListState, props<{ oldState: MovieListState, newState: MovieListState }>());
export const relatedMovieListStateError = createAction(RelatedMovieListActionNames.relatedMovieListStateError, props<{ error: any }>());
export const clearRelatedMovieListState = createAction(RelatedMovieListActionNames.clearRelatedMovieListState);
