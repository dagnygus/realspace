import { NowPlaingMoviesRef } from './../../state/now-playing-movie-list/state';
import { Injectable, OnDestroy } from "@angular/core";
import { Store, select } from "@ngrx/store";
import { AppState, MovieListStateItem, StateStatus } from "../../models/models";
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
import { SHARE_REPLAY_CONFIG } from '../../utils/constants';

@Injectable()
export class HomePageViewModel implements OnDestroy {

  private _store: Store<AppState>;
  private _destory$ = new Subject<void>();

  nowPlaingMovies$: Observable<readonly MovieListStateItem[]>;
  popularMovies$: Observable<readonly MovieListStateItem[]>;
  topRatedMovies$: Observable<readonly MovieListStateItem[]>;
  upcomingMovies$: Observable<readonly MovieListStateItem[]>;

  // nowPlaingMoviesStateStatus$: Observable<StateStatus>;
  // popularMoviesStateStatus$: Observable<StateStatus>;
  // topRatedMoviesStateStatus$: Observable<StateStatus>;
  // upcomingMoviesStateStatus$: Observable<StateStatus>;

  nowPlaingMoviesStateStatus$ = new ReplaySubject<StateStatus>(1);
  popularMoviesStateStatus$ = new ReplaySubject<StateStatus>(1);
  topRatedMoviesStateStatus$ = new ReplaySubject<StateStatus>(1);
  upcomingMoviesStateStatus$ = new ReplaySubject<StateStatus>(1);

  constructor(store: Store<AppState>,
              actions$: Actions,
              nzScheduler: NzScheduler,
              nowPlaingMoviesRef: NowPlaingMoviesRef,
              popularMoviesRef: PopularMoviesRef,
              topRatedMoviesRef: TopRatedMoviesRef,
              upcomingMoviesRef: UpcomingMoviesRef) {

    this._store = store;

    this.nowPlaingMovies$ = store.pipe(
      select(({ nowPlayingMovies }) => nowPlayingMovies.movies),
      nzScheduler.switchOn(Priority.low),
    );

    this.popularMovies$ = store.pipe(
      select(({ popularMovies }) => popularMovies.movies),
      nzScheduler.switchOn(Priority.low)
    );

    this.topRatedMovies$ = store.pipe(
      select(({ topRatedMovies }) => topRatedMovies.movies),
      nzScheduler.switchOn(Priority.low)
    );

    this.upcomingMovies$ = store.pipe(
      select(({ upcomingMovies }) => upcomingMovies.movies),
      nzScheduler.switchOn(Priority.low)
    );

    merge(
      actions$.pipe(
        ofType(getNowPlayingMoviesStart), map(() => StateStatus.pending)),
      actions$.pipe(
        ofType(updateNowPlayingMovieListState), map(() => nowPlaingMoviesRef.state.movies.length ? StateStatus.complete : StateStatus.empty)
        ),
      actions$.pipe(
        ofType(nowPlayingMovieListStateError), map(() => StateStatus.error)
      )
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.nowPlaingMoviesStateStatus$)

    merge(
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
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.popularMoviesStateStatus$);

    merge(
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
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$),
    ).subscribe(this.topRatedMoviesStateStatus$);

    merge(
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
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.upcomingMoviesStateStatus$);

    store.dispatch(getNowPlayingMovies());
    store.dispatch(getPopularMovies());
    store.dispatch(getTopRatedMovies());
    store.dispatch(getUpcomingMovies());
  }

  ngOnDestroy(): void {
    this._destory$.next();
    this._destory$.complete();

    this._store.dispatch(clearNowPlayingMovieListState());
    this._store.dispatch(clearPopularMovieListState());
    this._store.dispatch(clearTopRatedMovieListState());
    this._store.dispatch(clearUpcomingMovieListState());
  }
}
