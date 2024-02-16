import {Directive, DoCheck, ElementRef, Input, KeyValueChanges, KeyValueDiffer, KeyValueDiffers, OnDestroy, OnInit, Renderer2, RendererStyleFlags2} from '@angular/core';
import { Observable, ReplaySubject, Subscribable, Subscription, of, switchAll } from 'rxjs';
import { fromPromiseLike, fromSubscribable, isPromiseLike, isSubscribable } from '../../core';

type NzStyleInput = {[klass: string]: any} | null | undefined;

@Directive({
  selector: '[nzStyle]',
  standalone: true,
})
export class NzStyleDirective implements DoCheck, OnInit, OnDestroy {
  private _subscription = new Subscription();
  private _nzStyle$$ = new ReplaySubject<Observable<NzStyleInput>>(1)
  private _nzStyle$ = new ReplaySubject<NzStyleInput>(1);
  private _nzStyle: {[key: string]: string}|null|undefined = null;
  private _differ: KeyValueDiffer<string, string|number>|null = null;
  private _dirty = false;

  constructor(
      private _elementRef: ElementRef, private _differs: KeyValueDiffers, private _renderer: Renderer2) {}

  @Input()
  set nzStyle(values: Observable<NzStyleInput> | Subscribable<NzStyleInput> | Promise<NzStyleInput> | PromiseLike<NzStyleInput> | NzStyleInput) {

    this._dirty = true;

    if (isSubscribable(values)) {
      this._nzStyle$$.next(fromSubscribable(values));
    } else if (isPromiseLike(values)) {
      this._nzStyle$$.next(fromPromiseLike(values));
    } else {
      this._nzStyle$$.next(of(values));
    }
  }

  ngDoCheck() {
    if (!this._dirty) {
      this._nzStyle$.next(this._nzStyle);
    }
  }

  ngOnInit(): void {
    this._subscription.add(
      this._nzStyle$$.pipe(
        switchAll()
      ).subscribe((values) => {
        this._nzStyle = values;
        this._nzStyle$.next(values);
      })
    );

    this._subscription.add(
      this._nzStyle$.subscribe((values) => {
        this._dirty = false;
        if (values) {
          if (!this._differ) {
            this._differ = this._differs.find(values).create();
          }
          const changes = this._differ.diff(values);
          if (changes) {
            this._applyChanges(changes);
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  private _setStyle(nameAndUnit: string, value: string|number|null|undefined): void {
    const [name, unit] = nameAndUnit.split('.');
    const flags = name.indexOf('-') === -1 ? undefined : RendererStyleFlags2.DashCase as number;

    if (value != null) {
      this._renderer.setStyle(
          this._elementRef.nativeElement, name, unit ? `${value}${unit}` : value, flags);
    } else {
      this._renderer.removeStyle(this._elementRef.nativeElement, name, flags);
    }
  }

  private _applyChanges(changes: KeyValueChanges<string, string|number>): void {
    changes.forEachRemovedItem((record) => this._setStyle(record.key, null));
    changes.forEachAddedItem((record) => this._setStyle(record.key, record.currentValue));
    changes.forEachChangedItem((record) => this._setStyle(record.key, record.currentValue));
  }
}
