import { Injectable } from "@angular/core";
import { CastState } from "../../models/abstract-models";
import { BaseStateRef } from "../../models/object-model";

export const initialCastState: CastState = {
  persons: []
}

@Injectable({ providedIn: 'root' })
export class CastRef extends BaseStateRef<CastState> {
  constructor() {
    super('cast');
  }
}
