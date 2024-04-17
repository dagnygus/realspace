import { createAction, props } from "@ngrx/store";
import { CastState } from "../../models/abstract-models";

export const enum CastActionNames {
  getCastForMovieById = '[Cast] get cast for movie by id',
  getCastForMovieByIdStart = '[Cast] get cast for movie by id start',
  updateCastState = '[Cast] update cast state',
  castSateError = '[Cast] cast state error',
  clearCastState = '[Cast] clear cast state'
}

export const getCastForMovieById = createAction(CastActionNames.getCastForMovieById, props<{ id: number }>());
export const getCastForMovieByIdStart = createAction(CastActionNames.getCastForMovieByIdStart, props<{ id: number }>());
export const updateCastState = createAction(CastActionNames.updateCastState, props<{ oldState: CastState, newState: CastState }>());
export const castSateError = createAction(CastActionNames.castSateError, props<{ error: any }>());
export const clearCastState = createAction(CastActionNames.clearCastState);
