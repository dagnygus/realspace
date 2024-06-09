import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { Priority, inPipeDefaultPriority, provideNoopZoneEnviroment, provideNzForConfiguration, provideNzLetConfiguration, provideNzWatchConfiguration } from './noop-zone';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import { NowPlaingMoviesEffects } from './state/now-playing-movie-list/effects';
import { nowPlayingMoviesReducer } from './state/now-playing-movie-list/reducer';
import { PopularMoviesEffects } from './state/popular-movie-list/effects';
import { popularMoviesReducer } from './state/popular-movie-list/reducer';
import { CustomRouterSerializer } from './state/router/router-serializer';
import { TopRatedMoviesEffects } from './state/top-rated-movie-list/effects';
import { topRatedMoviesReducer } from './state/top-rated-movie-list/reducer';
import { UpcomingMoviesEffects } from './state/upcoming-movie-list/effects';
import { upcomingMoviesReducer } from './state/upcoming-movie-list/reducer';
import { NZ_LET_CONFIG, NZ_FOR_CONFIG, NZ_WATCH_CONFIG, patchRouterForHydrationAndNoopZoneEnviroment } from './utils/utils';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideNoopZoneEnviroment(),
    provideHttpClient(withFetch()),
    provideNzLetConfiguration(NZ_LET_CONFIG),
    provideNzForConfiguration(NZ_FOR_CONFIG),
    inPipeDefaultPriority(Priority.immediate),
    provideNzWatchConfiguration(NZ_WATCH_CONFIG),
    provideRouterStore({ serializer: CustomRouterSerializer }),
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
    provideAnimations()
  ]
};
