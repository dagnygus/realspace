import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AppRoutingModule } from '../../../app-routing.module';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-realspace-sidenav-content',
  standalone: true,
  imports: [
    MatButtonModule,
    AppRoutingModule,
    MatIconModule
  ],
  templateUrl: './realspace-sidenav-content.component.html',
  styleUrl: './realspace-sidenav-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealspaceSidenavContentComponent {

}
