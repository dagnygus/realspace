import { ChangeDetectionStrategy, Component } from '@angular/core';
import { initializeComponent } from '../../noop-zone';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageNotFoundComponent {
  cdRef = initializeComponent(this);
}
