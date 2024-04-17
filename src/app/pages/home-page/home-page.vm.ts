import { NowPlaingMoviesRef } from './../../state/now-playing-movie-list/state';
import { Injectable, OnDestroy, Signal } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { AppState, MovieListStateItem, StateStatus } from "../../models/abstract-models";
import { Observable, ReplaySubject, Subject, distinctUntilChanged, map, merge, shareReplay, startWith, takeUntil, tap } from "rxjs";
import { clearNowPlayingMovieListState, getNowPlayingMovies, getNowPlayingMoviesStart, nowPlayingMovieListStateError, updateNowPlayingMovieListState } from "../../state/now-playing-movie-list/actions";
import { clearPopularMovieListState, getPopularMovies, getPopularMoviesStart, popularMoviesListStateError, updatePopularMovieListState } from "../../state/popular-movie-list/actions";
import { clearTopRatedMovieListState, getTopRatedMovies, getTopRatedMoviesStart, topRatedListStateError, updateTopRatedMovieListState } from "../../state/top-rated-movie-list/actions";
import { clearUpcomingMovieListState, getUpcomingMovies, getUpcomingMoviesStart, upcomingMovieListStateError, updateUpcomingMovieListState } from "../../state/upcoming-movie-list/actions";
import { Actions, ofType } from "@ngrx/effects";
import { NzScheduler, Priority } from '../../noop-zone';
import { PopularMoviesRef } from '../../state/popular-movie-list/state';
import { TopRatedMoviesRef } from '../../state/top-rated-movie-list/state';
import { UpcomingMoviesRef } from '../../state/upcoming-movie-list/state';
import { ViewModelBase } from '../../models/object-model';

@Injectable()
export class HomePageViewModel extends ViewModelBase implements OnDestroy {

  private _store: Store<AppState>;
  // private _destory$ = new Subject<void>();

  // nowPlaingMovies$: Observable<readonly MovieListStateItem[]>;
  // popularMovies$: Observable<readonly MovieListStateItem[]>;
  // topRatedMovies$: Observable<readonly MovieListStateItem[]>;
  // upcomingMovies$: Observable<readonly MovieListStateItem[]>;

  nowPlaingMovies: Signal<readonly MovieListStateItem[]>;
  popularMovies: Signal<readonly MovieListStateItem[]>;
  topRatedMovies: Signal<readonly MovieListStateItem[]>;
  upcomingMovies: Signal<readonly MovieListStateItem[]>;
  nowPlaingMoviesStateStatus: Signal<StateStatus>;
  popularMoviesStateStatus: Signal<StateStatus>;
  topRatedMoviesStateStatus: Signal<StateStatus>;
  upcomingMoviesStateStatus: Signal<StateStatus>;

  // nowPlaingMoviesStateStatus$ = new ReplaySubject<StateStatus>(1);
  // popularMoviesStateStatus$ = new ReplaySubject<StateStatus>(1);
  // topRatedMoviesStateStatus$ = new ReplaySubject<StateStatus>(1);
  // upcomingMoviesStateStatus$ = new ReplaySubject<StateStatus>(1);

  constructor(store: Store<AppState>,
              actions$: Actions,
              nzScheduler: NzScheduler,
              nowPlaingMoviesRef: NowPlaingMoviesRef,
              popularMoviesRef: PopularMoviesRef,
              topRatedMoviesRef: TopRatedMoviesRef,
              upcomingMoviesRef: UpcomingMoviesRef) {
    super();
    this._store = store;

    const nowPlaingMovies$ = store.pipe(
      select(({ nowPlayingMovies }) => nowPlayingMovies.movies),
      nzScheduler.switchOn(Priority.low),
    );

    this.nowPlaingMovies = this.toSignal(
      nowPlaingMoviesRef.state.movies,
      nowPlaingMovies$,
    );

    const popularMovies$ = store.pipe(
      select(({ popularMovies }) => popularMovies.movies),
      nzScheduler.switchOn(Priority.low)
    );

    this.popularMovies = this.toSignal(
      popularMoviesRef.state.movies,
      popularMovies$
    )

    const topRatedMovies$ = store.pipe(
      select(({ topRatedMovies }) => topRatedMovies.movies),
      nzScheduler.switchOn(Priority.low)
    );

    this.topRatedMovies = this.toSignal(
      topRatedMoviesRef.state.movies,
      topRatedMovies$
    )

    const upcomingMovies$ = store.pipe(
      select(({ upcomingMovies }) => upcomingMovies.movies),
      nzScheduler.switchOn(Priority.low)
    );

    this.upcomingMovies = this.toSignal(
      upcomingMoviesRef.state.movies,
      upcomingMovies$
    );

    const nowPlaingMoviesStateStatus$ = merge(
      actions$.pipe(
        ofType(getNowPlayingMoviesStart), map(() => StateStatus.pending)),
      actions$.pipe(
        ofType(updateNowPlayingMovieListState), map(() => nowPlaingMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty)
        ),
      actions$.pipe(
        ofType(nowPlayingMovieListStateError), map(() => StateStatus.error)
      )
    ).pipe(
      // startWith(nowPlaingMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty),
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
    )

    this.nowPlaingMoviesStateStatus = this.toSignal(
      nowPlaingMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty,
      nowPlaingMoviesStateStatus$
    )

    const popularMoviesStateStatus$ = merge(
      actions$.pipe(
        ofType(getPopularMoviesStart), map(() => StateStatus.pending)
      ),
      actions$.pipe(
        ofType(updatePopularMovieListState), map(() => popularMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty)
      ),
      actions$.pipe(
        ofType(popularMoviesListStateError), map(() => StateStatus.error)
      )
    ).pipe(
      // startWith(popularMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty),
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      // takeUntil(this._destory$)
    );

    this.popularMoviesStateStatus = this.toSignal(
      popularMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty,
      popularMoviesStateStatus$
    )

    const topRatedMoviesStateStatus$ = merge(
      actions$.pipe(
        ofType(getTopRatedMoviesStart), map(() => StateStatus.pending)
      ),
      actions$.pipe(
        ofType(updateTopRatedMovieListState), map(() => topRatedMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty)
      ),
      actions$.pipe(
        ofType(topRatedListStateError), map(() => StateStatus.error)
      )
    ).pipe(
      // startWith(topRatedMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty),
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      // takeUntil(this._destory$),
    );

    this.topRatedMoviesStateStatus = this.toSignal(
      topRatedMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty,
      topRatedMoviesStateStatus$
    )

    const upcomingMoviesStateStatus$ = merge(
      actions$.pipe(
        ofType(getUpcomingMoviesStart), map(() => StateStatus.pending)
      ),
      actions$.pipe(
        ofType(updateUpcomingMovieListState), map(() => upcomingMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty)
      ),
      actions$.pipe(
        ofType(upcomingMovieListStateError), map(() => StateStatus.error)
      )
    ).pipe(
      // startWith(upcomingMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty),
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      // takeUntil(this._destory$)
    );

    this.upcomingMoviesStateStatus = this.toSignal(
      upcomingMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty,
      upcomingMoviesStateStatus$
    )

    store.dispatch(getNowPlayingMovies());
    store.dispatch(getPopularMovies());
    store.dispatch(getTopRatedMovies());
    store.dispatch(getUpcomingMovies());
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    // this._destory$.next();
    // this._destory$.complete();

    this._store.dispatch(clearNowPlayingMovieListState());
    this._store.dispatch(clearPopularMovieListState());
    this._store.dispatch(clearTopRatedMovieListState());
    this._store.dispatch(clearUpcomingMovieListState());
  }
}
