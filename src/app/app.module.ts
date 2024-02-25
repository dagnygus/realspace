import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { InPipeModule, NoopZoneEnviromentModule, NzDetachedViewModule, NzLocalViewModule, Priority, inPipeDefaultPriority, patchNgNoopZoneForAngularCdk, provideNzDetachedViewConfiguration, provideNzForConfiguration, provideNzLetConfiguration } from './noop-zone';
import { RealspaceContentComponent } from './common/components/realspace-content/realspace-content.component';
import { RealspaceSidenavContentComponent } from './common/components/realspace-sidenav-content/realspace-sidenav-content.component';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { StoreRouterConnectingModule, routerReducer } from '@ngrx/router-store';
import { NZ_LET_CONFIG, NZ_FOR_CONFIG, NZ_DETACHED_VIEW_CONFIG } from './utils/constants';
import { CustomRouterSerializer } from './state/router/router-serializer';
import { nowPlayingMoviesReducer } from './state/now-playing-movie-list/reducer';
import { popularMoviesReducer } from './state/popular-movie-list/reducer';
import { topRatedMoviesReducer } from './state/top-rated-movie-list/reducer';
import { upcomingMoviesReducer } from './state/upcoming-movie-list/reducer';
import { HttpClientModule } from '@angular/common/http';
import { NowPlaingMoviesEffects } from './state/now-playing-movie-list/effects';
import { PopularMoviesEffects } from './state/popular-movie-list/effects';
import { TopRatedMoviesEffects } from './state/top-rated-movie-list/effects';
import { provideCustomImageLoader } from './utils/image-loader';
import { UpcomingMoviesEffects } from './state/upcoming-movie-list/effects';
import { RealspaceHeaderComponent } from './common/components/realspace-header/realspace-header.component';
import { PortalModule } from '@angular/cdk/portal';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    InPipeModule,
    NzLocalViewModule,
    NzDetachedViewModule,
    MatSidenavModule,
    PortalModule,
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
    provideCustomImageLoader(),
    provideNzLetConfiguration(NZ_LET_CONFIG),
    provideNzForConfiguration(NZ_FOR_CONFIG),
    provideNzDetachedViewConfiguration(NZ_DETACHED_VIEW_CONFIG),
    inPipeDefaultPriority(Priority.immediate),
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
    ])
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    patchNgNoopZoneForAngularCdk();
  }
}
