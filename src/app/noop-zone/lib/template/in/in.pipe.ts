import { ChangeDetectorRef, Inject, OnDestroy, Optional, Pipe, PipeTransform } from "@angular/core";
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

@Pipe({ name: 'in' , standalone: true, pure: false})
export class InPipe implements PipeTransform, OnDestroy {

  private _subscriptionStrategy: SubscriptionStrategy | null = null;
  private _latestValue: any;

  constructor(@Optional() @Inject(NZ_IN_PIPE_DEFAULT_PRIORITY) private _defaultPriority: Priority | null) {
    assertNoopZoneEnviroment();
  }

  transform<T>(value: Observable<T>, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined;
  transform<T>(value: Subscribable<T>, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined;
  transform<T>(value: PromiseLike<T>, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined;
  transform<T>(value: Promise<T>, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined;
  transform<T>(value: any, cdRef: ChangeDetectorRef, priority?: Priority): T | null | undefined {

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (cdRef == null) {
        throw new Error('InPipe: <ChangeDetectorRef> not provided!')
      }
    }

    priority = priority || this._defaultPriority || Priority.normal;
    this._subscribe(value, cdRef, priority);


    return this._latestValue;
  }

  private _subscribe(target: any, cdRef: ChangeDetectorRef, priority: Priority): void {

    if (isSubscribable(target)) {

      if (!(this._subscriptionStrategy && this._subscriptionStrategy instanceof SubscribableStrategy)) {
        if (this._subscriptionStrategy) { this._subscriptionStrategy.dispose(); }
        this._subscriptionStrategy = new SubscribableStrategy();
        this._subscriptionStrategy.attach(target, (value) => {
          this._latestValue = value;
          detectChanges(cdRef, priority);
        });

      }

      return;
    }

    if (isPromiseLike(target)) {

      if (!(this._subscriptionStrategy && this._subscriptionStrategy instanceof PromiseLikeStrategy)) {
        if (this._subscriptionStrategy) { this._subscriptionStrategy.dispose(); }
        this._subscriptionStrategy = new PromiseLikeStrategy();
        this._subscriptionStrategy.attach(target, (value) => {
          this._latestValue = value
          detectChanges(cdRef, priority);
        });
      }

      return;
    }
  }

  ngOnDestroy(): void {
    if (this._subscriptionStrategy) {
      this._subscriptionStrategy.dispose();
    }
  }

}
