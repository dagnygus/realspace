import { AfterViewInit, DestroyRef, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InPipeModule, NzDetachedViewModule, Priority, initializeComponent } from '../../../noop-zone';
import { AppViewModel } from '../../../app.vm';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { asapScheduler, asyncScheduler, delay, distinctUntilChanged, filter, fromEvent, map, observeOn, skip, subscribeOn } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Platform } from '@angular/cdk/platform';

@Component({
  selector: 'header[realspace]',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    InPipeModule,
    RouterModule,
    NzDetachedViewModule,
    FormsModule,
    ReactiveFormsModule,
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
  @ViewChild('searchboxInput', { static: true }) inputRef: ElementRef<HTMLInputElement> | null = null;

  ngAfterViewInit(): void {

    const pradicateFn = () =>
      this.vm.searchBoxFormControl.value === '' &&
      !this.breakpointObserver.isMatched('(min-width: 562px)')

    this.vm.searchboxExpanded$.pipe(
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
