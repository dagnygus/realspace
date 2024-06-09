import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzIfModule, Priority, initializeComponent } from '../../../noop-zone';
import { MatButtonModule } from '@angular/material/button'
import { RouterOutletExtensionDirective } from '../../directives/router-outlet-extension.directive';
import { RealspaceHeaderComponent } from '../realspace-header/realspace-header.component';
import { AppViewModel } from '../../../app.vm';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { asapScheduler, filter, subscribeOn } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-realspace-content',
  standalone: true,
  imports: [
    RouterModule,
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

    scrollable.elementScrolled().pipe(
      filter(() => this.vm.isSearchboxExpanded()),
      takeUntilDestroyed()
    ).subscribe(() => this.vm.collapseSearchbox());

  }

}
