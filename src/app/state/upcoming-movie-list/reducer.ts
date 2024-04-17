import { Action, createReducer, on } from "@ngrx/store";
import { MovieListState } from "../../models/abstract-models";
import { updateUpcomingMovieListState } from "./actions";
import { movieListInitialState } from "../../models/object-model";

const _reducer = createReducer(
  movieListInitialState,
  on(updateUpcomingMovieListState, (_, { newState }) => newState)
);

export const upcomingMoviesReducer = (state: MovieListState | undefined, action: Action) => _reducer(state, action);
