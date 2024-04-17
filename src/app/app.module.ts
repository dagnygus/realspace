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
import { NZ_LET_CONFIG, NZ_FOR_CONFIG, NZ_WATCH_CONFIG } from './utils/utils';
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
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';

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
    // PortalModule,
    NoopZoneEnviromentModule,
    RealspaceContentComponent,
    RealspaceHeaderComponent,
    RealspaceSidenavContentComponent,
    // StoreModule.forRoot({
    //   router: routerReducer,
    //   nowPlayingMovies: nowPlayingMoviesReducer,
    //   popularMovies: popularMoviesReducer,
    //   topRatedMovies: topRatedMoviesReducer,
    //   upcomingMovies: upcomingMoviesReducer,
    //   customMovieList: customMovieListReducer,
    //   singleMovie: singleMovieReducer,
    //   videos: videosReducer,
    //   cast: castReducer,
    //   relatedMovies: relatedMoviesReducer
    // }),
    // EffectsModule.forRoot([
    //   NowPlaingMoviesEffects,
    //   PopularMoviesEffects,
    //   TopRatedMoviesEffects,
    //   UpcomingMoviesEffects,
    //   CustomMovieListEffects,
    //   SingleMovieEffects,
    //   VideosEffects,
    //   CastEffects,
    //   RelatedMoviesEffects
    // ]),
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
      // customMovieList: customMovieListReducer,
      // singleMovie: singleMovieReducer,
      // videos: videosReducer,
      // cast: castReducer,
      // relatedMovies: relatedMoviesReducer
    }),
    provideEffects([
      NowPlaingMoviesEffects,
      PopularMoviesEffects,
      TopRatedMoviesEffects,
      UpcomingMoviesEffects,
      // CustomMovieListEffects,
      // SingleMovieEffects,
      // VideosEffects,
      // CastEffects,
      // RelatedMoviesEffects
    ]),
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  private _hydrationReady = false;

  constructor(nzScheduler: NzScheduler, ngZone: NgZone) {

    const itSelf = this;
    const originalOnClick = RouterLink.prototype.onClick;

    RouterLink.prototype.onClick = function(
      button: number,
      ctrlKey: boolean,
      shiftKey: boolean,
      altKey: boolean,
      metaKey: boolean
    ) {
      if (itSelf._hydrationReady) {
        return originalOnClick.call(this, button, ctrlKey, shiftKey, altKey, metaKey);
      } else {
        return !(this as any).isAnchorElement;
      }
    }

    nzScheduler.onStable.pipe(take(1)).subscribe(() => {
      ngZone.onStable.emit();
      setTimeout(() => {
        this._hydrationReady = true;
      }, 0);
    });

    patchNgNoopZoneForAngularCdk();
  }
}
