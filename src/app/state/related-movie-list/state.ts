import { Injectable } from "@angular/core";
import { BaseStateRef } from "../base-state-ref";
import { MovieListState } from "../../models/models";

@Injectable({ providedIn: 'root' })
export class RelatedMoviesRef extends BaseStateRef<MovieListState> {
  constructor() {
    super('relatedMovies');
  }
}
