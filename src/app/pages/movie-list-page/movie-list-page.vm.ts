import { Injectable, OnDestroy } from "@angular/core";
import { ActionCreator, Store, select } from "@ngrx/store";
import { AppState, MovieListStateItem } from "../../models/models";
import { Actions, ofType } from "@ngrx/effects";
import { NavigationEnd, Router } from "@angular/router";
import { Observable, ReplaySubject, Subject, asapScheduler, distinctUntilChanged, filter, map, merge, observeOn, of, skip, startWith, switchMap, take, takeUntil, tap } from "rxjs";
import { NzScheduler, Priority } from "../../noop-zone";
import { RouterRef } from "../../state/router/state";
import { CustomMovieListActionNames, clearCustomMovieListState, extendCustomMovieListByCategoty, extendCustomMovieListByGenre, replaceCustomMovieListByCategory, replaceCustomMovieListByGenre, replaceOrExtendCustomMovieListByCategory, replaceOrExtendCustomMovieListByGenre, searchMoviesWithKey, searchMoviesWithKyeStart, updateCustomMovieListState } from "../../state/custom-movie-list-state/actions";
import { Genre, genreMap } from "../../utils/genres";
import { MAPED_MOVIE_CATEGORES } from "../../utils/constants";
import { TypedAction } from "@ngrx/store/src/models";

@Injectable()
export class MovieListPageViewModel implements OnDestroy {
  private _destory$ = new Subject<void>();

  movies$: Observable<readonly MovieListStateItem[]>;
  listTitle$ = new ReplaySubject<string>(1);
  isStateExtending$ = new ReplaySubject<boolean>(1);
  isStateReplacing$ = new ReplaySubject<boolean>(1);

  constructor(
    router: Router,
    nzScheduler: NzScheduler,
    actions$: Actions,
    private _store: Store<AppState>,
    private _routerStateRef: RouterRef) {

    this.movies$ = _store.pipe(
      select(({ customMovieList }) => customMovieList.movies),
      nzScheduler.switchOn(Priority.low)
    );

    merge(
      actions$.pipe(
        ofType(extendCustomMovieListByCategoty, extendCustomMovieListByGenre),
        map(() => true)
      ),
      actions$.pipe(
        ofType(updateCustomMovieListState),
        map(() => false)
      )
    ).pipe(
      startWith(true),
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.isStateExtending$);

    merge(
      actions$.pipe(
        ofType(replaceCustomMovieListByCategory, replaceCustomMovieListByGenre, searchMoviesWithKyeStart),
        map(() => true)
      ),
      actions$.pipe(
        ofType(updateCustomMovieListState),
        map(() => false)
      )
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.isStateReplacing$);

    router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      take(1),
      switchMap(() => _store.pipe(select(({ router }) => router.state.params))),
      observeOn(asapScheduler),
      takeUntil(this._destory$),
    ).subscribe((routerParams) => {


      const movieListKind =  routerParams['movieListKind'];
      const movieListParam =  routerParams['movieListParam'];

      if (movieListKind === 'genre') {
        const genreId = +movieListParam;
        _store.dispatch(replaceOrExtendCustomMovieListByGenre({ genreId }))
        this.listTitle$.next(genreMap.get(genreId)!)
        return;
      }

      if (movieListKind === 'category') {
        _store.dispatch(replaceOrExtendCustomMovieListByCategory({ category: movieListParam }))
        this.listTitle$.next(MAPED_MOVIE_CATEGORES[movieListParam]);
        return;
      }

      if (movieListKind === 'search') {
        _store.dispatch(searchMoviesWithKey({ key: movieListParam }));
        this.listTitle$.next(`Search: ${movieListParam}`);
        return;
      }

    })
  }

  extendMovieListState(): void {
    const movieListKind = this._routerStateRef.state.state.params['movieListKind'];
    const movieListParam = this._routerStateRef.state.state.params['movieListParam'];

    if (movieListKind === 'genre') {
      const genreId = +movieListParam;
      this._store.dispatch(replaceOrExtendCustomMovieListByGenre({ genreId }))
      this.listTitle$.next(genreMap.get(genreId)!)
      return;
    }

    if (movieListKind === 'category') {
      this._store.dispatch(replaceOrExtendCustomMovieListByCategory({ category: movieListParam }))
      this.listTitle$.next(MAPED_MOVIE_CATEGORES[movieListParam]);
      return;
    }
  }

  ngOnDestroy(): void {
    this._destory$.next();
    this._destory$.complete();
    this._store.dispatch(clearCustomMovieListState());
  }
}

