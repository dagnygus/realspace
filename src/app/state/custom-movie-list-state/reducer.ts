import { Action, createReducer, on } from "@ngrx/store";
import { movieListInitialState } from "../../models/object-model";
import { updateCustomMovieListState } from "./actions";
import { MovieListState } from "../../models/abstract-models";

const _reducer = createReducer(
  movieListInitialState,
  on(updateCustomMovieListState, (_, { newState }) =>  newState)
);

export const customMovieListReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
