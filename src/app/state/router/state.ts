import { RouterReducerState } from "@ngrx/router-store";
import { BaseStateRef } from "../base-state-ref";
import { RouterStateUrl } from "../../models/models";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class RouterRef extends BaseStateRef<RouterReducerState<RouterStateUrl>> {
  constructor() {
    super('router');
  }
}
