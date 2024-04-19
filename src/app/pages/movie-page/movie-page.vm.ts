import { Injectable, OnDestroy, Signal } from "@angular/core";
import { asapScheduler, distinctUntilChanged, filter, map, merge, observeOn, switchMap, take } from "rxjs";
import { AppMoviePageState, MovieListStateItem, MovieStateDetails, StateStatus } from "../../models/abstract-models";
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
import { VideosRef } from "../../state/videos/state";
import { CastRef } from "../../state/cast/state";
import { RelatedMoviesRef } from "../../state/related-movie-list/state";
import { ViewModelBase } from "../../models/object-model";

@Injectable()
export class MoviePageViewModel extends ViewModelBase implements OnDestroy {

  movieDetails: Signal<MovieStateDetails>;
  videoLinks: Signal<readonly SafeResourceUrl[]>;
  cast: Signal<readonly { readonly id: number; readonly name: string; readonly profilePath: string }[]>;
  relatedMovies: Signal<readonly MovieListStateItem[]>;
  hasVideoLinks: Signal<boolean>;
  movieDetailsStatus: Signal<StateStatus>;
  videoLinksStatus: Signal<StateStatus>;
  castStateStatus: Signal<StateStatus>;
  relatedMoviesStatus: Signal<StateStatus>;

  constructor(
    private _store: Store<AppMoviePageState>,
    movieRef: SingleMovieRef,
    domSanitizer: DomSanitizer,
    nzScheduler: NzScheduler,
    router: Router,
    actions$: Actions,
    videosRef: VideosRef,
    signleMovieRef: SingleMovieRef,
    castRef: CastRef,
    relatedMoviesRef: RelatedMoviesRef
    ) {
    super();

    const movieDetails$ = _store.pipe(
      select(({ singleMovie }) => singleMovie.details!),
      filter((details) => details !== null),
      nzScheduler.switchOn(Priority.low)
    );

    this.movieDetails = this.toSignal(movieRef.state.details!, movieDetails$);

    const videoLinks$ = _store.pipe(
      select(({ videos }) => videos.links.map((link) => domSanitizer.bypassSecurityTrustResourceUrl(link))),
      nzScheduler.switchOn(Priority.low),
    );

    this.videoLinks = this.toSignal([], videoLinks$);

    const cast$ = _store.pipe(
      select(({ cast }) => cast.persons),
      nzScheduler.switchOn(Priority.low)
    );

    this.cast = this.toSignal(castRef.state.persons, cast$);

    const relatedMovies$ = _store.pipe(
      select(({ relatedMovies }) => relatedMovies.movies),
      nzScheduler.switchOn(Priority.low)
    );

    this.relatedMovies = this.toSignal(relatedMoviesRef.state.movies, relatedMovies$);

    const hasVideoLinks$ = _store.pipe(
      select(({ videos }) => videos.links.length > 0),
      nzScheduler.switchOn(Priority.low)
    );

    this.hasVideoLinks = this.toSignal(false, hasVideoLinks$);

    const movieDetailsStatus$ = merge(
      actions$.pipe(ofType(getSignleMovieByIdStart), map(() => StateStatus.pending)),
      actions$.pipe(ofType(relatedMovieListStateError), map(() => StateStatus.error)),
      actions$.pipe(ofType(updateSingleMovieState), map(({ newState }) => newState.details === null ? StateStatus.empty : StateStatus.complete))
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
    );

    this.movieDetailsStatus = this.toSignal(
      signleMovieRef.state.details === null ? StateStatus.empty : StateStatus.complete,
      movieDetailsStatus$
    )


    const videoLinksStatus$ = merge(
      actions$.pipe(ofType(getVideosForMovieByIdStart), map(() => StateStatus.pending)),
      actions$.pipe(ofType(videosStateError), map(() => StateStatus.error)),
      actions$.pipe(ofType(updateVideosState), map(({ newState }) => newState.links.length ? StateStatus.complete : StateStatus.empty))
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
    );

    this.videoLinksStatus = this.toSignal(
      videosRef.state.links.length ? StateStatus.complete : StateStatus.empty,
      videoLinksStatus$
    );

    const castStateStatus$ = merge(
      actions$.pipe(ofType(getCastForMovieByIdStart), map(() => StateStatus.pending)),
      actions$.pipe(ofType(castSateError), map(() => StateStatus.error)),
      actions$.pipe(ofType(updateCastState), map(({ newState }) => newState.persons.length ? StateStatus.complete: StateStatus.empty))
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
    );

    this.castStateStatus = this.toSignal(
      castRef.state.persons.length ? StateStatus.complete: StateStatus.empty,
      castStateStatus$
    );

    const relatedMoviesStatus$ = merge(
      actions$.pipe(ofType(getRelatedMoviesByIdStart), map(() => StateStatus.pending)),
      actions$.pipe(ofType(relatedMovieListStateError), map(() => StateStatus.error)),
      actions$.pipe(ofType(updateRelatedMovieListState), map(({ newState }) => newState.movies.length ? StateStatus.complete: StateStatus.empty))
    ).pipe(
      distinctUntilChanged(),
      nzScheduler.switchOn(Priority.low),
    );

    this.relatedMoviesStatus = this.toSignal(
      relatedMoviesRef.state.movies.length ? StateStatus.complete: StateStatus.empty,
      relatedMoviesStatus$
    )

    router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      take(1),
      switchMap(() => _store.pipe(select((state) => state.router.state.params))),
      observeOn(asapScheduler),
      this.takeUntilDestroy(),
    ).subscribe((params) => {
      const id = +params['movieId'];

      if (typeof id !== 'undefined') {
        _store.dispatch(getSignleMovieById({ id }));
        _store.dispatch(getCastForMovieById({ id }));
        _store.dispatch(getVideosForMovieById({ id }));
        _store.dispatch(getRelatedMoviesById({ id }));
      }
    });

  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this._store.dispatch(clearSingleMovieState());
    this._store.dispatch(clearVideosState());
    this._store.dispatch(clearCastState());
    this._store.dispatch(clearRelatedMovieListState());
  }
}
