import { Injectable, IterableChangeRecord, NgIterable, Optional, SkipSelf, StaticProvider, TrackByFunction } from "@angular/core";
import { DefaultIterableChangeTrackerFactory } from "./default-iterable-change-tracker";


export interface IterableChangeObserver<T> {
  onAdd(record: IterableChangeRecord<T>, index: number | undefined): void;
  onRemove(record: IterableChangeRecord<T>, adjustedIndex: number): void;
  onMove(record: IterableChangeRecord<T>, adjustedPreviousIndex: number, currentIndex: number, changed: boolean): void;
  onUpdate(record: IterableChangeRecord<T>, index: number): void;
  onIterate(record: IterableChangeRecord<T>, index: number): void;
  onDone(): void;
}

export interface IterableChangeTracker<T> {
  findChanges(iterable: NgIterable<T> | null | undefined): boolean;
  applyChanges(observer: IterableChangeObserver<T>): void;
  reset(): void
  readonly length: number | undefined;
}

export interface IterableChangeTrackerFactory {
  supports(objects: any): boolean;
  create<V>(trackByFn?: TrackByFunction<V> | undefined | null): IterableChangeTracker<V>;
}

@Injectable({
  providedIn: 'root',
  useValue: new IterableChangeTrackers([new DefaultIterableChangeTrackerFactory()])
})
export class IterableChangeTrackers {
  constructor(private _factiories: IterableChangeTrackerFactory[]) {}

  static create(factories: IterableChangeTrackerFactory[], parent: IterableChangeTrackers): IterableChangeTrackers {
    if (parent != null) {
      factories = factories.concat(parent._factiories);
    }
    return new IterableChangeTrackers(factories);
  }

  static extend(factories: IterableChangeTrackerFactory[]): StaticProvider {
    return {
      provide: IterableChangeTrackers,
      useFactory: (parent: IterableChangeTrackers) => {
        return IterableChangeTrackers.create(
          factories,
          parent || new IterableChangeTrackers([new DefaultIterableChangeTrackerFactory()])
        );
      },
      deps: [[ IterableChangeTrackers, new SkipSelf(), new Optional ]]
    };
  }

  find(iterable: object): IterableChangeTrackerFactory {
    const factory = this._factiories.find((f) => f.supports(iterable))
    if (factory) {
      return factory;
    } else {
      throw new Error(`Cannot find iterable change tracker for ${typeof iterable}!`)
    }
  }
}
