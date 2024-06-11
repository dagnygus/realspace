import { DestroyRef, Injector, effect, inject } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InPipeModule, NzDetachedViewModule, NzLetModule, NzLocalViewModule, NzScheduler, Priority, detectChanges, initializeComponent, patchNgNoopZoneForAngularCdk } from './noop-zone';
import { asyncScheduler, observeOn, switchMap, take } from 'rxjs';
import { AppViewModel } from './app.vm';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RealspaceContentComponent } from './common/components/realspace-content/realspace-content.component';
import { RealspaceHeaderComponent } from './common/components/realspace-header/realspace-header.component';
import { RealspaceSidenavContentComponent } from './common/components/realspace-sidenav-content/realspace-sidenav-content.component';
import { patchRouterForHydrationAndNoopZoneEnviroment } from './utils/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    InPipeModule,
    NzLocalViewModule,
    NzDetachedViewModule,
    NzLetModule,
    MatSidenavModule,
    RealspaceContentComponent,
    RealspaceHeaderComponent,
    RealspaceSidenavContentComponent,
  ],
  providers: [
    AppViewModel,
  ]
})
export class AppComponent  {
  cdRef = initializeComponent(this);
  vm = inject(AppViewModel);
  Priority = Priority;
  nzSchduler = inject(NzScheduler);

  constructor() {
    patchRouterForHydrationAndNoopZoneEnviroment();
    patchNgNoopZoneForAngularCdk();

    const injector = inject(Injector);
    this.nzSchduler.onStable.pipe(
      take(1),
      switchMap(() => toObservable(this.vm.sidenavOpen, { injector })),
      observeOn(asyncScheduler),
      takeUntilDestroyed()
    ).subscribe(() => detectChanges(this.cdRef));
  }

}
