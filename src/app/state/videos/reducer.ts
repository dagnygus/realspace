import { Action, createReducer, on } from "@ngrx/store";
import { initialVideosState } from "./state";
import { updateVideosState } from "./actions";
import { VideosState } from "../../models/abstract-models";

const _reducer = createReducer(
  initialVideosState,
  on(updateVideosState, (_, { newState }) => newState)
);

export const videosReducer = (state: VideosState | undefined, action: Action) => _reducer(state, action);
