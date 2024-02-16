import { Injectable } from "@angular/core";
import { CastState } from "../../models/models";
import { BaseStateRef } from "../base-state-ref";

export const initialCastState: CastState = {
  persons: []
}

@Injectable({ providedIn: 'root' })
export class CastRef extends BaseStateRef<CastState> {
  constructor() {
    super('cast');
  }
}
