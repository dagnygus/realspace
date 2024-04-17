import { Injectable } from "@angular/core";
import { MovieState } from "../../models/abstract-models";
import { BaseStateRef } from "../../models/object-model";

export const initialSingleMovieState: MovieState = {
  details: null
}

@Injectable({ providedIn: 'root' })
export class SingleMovieRef extends BaseStateRef<MovieState> {
  constructor() {
    super('singleMovie')
  }
}
