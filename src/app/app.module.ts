import { NgModule, NgZone } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { InPipeModule, NoopZoneEnviromentModule, NzDetachedViewModule, NzLetModule, NzLocalViewModule, NzScheduler, Priority, inPipeDefaultPriority, patchNgNoopZoneForAngularCdk, provideNzDetachedViewConfiguration, provideNzForConfiguration, provideNzLetConfiguration, provideNzWatchConfiguration } from './noop-zone';
import { RealspaceContentComponent } from './common/components/realspace-content/realspace-content.component';
import { RealspaceSidenavContentComponent } from './common/components/realspace-sidenav-content/realspace-sidenav-content.component';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { StoreRouterConnectingModule, routerReducer } from '@ngrx/router-store';
import { NZ_LET_CONFIG, NZ_FOR_CONFIG, NZ_WATCH_CONFIG, patchRouterForHydrationAndNoopZoneEnviroment } from './utils/utils';
import { CustomRouterSerializer } from './state/router/router-serializer';
import { nowPlayingMoviesReducer } from './state/now-playing-movie-list/reducer';
import { popularMoviesReducer } from './state/popular-movie-list/reducer';
import { topRatedMoviesReducer } from './state/top-rated-movie-list/reducer';
import { upcomingMoviesReducer } from './state/upcoming-movie-list/reducer';
import { NowPlaingMoviesEffects } from './state/now-playing-movie-list/effects';
import { PopularMoviesEffects } from './state/popular-movie-list/effects';
import { TopRatedMoviesEffects } from './state/top-rated-movie-list/effects';
import { UpcomingMoviesEffects } from './state/upcoming-movie-list/effects';
import { RealspaceHeaderComponent } from './common/components/realspace-header/realspace-header.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { asyncScheduler, firstValueFrom, observeOn, take } from 'rxjs';

(NgZone.assertInAngularZone as any) = function () { return ; }

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    InPipeModule,
    NzLocalViewModule,
    NzDetachedViewModule,
    NzLetModule,
    MatSidenavModule,
    NoopZoneEnviromentModule,
    RealspaceContentComponent,
    RealspaceHeaderComponent,
    RealspaceSidenavContentComponent,
    StoreRouterConnectingModule.forRoot({
      serializer: CustomRouterSerializer
    })
  ],
  providers: [
    provideHttpClient(withFetch()),
    provideNzLetConfiguration(NZ_LET_CONFIG),
    provideNzForConfiguration(NZ_FOR_CONFIG),
    inPipeDefaultPriority(Priority.immediate),
    provideNzWatchConfiguration(NZ_WATCH_CONFIG),
    provideStore({
      router: routerReducer,
      nowPlayingMovies: nowPlayingMoviesReducer,
      popularMovies: popularMoviesReducer,
      topRatedMovies: topRatedMoviesReducer,
      upcomingMovies: upcomingMoviesReducer,
    }),
    provideEffects([
      NowPlaingMoviesEffects,
      PopularMoviesEffects,
      TopRatedMoviesEffects,
      UpcomingMoviesEffects,
    ]),
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    patchRouterForHydrationAndNoopZoneEnviroment();
    patchNgNoopZoneForAngularCdk();
  }
}
