import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzIfModule, Priority, initializeComponent } from '../../../noop-zone';
import { MatButtonModule } from '@angular/material/button'
import { RouterOutletExtensionDirective } from '../../directives/router-outlet-extension.directive';
import { AppRoutingModule } from '../../../app-routing.module';
import { RealspaceHeaderComponent } from '../realspace-header/realspace-header.component';
import { AppViewModel } from '../../../app.vm';
import { Router, NavigationEnd } from '@angular/router';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { asapScheduler, filter, subscribeOn } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-realspace-content',
  standalone: true,
  imports: [
    AppRoutingModule,
    MatButtonModule,
    RouterOutletExtensionDirective,
    RealspaceHeaderComponent,
    NzIfModule,
  ],
  templateUrl: './realspace-content.component.html',
  styleUrl: './realspace-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealspaceContentComponent {
  Priority = Priority;
  cdRef = initializeComponent(this, Priority.immediate);
  vm = inject(AppViewModel);

  constructor(router: Router, scrollable: CdkScrollable) {
    router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      subscribeOn(asapScheduler),
      takeUntilDestroyed()
    ).subscribe(() => scrollable.scrollTo({ top: 0,  behavior: 'smooth' }));
  }
}
