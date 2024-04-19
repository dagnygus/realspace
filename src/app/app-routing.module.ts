import { NgModule } from '@angular/core';
import { PreloadAllModules, Route, RouterModule, Routes, UrlSegment } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { GENRE_ID_REGEX, MOVIE_CATEGORIES, ROUTER_KIND } from './utils/utils';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';

const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    component: HomePageComponent
  },

  {
    path: ':movieListKind/:movieListParam',
    canMatch:  [
        (_: Route, segments: UrlSegment[]) => {
          if (ROUTER_KIND.includes(segments[0].path)) {
            if (segments[0].path === 'genre' && GENRE_ID_REGEX.test(segments[1].path)) {
              return true;
            }
            if (segments[0].path === 'category' && MOVIE_CATEGORIES.includes(segments[1].path)) {
              return true
            }
            if (segments[0].path === 'search' && segments[1].path.length > 0) {
              return true
            }
          }
        return false
      }
    ],
    loadChildren: () => import('./pages/movie-list-page/movie-list-page.component').then((m) => m.MOVIE_LIST_PAGE_ROUTES)
  },

  {
    path: 'movie/:movieId',
    loadChildren: () => import('./pages/movie-page/movie-page.component').then(m => m.MOVIE_PAGE_ROUTES)
  },

  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
