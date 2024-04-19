import { NzScheduler, Priority } from "../noop-zone";
import { AppState, CategoryMovieListState, GenreMovieListState, MovieListState, RelatedMovieListState, SearchKeyMovieListState } from "../models/abstract-models";
import { NgZone, inject } from "@angular/core";
import { take, firstValueFrom, observeOn, asyncScheduler } from "rxjs";
import { Router } from "@angular/router";

export const NZ_IF_CONFIG = { optimized: true };
export const NZ_LET_CONFIG = { optimized: true, detach: true, defaultPriority: Priority.immediate };
export const NZ_FOR_CONFIG = { optimized: true };
export const NZ_WATCH_CONFIG = { defaultPriority: Priority.immediate };

export const MOVIE_CATEGORIES = ['upcoming', 'top_rated', 'now_playing', 'popular'];
export const MAPED_MOVIE_CATEGORES: { [key: string]: string } = { upcoming: 'Upcoming', top_rated: 'Top Rated', now_playing: 'Now Playing', popular: 'Popular' }
export const SHARE_REPLAY_CONFIG = { bufferSize: 1, refCount: true }
export const ROUTER_KIND = ['genre', 'category', 'search']
export const GENRE_ID_REGEX = /^(28|12|16|35|80|99|18|10751|14|36|27|10402|9648|10749|878|10770|53|10752|37)$/


export function isGenreMovieListState(state: MovieListState): state is GenreMovieListState {
  return typeof (state as GenreMovieListState).genreId === 'number';
}

export function isCategoryMovieListState(state: MovieListState): state is CategoryMovieListState {
  return typeof (state as CategoryMovieListState).category === 'string';
}

export function isSearchKeyMovieListState(state: MovieListState): state is SearchKeyMovieListState {
  return typeof (state as SearchKeyMovieListState).searckKey === 'string';
}

export function isRelatedMovieListState(state: MovieListState): state is RelatedMovieListState {
  return typeof (state as RelatedMovieListState).id === 'number';
}

export function getStateName(name: keyof AppState): string {
  return name;
}

export function patchRouterForHydrationAndNoopZoneEnviroment(): void {
  let hydrationReady = false;
  const nzScheduler = inject(NzScheduler);
  const ngZone = inject(NgZone);

  nzScheduler.onStable.pipe(take(1)).subscribe(() => {
    ngZone.onStable.emit();
    setTimeout(() => {
      hydrationReady = true;
    }, 0);
  });

  const originalNavigateByUrl = Router.prototype.navigateByUrl;

  Router.prototype.navigateByUrl = function (url, extras) {
    if (hydrationReady) {
      return originalNavigateByUrl.call(this, url, extras);
    } else {
      return firstValueFrom(nzScheduler.onStable.pipe(observeOn(asyncScheduler))).then(() => originalNavigateByUrl(url, extras));
    }
  }
}
