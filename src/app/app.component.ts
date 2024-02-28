import { DestroyRef, inject } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzScheduler, Priority, detectChanges, initializeComponent } from './noop-zone';
import { asyncScheduler, observeOn, switchMap, take } from 'rxjs';
import { AppViewModel } from './app.vm';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ AppViewModel ]
})
export class AppComponent  {
  cdRef = initializeComponent(this);
  vm = inject(AppViewModel);
  Priority = Priority;
  nzSchduler = inject(NzScheduler);

  constructor() {
    
    this.nzSchduler.onStable.pipe(
      take(1),
      switchMap(() => this.vm.sidenavOpen$),
      observeOn(asyncScheduler),
      takeUntilDestroyed()
    ).subscribe(() => detectChanges(this.cdRef));

  }

}
