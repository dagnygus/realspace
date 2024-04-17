import { Injectable } from "@angular/core";
import { MovieListState } from "../../models/abstract-models";
import { BaseStateRef } from "../../models/object-model";

@Injectable({ providedIn: 'root' })
export class UpcomingMoviesRef extends BaseStateRef<MovieListState> {
  constructor() { super('upcomingMovies'); }
}
