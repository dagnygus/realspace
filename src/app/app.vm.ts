import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, distinctUntilChanged, filter, map, merge, of, startWith, tap } from "rxjs";
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout'
import { NavigationEnd, Router } from "@angular/router";
import { NzScheduler, Priority } from "./noop-zone";
import { Platform } from "@angular/cdk/platform";
import { FormControl } from "@angular/forms";

@Injectable()
export class AppViewModel {
  private _sidenavOpen$ = new BehaviorSubject(false);
  private _searchboxExpanded$ = new BehaviorSubject(false);

  private _sidenavOpen  = false;
  private _searchboxExpanded = false

  sidenavOpen$: Observable<boolean>;
  searchboxExpanded$:Observable<boolean>;
  sidenavMode$: Observable<'over' | 'side' | 'push'>;
  hasBackdrop$: Observable<boolean>;
  isSmallViewPort$: Observable<boolean>;
  isBigViewPort$: Observable<boolean>;
  searchBoxFormControl = new FormControl('');

  constructor(breakpointObserver: BreakpointObserver,
              platform: Platform,
              nzScheduler: NzScheduler,
              private _router: Router) {

    const breakpoint$ = breakpointObserver.observe('(min-width: 1024px)');

    if (platform.isBrowser) {
      this.isSmallViewPort$ = breakpoint$.pipe(map((state) => !state.matches));
      this.isBigViewPort$ = breakpoint$.pipe(map((state) => state.matches));
      this.sidenavMode$ = breakpoint$.pipe(map<BreakpointState, 'over' | 'side' | 'push'>((state) => state.matches ? 'side' : 'over'))
    } else {
      this.isSmallViewPort$ = this.isBigViewPort$ = of(true);
      this.sidenavMode$ = of('over');
    }

    this.hasBackdrop$ = breakpoint$.pipe(
      map((state) => !state.matches),
      startWith(true)
    )

    this.sidenavOpen$ = merge(
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
    ).pipe(
      distinctUntilChanged(),
      // nzScheduler.switchOn(Priority.immediate),
      tap((value) => this._sidenavOpen = value)
    );

    this.searchboxExpanded$ = merge(
      this._searchboxExpanded$.pipe(
        filter(() => !breakpointObserver.isMatched('(min-width: 562px)'))
      ),
      breakpointObserver.observe('(min-width: 562px)').pipe(
        map((state) => state.matches),
      )
    ).pipe(
      distinctUntilChanged(),
      // nzScheduler.switchOn(Priority.immediate),
      tap((value) => this._searchboxExpanded = value)
    );

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

  // isSidenavOpen(): boolean {
  //   return this._sidenavOpen;
  // }

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
