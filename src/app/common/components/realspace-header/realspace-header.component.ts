import { AfterViewInit, DestroyRef, ElementRef, Injector, OnDestroy, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InPipeModule, NzDetachedViewModule, NzIfModule, NzLetModule, Priority, initializeComponent } from '../../../noop-zone';
import { AppViewModel } from '../../../app.vm';
import { NavigationEnd, NavigationStart, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { asapScheduler, asyncScheduler, delay, distinctUntilChanged, filter, fromEvent, map, observeOn, skip, subscribeOn } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Platform } from '@angular/cdk/platform';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'header[realspace]',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    InPipeModule,
    NzIfModule,
    NzLetModule,
    RouterModule,
    NzDetachedViewModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule
  ],
  templateUrl: './realspace-header.component.html',
  styleUrl: './realspace-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealspaceHeaderComponent implements AfterViewInit {

  cdRef = initializeComponent(this, Priority.immediate);
  vm = inject(AppViewModel);
  breakpointObserver = inject(BreakpointObserver);
  destroyRef = inject(DestroyRef);
  platform = inject(Platform);
  router = inject(Router);
  injector = inject(Injector);
  @ViewChild('searchboxInput', { static: true }) inputRef: ElementRef<HTMLInputElement> | null = null;

  ngAfterViewInit(): void {

    const pradicateFn = () =>
      this.vm.searchBoxFormControl.value === '' &&
      !this.breakpointObserver.isMatched('(min-width: 562px)')

    toObservable(this.vm.searchboxExpanded, { injector: this.injector }).pipe(
      filter(pradicateFn),
      skip(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value) => {
      if (value) {
        this.inputRef!.nativeElement.focus();
      } else {
        this.inputRef!.nativeElement.blur();
      }
    });

    if (this.platform.isBrowser) {
      fromEvent(this.inputRef!.nativeElement, 'blur').pipe(
        filter(() => this.vm.isSearchboxExpanded()),
        observeOn(asyncScheduler),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        this.vm.collapseSearchbox();
      });
    }

  }
}
