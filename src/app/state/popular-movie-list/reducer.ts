import { Action, createReducer, on } from "@ngrx/store";
import { MovieListState } from "../../models/models";
import { updatePopularMovieListState } from "./actions";
import { movieListInitialState } from "../movie-list-initial-state";

const _reducer = createReducer(
  movieListInitialState,
  on(updatePopularMovieListState, (_, { newState }) => newState)
);

export const popularMoviesReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
