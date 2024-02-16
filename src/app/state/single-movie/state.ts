import { Injectable } from "@angular/core";
import { MovieState } from "../../models/models";
import { BaseStateRef } from "../base-state-ref";

export const initialSingleMovieState: MovieState = {
  details: null
}

@Injectable({ providedIn: 'root' })
export class SingleMovieRef extends BaseStateRef<MovieState> {
  constructor() {
    super('singleMovie')
  }
}
