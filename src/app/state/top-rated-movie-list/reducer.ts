import { Action, createReducer, on } from "@ngrx/store";
import { MovieListState } from "../../models/abstract-models";
import { updateTopRatedMovieListState } from "./actions";
import { movieListInitialState } from "../../models/object-model";

const _reducer = createReducer(
  movieListInitialState,
  on(updateTopRatedMovieListState, (_, { newState }) => newState)
);

export const topRatedMoviesReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
