import { Action, createReducer, on } from "@ngrx/store";
import { initialSingleMovieState } from "./state";
import { updateSingleMovieState } from "./actions";
import { MovieState } from "../../models/models";

const _reducer = createReducer(
  initialSingleMovieState,
  on(updateSingleMovieState, (_, { newState }) => newState)
);


export const singleMovieReducer = (state: MovieState | undefined, action: Action) => _reducer(state, action);
