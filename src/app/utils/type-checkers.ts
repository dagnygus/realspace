import { CategoryMovieListState, GenreMovieListState, MovieListState, RelatedMovieListState, SearchKeyMovieListState } from "../models/models";

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
