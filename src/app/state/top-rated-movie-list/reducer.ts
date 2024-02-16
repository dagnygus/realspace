import { Action, createReducer, on } from "@ngrx/store";
import { MovieListState } from "../../models/models";
import { updateTopRatedMovieListState } from "./actions";
import { movieListInitialState } from "../movie-list-initial-state";

const _reducer = createReducer(
  movieListInitialState,
  on(updateTopRatedMovieListState, (_, { newState }) => newState)
);

export const topRatedMoviesReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
