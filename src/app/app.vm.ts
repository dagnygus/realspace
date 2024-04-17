import { Injectable, Signal } from "@angular/core";
import { BehaviorSubject, Observable, asyncScheduler, distinctUntilChanged, filter, map, merge, observeOn, of, startWith, switchMap, take, tap } from "rxjs";
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout'
import { NavigationCancel, NavigationEnd, NavigationStart, Router } from "@angular/router";
import { NzScheduler, Priority } from "./noop-zone";
import { Platform } from "@angular/cdk/platform";
import { FormControl } from "@angular/forms";
import { ViewModelBase } from "./models/object-model";

@Injectable()
export class AppViewModel extends ViewModelBase {
  private _sidenavOpen$ = new BehaviorSubject(false);
  private _searchboxExpanded$ = new BehaviorSubject(false);

  private _sidenavOpen  = false;
  private _searchboxExpanded = false

  // sidenavOpen$: Observable<boolean>;
  // searchboxExpanded$:Observable<boolean>;
  // sidenavMode$: Observable<'over' | 'side' | 'push'>;
  // hasBackdrop$: Observable<boolean>;
  // isSmallViewPort$: Observable<boolean>;
  // isBigViewPort$: Observable<boolean>;
  searchBoxFormControl = new FormControl('');
  // isNavigating$: Observable<boolean>;

  sidenavOpen: Signal<boolean>;
  searchboxExpanded: Signal<boolean>;
  sidenavMode: Signal<'over' | 'side' | 'push'>;
  hasBackdrop: Signal<boolean>;
  isSmallViewPort: Signal<boolean>;
  isBigViewPort: Signal<boolean>;
  isNavigating: Signal<boolean>;

  constructor(breakpointObserver: BreakpointObserver,
              platform: Platform,
              nzScheduler: NzScheduler,
              private _router: Router) {
    super();
    const breakpoint$ = breakpointObserver.observe('(min-width: 1024px)');
    let isBigViewPort: boolean
    let isSmallViewPort: boolean;
    let isSmallViewPort$: Observable<boolean>;
    let isBigViewPort$: Observable<boolean>;
    let sidenavMode$: Observable<'over' | 'side' | 'push'>;

    if (platform.isBrowser) {
      isBigViewPort = breakpointObserver.isMatched('(min-width: 1024px)');
      isSmallViewPort = !isBigViewPort;
      isSmallViewPort$ = breakpoint$.pipe(map((state) => !state.matches));
      isBigViewPort$ = breakpoint$.pipe(map((state) => state.matches));
      sidenavMode$ = breakpoint$.pipe(map<BreakpointState, 'over' | 'side' | 'push'>((state) => state.matches ? 'side' : 'over'))
    } else {
      isSmallViewPort$ = isBigViewPort$ = of(true);
      isBigViewPort = isSmallViewPort = true;
      sidenavMode$ = of('over');
    }

    this.isSmallViewPort = this.toSignal(isSmallViewPort, isSmallViewPort$);
    this.isBigViewPort = this.toSignal(isBigViewPort, isBigViewPort$);
    this.sidenavMode = this.toSignal(isBigViewPort ? 'side' : 'over', sidenavMode$);

    const hasBackdrop$ = breakpoint$.pipe(
      map((state) => !state.matches),
    );

    this.hasBackdrop = this.toSignal(true, hasBackdrop$);

    const sidenavOpen$ = nzScheduler.onStable.pipe(
      take(1),
      observeOn(asyncScheduler),
      switchMap(() =>merge(
        this._sidenavOpen$.pipe(
          map((value) => {
            if (breakpointObserver.isMatched('(min-width: 1024px)')) {
              return true;
            } else {
              return value;
            }
          })
        ),
        breakpoint$.pipe(
          map((state) => state.matches),
        ),
        _router.events.pipe(
          filter((e) => e instanceof NavigationEnd && !breakpointObserver.isMatched('(min-width: 1024px)')),
          map(() => false)
        )
      )),
      distinctUntilChanged(),
      tap((value) => this._sidenavOpen = value)
    );

    this.sidenavOpen = this.toSignal(false, sidenavOpen$);

    const searchboxExpanded$ = merge(
      this._searchboxExpanded$.pipe(
        filter(() => !breakpointObserver.isMatched('(min-width: 562px)'))
      ),
      breakpointObserver.observe('(min-width: 562px)').pipe(
        map((state) => state.matches),
      )
    ).pipe(
      distinctUntilChanged(),
      tap((value) => this._searchboxExpanded = value)
    );

    this.searchboxExpanded = this.toSignal(
      breakpointObserver.isMatched('(min-width: 562px)'),
      searchboxExpanded$
    );

    const isNavigating$ = nzScheduler.onStable.pipe(
      take(1),
      observeOn(asyncScheduler),
      switchMap(() => merge(
        _router.events.pipe(filter((e) => e instanceof NavigationStart), map(() => true)),
        _router.events.pipe(filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel), map(() => false))
      )),
    );

    this.isNavigating = this.toSignal(false, isNavigating$);
  }

  openSidenav(): void {
    this._sidenavOpen$.next(true);
  }

  closeSidenav(): void {
    this._sidenavOpen$.next(false);
  }

  toogleSidenav(): void {
    this._sidenavOpen$.next(!this._sidenavOpen$.value);
  }

  isSidenavOpen(): boolean {
    return this._sidenavOpen;
  }

  // expandSearchbox(): void {
  //   this._searchboxExpanded$.next(true);
  // }

  collapseSearchbox(): void {
    this._searchboxExpanded$.next(false);
  }

  isSearchboxExpanded(): boolean {
    return this._searchboxExpanded;
  }

  // toogleSearchboxSize(): void {
  //   this._searchboxExpanded$.next(!this._searchboxExpanded$.value);
  // }

  searchMovieOrToogleSearchboxSize(): void {
    if (this._searchboxExpanded && this.searchBoxFormControl.value) {
      this._router.navigateByUrl(`/search/${this.searchBoxFormControl.value}`);
      this.searchBoxFormControl.reset('');
    }
    this._searchboxExpanded$.next(!this._searchboxExpanded)
  }
}
