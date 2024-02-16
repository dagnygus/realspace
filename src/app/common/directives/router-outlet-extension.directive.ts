import { ChangeDetectorRef, Directive, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, distinctUntilChanged, filter, map } from 'rxjs';
import { detectChanges } from '../../noop-zone';

@Directive({
  selector: 'router-outlet',
  standalone: true
})
export class RouterOutletExtensionDirective implements OnDestroy {

  private _subscription: Subscription

  constructor(router: Router, cdRef: ChangeDetectorRef) {
    this._subscription = router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => router.routerState.snapshot.root.firstChild?.component),
      distinctUntilChanged()
    ).subscribe(() => {
      detectChanges(cdRef)
    })
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

}
