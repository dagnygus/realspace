import { createAction, props } from "@ngrx/store";
import { MovieState } from "../../models/models";

export const enum SingleMovieActionNames {
  getSingleMovieById = '[Single Movie] get single movie by id',
  getSignleMovieByIdStart = '[Signle Movie] get single movie by id start',
  singleMovieStateError = '[Single Movie] single movie state error',
  updateSingleMovieState = '[Signle Movie] update signle movie state',
  clearSingleMovieState = '[Signle Movie] clear single movie state'
}

export const getSignleMovieById = createAction(SingleMovieActionNames.getSingleMovieById, props<{ id: number }>());
export const getSignleMovieByIdStart = createAction(SingleMovieActionNames.getSignleMovieByIdStart, props<{ id: number }>());
export const singleMovieStateError = createAction(SingleMovieActionNames.singleMovieStateError, props<{ error: any }>());
export const updateSingleMovieState = createAction(SingleMovieActionNames.updateSingleMovieState, props<{ oldState: MovieState, newState: MovieState }>())
export const clearSingleMovieState = createAction(SingleMovieActionNames.clearSingleMovieState);
