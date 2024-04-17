import { Action, createReducer, on } from "@ngrx/store";
import { movieListInitialState } from "../../models/object-model";
import { updateRelatedMovieListState } from "./actions";
import { MovieListState } from "../../models/abstract-models";

const _reducer = createReducer(
  movieListInitialState,
  on(updateRelatedMovieListState, (_, { newState }) => newState)
);

export const relatedMoviesReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
