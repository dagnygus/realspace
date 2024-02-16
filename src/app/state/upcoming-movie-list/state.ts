import { Injectable } from "@angular/core";
import { MovieListState } from "../../models/models";
import { BaseStateRef } from "../base-state-ref";

@Injectable({ providedIn: 'root' })
export class UpcomingMoviesRef extends BaseStateRef<MovieListState> {
  constructor() { super('upcomingMovies'); }
}
