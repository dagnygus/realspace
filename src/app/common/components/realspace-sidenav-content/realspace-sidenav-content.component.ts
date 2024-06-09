import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-realspace-sidenav-content',
  standalone: true,
  imports: [
    MatButtonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './realspace-sidenav-content.component.html',
  styleUrl: './realspace-sidenav-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealspaceSidenavContentComponent {

}
