import { Action, createReducer, on } from "@ngrx/store";
import { MovieListState } from "../../models/models";
import { updateNowPlayingMovieListState } from "./actions";
import { movieListInitialState } from "../movie-list-initial-state";

const _reducer = createReducer(
  movieListInitialState,
  on(updateNowPlayingMovieListState, (_, { newState }) => newState)
);

export const nowPlayingMoviesReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
