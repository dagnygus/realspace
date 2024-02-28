import { Params } from "@angular/router";
import { RouterReducerState } from "@ngrx/router-store";
import { Genre } from "../utils/genres";

export interface RouterStateUrl {
  fragment: string | null;
  url: string;
  params: Params;
  queryParams: Params;
  fullPath: string;
  lastState: RouterStateUrl | null;
}

export interface AppState {
  router: RouterReducerState<RouterStateUrl>
  nowPlayingMovies: MovieListState,
  popularMovies: MovieListState,
  topRatedMovies: MovieListState,
  upcomingMovies: MovieListState,
  customMovieList: MovieListState,
  singleMovie: MovieState,
  videos: VideosState,
  cast: CastState,
  relatedMovies: MovieListState
}

export interface MovieListFetchResultItem {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export type MovieCategory = 'upcoming' | 'top_rated' | 'now_playing' | 'popular'

export interface MovieListFetchResult {
  page: number;
  results: MovieListFetchResultItem[];
  total_pages: number;
  total_results: number;
}

export interface MovieListStateItem {
  readonly id: number
  readonly title: string;
  readonly realeaseDate: string;
  readonly posterPath: string;
  readonly voteAvarage: number;
}

export interface GenreMovieListState {
  readonly genreId: Genre
  readonly lastRequestedPage: number;
  readonly movies: readonly MovieListStateItem[];
}

export interface SearchKeyMovieListState {
  readonly searckKey: string;
  readonly lastRequestedPage: number;
  readonly movies: readonly MovieListStateItem[];
}

export interface CategoryMovieListState {
  readonly category: MovieCategory
  readonly lastRequestedPage: number;
  readonly movies: readonly MovieListStateItem[];
}

export interface BasicMovieListState {
  readonly lastRequestedPage: number;
  readonly movies: readonly MovieListStateItem[];
}

export interface RelatedMovieListState {
  readonly id: number;
  readonly lastRequestedPage: number;
  readonly movies: readonly MovieListStateItem[];
}

export type MovieListState = RelatedMovieListState | GenreMovieListState | SearchKeyMovieListState | CategoryMovieListState | BasicMovieListState

export enum StateStatus {
  pending = 0,
  complete = 1,
  empty = 2,
  error = 3
}

interface _Genre {
  id: number;
  name: string;
}

interface _ProductionCompany {
  id: number;
  logo_path: string;
  name: string;
  origin_country: string;
}
interface _ProductionCountry {
  iso_3166_1: string;
  name: string;
}

interface _SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface MovieDetailsFetchResult {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection?: any;
  budget: number;
  genres: _Genre[];
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: _ProductionCompany[];
  production_countries: _ProductionCountry[];
  release_date: string;
  revenue: number;
  runtime: number;
  spoken_languages: _SpokenLanguage[];
  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface MovieStateDetails {
  readonly id: number;
  readonly title: string;
  readonly releaseDate: string;
  readonly posterPath: string;
  readonly backdropPath: string;
  readonly voteAverage: number;
  readonly overview: string
  readonly tagline: string;
  readonly runtime: number
  readonly genres: readonly string[]
}

export interface MovieState {
  readonly details: MovieStateDetails | null
}

export interface VideosFetchResult {
  id: number;
  results: {
    iso_639_1: string;
    iso_3166_1: string;
    name: string;
    key: string;
    site: string;
    size: number;
    type: string;
    official: boolean;
    published_at: Date;
    id: string;
  }[]
}

export interface VideosState {
  readonly id?: number
  readonly links: readonly string[];
}

interface _CreditsFetchResultCast {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
}

interface _CreditsFetchResultCrew {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;
  credit_id: string;
  department: string;
  job: string;
}

export interface CreditsFetchResult {
  id: number;
  cast: _CreditsFetchResultCast[];
  crew: _CreditsFetchResultCrew[];
}

export interface CastState {
  readonly movieId?: number
  readonly persons: readonly {
    readonly id: number,
    readonly name: string,
    readonly profilePath: string,
  }[]
}

export interface DataCache {
  setString(key: string, value: string): void;
  getString(key: string): string | null;
  setObject<T extends object = object>(key: string, value: T): void;
  getObject<T extends object = object>(key: string): T | null;
  hasKey(key: string): boolean;
  removeKey(key: string): void;
}
