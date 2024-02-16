import {Directive, DoCheck, ElementRef, Input, OnDestroy, OnInit, Renderer2, ɵstringify as stringify} from '@angular/core';
import { Observable, ReplaySubject, Subscribable, Subscription, map, of, switchAll } from 'rxjs';
import { fromPromiseLike, fromSubscribable, isPromiseLike, isSubscribable } from '../../core';

declare const ngDevMode: any;

type NgClassSupportedTypes = string[] | Set<string> | {[klass: string]: any} | null | undefined;
type NzClassInput = string | string[] |Set<string> | {[klass: string]: any} | null | undefined;

const WS_REGEXP = /\s+/;

const EMPTY_ARRAY: string[] = [];

interface CssClassState {
  enabled: boolean;
  changed: boolean;
  touched: boolean;
}

@Directive({
  selector: '[nzClass]',
  standalone: true,
})
export class NzClassDirective implements DoCheck, OnInit, OnDestroy {

  private _subscription = new Subscription();
  private _initialClasses = EMPTY_ARRAY;
  private _rawClass: NgClassSupportedTypes;
  private _stateMap = new Map<string, CssClassState>();
  private _nzClass$$ = new ReplaySubject<Observable<NgClassSupportedTypes>>(1);
  private _nzClass$ = new ReplaySubject<NgClassSupportedTypes>(1);
  private _dirty = false;

  @Input('class')
  set klass(value: string) {
    this._initialClasses = value != null ? value.trim().split(WS_REGEXP) : EMPTY_ARRAY;
  }

  @Input()
  set nzClass(value: Observable<NzClassInput> | Subscribable<NzClassInput> | Promise<NzClassInput> | PromiseLike<NzClassInput> | NzClassInput) {

    this._dirty = true;

    if (isSubscribable(value)) {
      this._nzClass$$.next(
        fromSubscribable(value).pipe(
          map((val) => typeof val === 'string' ? val.trim().split(WS_REGEXP) : value)
        )
      );
    } else if (isPromiseLike(value)) {
      this._nzClass$$.next(
        fromPromiseLike(value).pipe(
          map((val) => typeof val === 'string' ? val.trim().split(WS_REGEXP) : value)
        )
      );
    } else {
      this._nzClass$$.next(of(typeof value === 'string' ? value.trim().split(WS_REGEXP) : value));
    }
  }

  constructor(private _elementRef: ElementRef, private _renderer: Renderer2) {}

  ngDoCheck(): void {
    if (this._dirty) { return; }
    this._nzClass$.next(this._rawClass);
  }

  ngOnInit(): void {
    this._subscription.add(this._nzClass$$.pipe(
      switchAll(),
    ).subscribe((value) => {
      this._rawClass = value;
      this._nzClass$.next(value);
    }));

    this._subscription.add(this._nzClass$.subscribe((rawClass) => {

      this._dirty = false;

      for (const klass of this._initialClasses) {
        this._updateState(klass, true);
      }

      if (Array.isArray(rawClass) || rawClass instanceof Set) {
        for (const klass of rawClass) {
          this._updateState(klass, true);
        }
      } else if (rawClass != null) {
        for (const klass of Object.keys(rawClass)) {
          this._updateState(klass, Boolean(rawClass[klass]));
        }
      }

      this._applyStateDiff();

    }));
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  private _updateState(klass: string, nextEnabled: boolean) {
    const state = this._stateMap.get(klass);
    if (state !== undefined) {
      if (state.enabled !== nextEnabled) {
        state.changed = true;
        state.enabled = nextEnabled;
      }
      state.touched = true;
    } else {
      this._stateMap.set(klass, {enabled: nextEnabled, changed: true, touched: true});
    }
  }

  private _applyStateDiff() {
    for (const stateEntry of this._stateMap) {
      const klass = stateEntry[0];
      const state = stateEntry[1];

      if (state.changed) {
        this._toggleClass(klass, state.enabled);
        state.changed = false;
      } else if (!state.touched) {
        if (state.enabled) {
          this._toggleClass(klass, false);
        }
        this._stateMap.delete(klass);
      }

      state.touched = false;
    }
  }

  private _toggleClass(klass: string, enabled: boolean): void {
    if (ngDevMode) {
      if (typeof klass !== 'string') {
        throw new Error(
            `NzClass can only toggle CSS classes expressed as strings, got ${stringify(klass)}`);
      }
    }
    klass = klass.trim();
    if (klass.length > 0) {
      klass.split(WS_REGEXP).forEach(klass => {
        if (enabled) {
          this._renderer.addClass(this._elementRef.nativeElement, klass);
        } else {
          this._renderer.removeClass(this._elementRef.nativeElement, klass);
        }
      });
    }
  }
}
