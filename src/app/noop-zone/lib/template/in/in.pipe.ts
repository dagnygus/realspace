import { ChangeDetectorRef, EffectRef, Inject, Injector, OnDestroy, Optional, Pipe, PipeTransform, Signal, effect, isSignal, untracked } from "@angular/core";
import { Priority, assertNoopZoneEnviroment, detectChanges, isPromiseLike, isSubscribable } from "../../core";
import { Observable, Subscribable, Unsubscribable } from "rxjs";
import { NZ_IN_PIPE_DEFAULT_PRIORITY } from "../injection-tokens/injection-tokens";

declare const ngDevMode: any

interface SubscriptionStrategy {
  attach(subscriptionTarget: object, subscriptionCallback: (value: any) => void): void
  dispose(): void;
}

class PromiseLikeStrategy implements SubscriptionStrategy {

  private _disposed = false;

  attach(target: PromiseLike<any>, callback: (value: any) => void): void {
    target.then((value) => {
      if (this._disposed) { return; }
      callback(value);
    }, (err) => { throw err; })
  }

  dispose(): void {
    this._disposed = true
  }
}

class SubscribableStrategy implements SubscriptionStrategy {

  private _subscription: Unsubscribable | null = null;

  attach(target: Subscribable<any>, callback: (value: any) => void): void {
    this._subscription = target.subscribe({ next: callback, error: (err) => { throw err; } });
  }

  dispose(): void {
    if (this._subscription) { this._subscription.unsubscribe(); }
  }
}

class SignalStrategy implements SubscriptionStrategy {

  private _effectRef: EffectRef | null = null;
  private _notBinded = true;

  constructor(private _injector: Injector) {}

  attach(target: Signal<any>, callback: (value: any) => void): void {
    this._effectRef = untracked(() => effect(() => {
      callback(target());
      this._notBinded = false;
    }, { injector: this._injector, manualCleanup: true }));
    if (this._notBinded) {
      callback(target());
    }
  }
  dispose(): void {
    if (this._effectRef) { this._effectRef.destroy(); }
  }

}

@Pipe({ name: 'in' , standalone: true, pure: false})
export class InPipe implements PipeTransform, OnDestroy {

  private _subscriptionStrategy: SubscriptionStrategy | null = null;
  private _latestValue: any;
  private _target: any = null;;

  constructor(@Optional() @Inject(NZ_IN_PIPE_DEFAULT_PRIORITY) private _defaultPriority: Priority | null,
              private _injector: Injector) {
    assertNoopZoneEnviroment();
  }

  transform<T>(target: Observable<T>, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined;
  transform<T>(target: Subscribable<T>, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined;
  transform<T>(target: PromiseLike<T>, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined;
  transform<T>(target: Promise<T>, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined;
  transform<T>(target: Signal<T>, cdRef: ChangeDetectorRef, priority?: Priority): T
  transform<T>(target: any, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined {

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (cdRef == null) {
        throw new Error('InPipe: <ChangeDetectorRef> not provided!')
      }
    }

    priority = priority || this._defaultPriority || Priority.normal;

    this._subscribe(target, cdRef, priority);

    return this._latestValue;
  }

  private _subscribe(target: any, cdRef: ChangeDetectorRef, priority: Priority): void {

    if (this._target === target) {
      return;
    }

    this._target = target;

    if (this._subscriptionStrategy) {
      this._subscriptionStrategy.dispose();
    }

    this._getStrategy(target).attach(target, (value) => {
      this._latestValue = value;
      detectChanges(cdRef, priority);
    });
  }

  private _getStrategy(target: any): SubscriptionStrategy {
    if (isSignal(target)) {
      return new SignalStrategy(this._injector);
    }
    if (isSubscribable(target)) {
      return new SubscribableStrategy();
    }
    if (isPromiseLike(target)) {
      return new PromiseLikeStrategy()
    }

    throw new Error('InPipe: Invalid subscrition target!');
  }

  ngOnDestroy(): void {
    if (this._subscriptionStrategy) {
      this._subscriptionStrategy.dispose();
    }
  }

}
