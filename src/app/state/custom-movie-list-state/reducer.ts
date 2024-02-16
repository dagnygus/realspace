import { Action, createReducer, on } from "@ngrx/store";
import { movieListInitialState } from "../movie-list-initial-state";
import { updateCustomMovieListState } from "./actions";
import { MovieListState } from "../../models/models";

const _reducer = createReducer(
  movieListInitialState,
  on(updateCustomMovieListState, (_, { newState }) =>  newState)
);

export const customMovieListReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
