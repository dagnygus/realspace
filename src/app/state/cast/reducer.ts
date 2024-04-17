import { Action, createReducer, on } from "@ngrx/store";
import { initialCastState } from "./state";
import { updateCastState } from "./actions";
import { CastState } from "../../models/abstract-models";

const _reducer = createReducer(
  initialCastState,
  on(updateCastState, (_, { newState }) => newState)
);

export const castReducer = (state: CastState | undefined, action: Action) => _reducer(state, action);
