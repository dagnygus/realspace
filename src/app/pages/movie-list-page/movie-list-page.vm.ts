import { Injectable, OnDestroy, Signal, signal } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { AppState, MovieListStateItem } from "../../models/abstract-models";
import { Actions, ofType } from "@ngrx/effects";
import { NavigationEnd, Router } from "@angular/router";
import { Observable, ReplaySubject, Subject, asapScheduler, distinctUntilChanged, filter, map, merge, observeOn, startWith, switchMap, take, takeUntil } from "rxjs";
import { NzScheduler, Priority } from "../../noop-zone";
import { RouterRef } from "../../state/router/state";
import { clearCustomMovieListState, extendCustomMovieListByCategoty, extendCustomMovieListByGenre, replaceCustomMovieListByCategory, replaceCustomMovieListByGenre, replaceOrExtendCustomMovieListByCategory, replaceOrExtendCustomMovieListByGenre, searchMoviesWithKey, searchMoviesWithKyeStart, updateCustomMovieListState } from "../../state/custom-movie-list-state/actions";
import { ViewModelBase, genreMap } from "../../models/object-model";
import { MAPED_MOVIE_CATEGORES } from "../../utils/utils";
import { CustomMovieListRef } from "../../state/custom-movie-list-state/state";

@Injectable()
export class MovieListPageViewModel extends ViewModelBase implements OnDestroy {
  // private _destory$ = new Subject<void>();

  // movies$: Observable<readonly MovieListStateItem[]>;
  // listTitle$ = new ReplaySubject<string>(1);
  // isStateExtending$ = new ReplaySubject<boolean>(1);
  // isStateReplacing$ = new ReplaySubject<boolean>(1);

  movies: Signal<readonly MovieListStateItem[]>;
  listTitle = signal('');
  isStateExtending: Signal<boolean>;
  isStateReplacing: Signal<boolean>;

  constructor(
    router: Router,
    nzScheduler: NzScheduler,
    actions$: Actions,
    moviesRef: CustomMovieListRef,
    private _store: Store<AppState>,
    private _routerStateRef: RouterRef,
  ) {
    super();
    const movies$ = _store.pipe(
      select(({ customMovieList }) => customMovieList.movies),
      nzScheduler.switchOn(Priority.low)
    );

    this.movies = this.toSignal(moviesRef.state.movies, movies$);

    const isStateExtending$ = merge(
      actions$.pipe(
        ofType(extendCustomMovieListByCategoty, extendCustomMovieListByGenre),
        map(() => true)
      ),
      actions$.pipe(
        ofType(updateCustomMovieListState),
        map(() => false)
      )
    ).pipe(
      // startWith(true),
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      // takeUntil(this._destory$)
    );

    this.isStateExtending = this.toSignal(true, isStateExtending$);

    const isStateReplacing$ = merge(
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
      // takeUntil(this._destory$)
    );

    this.isStateReplacing = this.toSignal(false, isStateReplacing$);

    router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      take(1),
      switchMap(() => _store.pipe(select(({ router }) => router.state.params))),
      observeOn(asapScheduler),
      this.takeUntilDestroy(),
    ).subscribe((routerParams) => {

      const movieListKind =  routerParams['movieListKind'];
      const movieListParam =  routerParams['movieListParam'];

      if (movieListKind === 'genre') {
        const genreId = +movieListParam;
        _store.dispatch(replaceOrExtendCustomMovieListByGenre({ genreId }))
        this.listTitle.set(genreMap.get(genreId)!)
        return;
      }

      if (movieListKind === 'category') {
        _store.dispatch(replaceOrExtendCustomMovieListByCategory({ category: movieListParam }))
        this.listTitle.set(MAPED_MOVIE_CATEGORES[movieListParam]);
        return;
      }

      if (movieListKind === 'search') {
        _store.dispatch(searchMoviesWithKey({ key: movieListParam }));
        this.listTitle.set(`Search: ${movieListParam}`);
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
      this.listTitle.set(genreMap.get(genreId)!)
      return;
    }

    if (movieListKind === 'category') {
      this._store.dispatch(replaceOrExtendCustomMovieListByCategory({ category: movieListParam }))
      this.listTitle.set(MAPED_MOVIE_CATEGORES[movieListParam]);
      return;
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    // this._destory$.next();
    // this._destory$.complete();
    this._store.dispatch(clearCustomMovieListState());
  }
}

