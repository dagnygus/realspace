import { Injectable, OnDestroy } from "@angular/core";
import { Observable, ReplaySubject, Subject, asapScheduler, distinctUntilChanged, filter, map, merge, observeOn, switchMap, take, takeUntil, tap } from "rxjs";
import { AppState, MovieListStateItem, MovieStateDetails, StateStatus } from "../../models/models";
import { Store, select } from "@ngrx/store";
import { NzScheduler, Priority } from "../../noop-zone";
import { NavigationEnd, Router } from "@angular/router";
import { clearSingleMovieState, getSignleMovieById, getSignleMovieByIdStart, updateSingleMovieState } from "../../state/single-movie/actions";
import { clearVideosState, getVideosForMovieById, getVideosForMovieByIdStart, updateVideosState, videosStateError } from "../../state/videos/actions";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { castSateError, clearCastState, getCastForMovieById, getCastForMovieByIdStart, updateCastState } from "../../state/cast/actions";
import { Actions, ofType } from "@ngrx/effects";
import { clearRelatedMovieListState, getRelatedMoviesById, getRelatedMoviesByIdStart, relatedMovieListStateError, updateRelatedMovieListState } from "../../state/related-movie-list/actions";
import { SingleMovieRef } from "../../state/single-movie/state";

@Injectable()
export class MoviePageViewModel implements OnDestroy {
  private _destory$ = new Subject<void>();

  movieDetails$: Observable<MovieStateDetails>;
  videoLinks$: Observable<readonly SafeResourceUrl[]>;
  cast$: Observable<readonly { readonly id: number; readonly name: string; readonly profilePath: string }[]>;
  relatedMovies$: Observable<readonly MovieListStateItem[]>;
  hasVideoLinks$: Observable<boolean>;

  movieDetailsStatus$ = new ReplaySubject<StateStatus>(1);
  videoLinksStatus$ = new ReplaySubject<StateStatus>(1);
  castStateStatus$ = new ReplaySubject<StateStatus>(1);
  relatedMoviesStatus$ = new ReplaySubject<StateStatus>(1);

  get movieDetails(): MovieStateDetails {
    return this._movieRef.state.details!
  }

  constructor(
    private _store: Store<AppState>,
    private _movieRef: SingleMovieRef,
    domSanitizer: DomSanitizer,
    nzScheduler: NzScheduler,
    router: Router,
    actions$: Actions
    ) {

    this.movieDetails$ = _store.pipe(
      select(({ singleMovie }) => singleMovie.details!),
      filter((details) => details !== null),
      nzScheduler.switchOn(Priority.low)
    );

    this.videoLinks$ = _store.pipe(
      select(({ videos }) => videos.links.map((link) => domSanitizer.bypassSecurityTrustResourceUrl(link))),
      nzScheduler.switchOn(Priority.low),
    );

    this.cast$ = _store.pipe(
      select(({ cast }) => cast.persons),
      nzScheduler.switchOn(Priority.low)
    );

    this.relatedMovies$ = _store.pipe(
      select(({ relatedMovies }) => relatedMovies.movies),
      nzScheduler.switchOn(Priority.low)
    );

    this.hasVideoLinks$ = _store.pipe(
      select(({ videos }) => videos.links.length > 0),
      nzScheduler.switchOn(Priority.low)
    );

    merge(
      actions$.pipe(ofType(getSignleMovieByIdStart), map(() => StateStatus.pending)),
      actions$.pipe(ofType(relatedMovieListStateError), map(() => StateStatus.error)),
      actions$.pipe(ofType(updateSingleMovieState), map(({ newState }) => newState.details === null ? StateStatus.empty : StateStatus.complete))
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.movieDetailsStatus$);


    merge(
      actions$.pipe(ofType(getVideosForMovieByIdStart), map(() => StateStatus.pending)),
      actions$.pipe(ofType(videosStateError), map(() => StateStatus.error)),
      actions$.pipe(ofType(updateVideosState), map(({ newState }) => newState.links.length ? StateStatus.complete : StateStatus.empty))
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.videoLinksStatus$);

    merge(
      actions$.pipe(ofType(getCastForMovieByIdStart), map(() => StateStatus.pending)),
      actions$.pipe(ofType(castSateError), map(() => StateStatus.error)),
      actions$.pipe(ofType(updateCastState), map(({ newState }) => newState.persons.length ? StateStatus.complete: StateStatus.empty))
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.castStateStatus$);

    merge(
      actions$.pipe(ofType(getRelatedMoviesByIdStart), map(() => StateStatus.pending)),
      actions$.pipe(ofType(relatedMovieListStateError), map(() => StateStatus.error)),
      actions$.pipe(ofType(updateRelatedMovieListState), map(({ newState }) => newState.movies.length ? StateStatus.complete: StateStatus.empty))
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
      takeUntil(this._destory$)
    ).subscribe(this.relatedMoviesStatus$)

    router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      take(1),
      switchMap(() => _store.pipe(select((state) => state.router.state.params))),
      observeOn(asapScheduler),
      takeUntil(this._destory$),
    ).subscribe((params) => {
      const id = params['movieId'];

      if (typeof id !== 'undefined') {
        _store.dispatch(getSignleMovieById({ id }));
        _store.dispatch(getCastForMovieById({ id }));
        _store.dispatch(getVideosForMovieById({ id }));
        _store.dispatch(getRelatedMoviesById({ id }));
      }

    });

  }

  ngOnDestroy(): void {
    this._store.dispatch(clearSingleMovieState());
    this._store.dispatch(clearVideosState());
    this._store.dispatch(clearCastState());
    this._store.dispatch(clearRelatedMovieListState());
    this._destory$.next();
    this._destory$.complete();
  }
}
