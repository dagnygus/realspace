import { State } from "@ngrx/store";
import { AppState } from "../models/models";
import { inject } from "@angular/core";

export abstract class BaseStateRef<T extends object> {

  private _state = inject(State<AppState>);

  get state(): T {
    if (this._state.value[this._stateName] == null) {
      throw new Error(this._stateName + ': State not found');
    }
    return this._state.value[this._stateName]
  }

  constructor(private _stateName: keyof AppState) { }
}
