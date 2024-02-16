import { inject } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Priority, detectChanges, initializeComponent } from './noop-zone';
import { asyncScheduler, observeOn } from 'rxjs';
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

  constructor() {

    this.vm.sidenavOpen$.pipe(
      observeOn(asyncScheduler),
      takeUntilDestroyed()
    ).subscribe(() => {
      detectChanges(this.cdRef);
    });

  }

}
