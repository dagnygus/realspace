import { RouterReducerState } from "@ngrx/router-store";
import { BaseStateRef } from "../../models/object-model";
import { RouterStateUrl } from "../../models/abstract-models";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class RouterRef extends BaseStateRef<RouterReducerState<RouterStateUrl>> {
  constructor() {
    super('router');
  }
}
