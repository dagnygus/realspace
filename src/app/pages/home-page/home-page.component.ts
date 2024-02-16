import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { initializeComponent } from '../../noop-zone';
import { MovieSliderComponent } from '../../common/components/movie-slider/movie-slider.component';
import { HomePageViewModel } from './home-page.vm';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    MovieSliderComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ HomePageViewModel ]
})
export class HomePageComponent {
  cdRef = initializeComponent(this);
  vm = inject(HomePageViewModel)
}
