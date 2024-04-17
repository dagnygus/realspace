import { Injectable } from "@angular/core";
import { BaseStateRef } from "../../models/object-model";
import { MovieListState } from "../../models/abstract-models";

@Injectable({ providedIn: 'root' })
export class RelatedMoviesRef extends BaseStateRef<MovieListState> {
  constructor() {
    super('relatedMovies');
  }
}
