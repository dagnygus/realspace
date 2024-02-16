import { Action, createReducer, on } from "@ngrx/store";
import { MovieListState } from "../../models/models";
import { updateUpcomingMovieListState } from "./actions";
import { movieListInitialState } from "../movie-list-initial-state";

const _reducer = createReducer(
  movieListInitialState,
  on(updateUpcomingMovieListState, (_, { newState }) => newState)
);

export const upcomingMoviesReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
