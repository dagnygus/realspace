import { Injectable } from "@angular/core";
import { MovieListState } from "../../models/abstract-models";
import { BaseStateRef } from "../../models/object-model";

@Injectable({ providedIn: 'root' })
export class TopRatedMoviesRef extends BaseStateRef<MovieListState> {
  constructor() { super('topRatedMovies'); }
}
