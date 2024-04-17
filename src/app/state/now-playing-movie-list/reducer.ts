import { Action, createReducer, on } from "@ngrx/store";
import { MovieListState } from "../../models/abstract-models";
import { updateNowPlayingMovieListState } from "./actions";
import { movieListInitialState } from "../../models/object-model";

const _reducer = createReducer(
  movieListInitialState,
  on(updateNowPlayingMovieListState, (_, { newState }) => newState)
);

export const nowPlayingMoviesReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
