import { State } from "@ngrx/store";
import { AppState, MovieListState } from "../../models/models";
import { Injectable } from "@angular/core";
import { BaseStateRef } from "../base-state-ref";

@Injectable({ providedIn: 'root' })
export class NowPlaingMoviesRef extends BaseStateRef<MovieListState> {

  constructor() {
    super('nowPlayingMovies')
  }
}
