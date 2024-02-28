import { Actions, createEffect, ofType } from "@ngrx/effects";
import { MoviesHttpService } from "../../common/services/movies-http.service";
import { CustomMovieListRef } from "./state";
import { NzScheduler, Priority } from "../../noop-zone";
import { clearCustomMovieListState, customMovieListStateError, extendCustomMovieListByCategoty, extendCustomMovieListByGenre, replaceCustomMovieListByCategory, replaceCustomMovieListByGenre, replaceOrExtendCustomMovieListByCategory, replaceOrExtendCustomMovieListByGenre, searchMoviesWithKey, searchMoviesWithKyeStart, updateCustomMovieListState } from "./actions";
import { exhaustMap, map, catchError, of, takeUntil, switchMap, tap, filter, take } from "rxjs";
import { isCategoryMovieListState, isGenreMovieListState, isSearchKeyMovieListState } from "../../utils/type-checkers";
import { CategoryMovieListState, GenreMovieListState, MovieListState, MovieListStateItem, SearchKeyMovieListState } from "../../models/models";
import { Injectable } from "@angular/core";
import { movieListInitialState } from "../movie-list-initial-state";
import { Platform } from "@angular/cdk/platform";
import { ServerDataCache } from "../../common/services/server-data-cache.service";

const CUSTOM_MOVIE_LIST_STATE_CACHE_KEY = 'realspace-custom-movie-list-state'

@Injectable()
export class CustomMovieListEffects {

  replaceOrExtendMovieListByGenre$ = createEffect(() => this._actions$.pipe(
    ofType(replaceOrExtendCustomMovieListByGenre),
    map(({ genreId }) => {
      const oldState = this._customMovieListRef.state;
      if (isGenreMovieListState(oldState) && oldState.genreId === genreId) {
        return extendCustomMovieListByGenre({ genreId })
      } else {
        return replaceCustomMovieListByGenre({ genreId })
      }
    })
  ));

  extendMovieListByGenre$ = createEffect(() => this._actions$.pipe(
    ofType(extendCustomMovieListByGenre),
    this._nzScheduler.switchOn(Priority.idle),
    switchMap(({ genreId }) => {
      const page = this._customMovieListRef.state.lastRequestedPage + 1;

      return this._moviesHttpService.getMoviesWithGenre(page, genreId).pipe(
        map(({ results }) => {

          const movies = this._customMovieListRef.state.movies.slice();

          for (let i = 0; i < results.length; i++) {
            movies.push({
              id: results[i].id,
              title: results[i].title,
              posterPath: results[i].poster_path,
              voteAvarage: results[i].vote_average,
              realeaseDate: results[i].release_date
            });
          }

          const newState: GenreMovieListState = {
            genreId,
            lastRequestedPage: page,
            movies
          };

          return updateCustomMovieListState({ oldState: this._customMovieListRef.state, newState });
        }),
        catchError((error) => of(customMovieListStateError({ error }))),
        takeUntil(this._actions$.pipe(ofType(clearCustomMovieListState)))
      )
    })
  ));

  replaceMovieListByGenre$ = createEffect(() => this._actions$.pipe(
    ofType(replaceCustomMovieListByGenre),
    this._nzScheduler.switchOn(Priority.idle),
    switchMap(({ genreId }) => this._moviesHttpService.getMoviesWithGenre(1, genreId).pipe(
      map(({ results }) => {

        const movies = results.map<MovieListStateItem>((item) => ({
          id: item.id,
          title: item.title,
          posterPath: item.poster_path,
          voteAvarage: item.vote_average,
          realeaseDate: item.release_date,
        }));

        const newState: GenreMovieListState = {
          genreId,
          lastRequestedPage: 1,
          movies
        };

        return updateCustomMovieListState({ oldState: this._customMovieListRef.state, newState });
      }),
      catchError((error) => of(customMovieListStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(customMovieListStateError)))
    ))
  ));

  replaceOrExtendMovieListByCategory$ = createEffect(() => this._actions$.pipe(
    ofType(replaceOrExtendCustomMovieListByCategory),
    map(({ category }) => {
      const oldState = this._customMovieListRef.state
      if (isCategoryMovieListState(oldState) && oldState.category === category) {
        return extendCustomMovieListByCategoty({ category });
      } else {
        return replaceCustomMovieListByCategory({ category })
      }
    })
  ));

  extendMovieListByCategory$ = createEffect(() => this._actions$.pipe(
    ofType(extendCustomMovieListByCategoty),
    this._nzScheduler.switchOn(Priority.idle),
    switchMap(({ category }) => {
      const page = this._customMovieListRef.state.lastRequestedPage + 1;

      return this._moviesHttpService.getMoviesWithCategory(page, category).pipe(
        map(({ results }) => {

          const movies = this._customMovieListRef.state.movies.slice();

          for (let i = 0; i < results.length; i++) {
            movies.push({
              id: results[i].id,
              title: results[i].title,
              posterPath: results[i].poster_path,
              voteAvarage: results[i].vote_average,
              realeaseDate: results[i].release_date
            });
          }

          const newState: CategoryMovieListState = {
            category,
            lastRequestedPage: page,
            movies
          };


          return updateCustomMovieListState({ oldState: this._customMovieListRef.state, newState });
        }),
        catchError((error) => of(customMovieListStateError({ error }))),
        takeUntil(this._actions$.pipe(ofType(clearCustomMovieListState)))
      )
    })
  ));

  replaceMovieListByCategory$ = createEffect(() => this._actions$.pipe(
    ofType(replaceCustomMovieListByCategory),
    this._nzScheduler.switchOn(Priority.idle),
    switchMap(({ category }) => this._moviesHttpService.getMoviesWithCategory(1, category).pipe(
      map(({ results }) => {

        const movies = results.map<MovieListStateItem>((item) => ({
          id: item.id,
          title: item.title,
          posterPath: item.poster_path,
          voteAvarage: item.vote_average,
          realeaseDate: item.release_date
        }));

        const newState: CategoryMovieListState = {
          category,
          lastRequestedPage: 1,
          movies
        }

        return updateCustomMovieListState({ oldState: this._customMovieListRef.state, newState });
      }),
      catchError((error) => of(customMovieListStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearCustomMovieListState)))
    ))
  ));

  searchMoviesWithKey$ = createEffect(() => this._actions$.pipe(
    ofType(searchMoviesWithKey),
    filter(({ key }) => {
      const currentState = this._customMovieListRef.state;
      if (isSearchKeyMovieListState(currentState) && currentState.searckKey === key) {
        return false
      } else {
        return true
      }
    }),
    map(({ key }) => searchMoviesWithKyeStart({ key }))
  ));

  findMoviesWithKeyFromBackend$ = createEffect(() => this._actions$.pipe(
    ofType(searchMoviesWithKyeStart),
    switchMap(({ key }) => this._moviesHttpService.getMoviesWithKey(key).pipe(
      map(({ results }) => {

        const movies = results.map<MovieListStateItem>((item) => ({
          id: item.id,
          title: item.title,
          posterPath: item.poster_path,
          voteAvarage: item.vote_average,
          realeaseDate: item.release_date
        }));

        const newState: SearchKeyMovieListState = {
          searckKey: key,
          movies,
          lastRequestedPage: 1
        }
        return updateCustomMovieListState({ oldState: this._customMovieListRef.state, newState })
      }),
      catchError((error) => of(customMovieListStateError({ error }))),
      takeUntil(this._actions$.pipe(ofType(clearCustomMovieListState)))
    ))
  ));

  clearCustomMovieListState$ = createEffect(() => this._actions$.pipe(
    ofType(clearCustomMovieListState),
    filter(() => this._customMovieListRef.state !== movieListInitialState),
    map(() => updateCustomMovieListState({ oldState: this._customMovieListRef.state, newState: movieListInitialState }))
  ));

  cacheStateOnServer$ = createEffect(() => this._actions$.pipe(
    ofType(updateCustomMovieListState),
    filter(() => !this._platform.isBrowser),
    tap(({ newState }) => this._serverDataCache.setObject(CUSTOM_MOVIE_LIST_STATE_CACHE_KEY, newState))
  ), { dispatch: false });

  retrieveStateFromServerCacheInBrowser$ = createEffect(() => of(this._serverDataCache.getObject<MovieListState>(CUSTOM_MOVIE_LIST_STATE_CACHE_KEY)!).pipe(
    filter((state) => this._platform.isBrowser && state !== null),
    map((newState) => updateCustomMovieListState({ oldState: this._customMovieListRef.state, newState })),
    tap(() => this._serverDataCache.removeKey(CUSTOM_MOVIE_LIST_STATE_CACHE_KEY))
  ))

  constructor(
    private _actions$: Actions,
    private _moviesHttpService: MoviesHttpService,
    private _customMovieListRef: CustomMovieListRef,
    private _nzScheduler: NzScheduler,
    private _platform: Platform,
    private _serverDataCache: ServerDataCache
  ) {}
}
