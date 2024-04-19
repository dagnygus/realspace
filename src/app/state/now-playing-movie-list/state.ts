import { State } from "@ngrx/store";
import { AppState, MovieListState } from "../../models/abstract-models";
import { Injectable } from "@angular/core";
import { BaseStateRef } from "../../models/object-model";

@Injectable({ providedIn: 'root' })
export class NowPlaingMoviesRef extends BaseStateRef<MovieListState> {

  constructor() {
    super('nowPlayingMovies');
  }
}
