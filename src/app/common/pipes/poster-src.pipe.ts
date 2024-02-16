import { Pipe, PipeTransform } from "@angular/core";

const _BASE_POSTER_URL = 'https://image.tmdb.org/t/p/'

@Pipe({
  name: 'posterSrc',
  standalone: true
})
export class PosterSrcPipe implements PipeTransform {
  transform(src: string | undefined | null): string {
    if (src == null) {
      return 'assets/no_poster_w342.jpg'
    } else {
      return `https://image.tmdb.org/t/p/w342${src}`
    }
  }
}

@Pipe({
  name: 'posterSrcSet',
  standalone: true
})
export class PosterSrcSetPipe implements PipeTransform {
  transform(srcset: string | undefined | null): string {
    if (srcset == null) {
      return 'assets/no_poster_w92.jpg 92w, assets/no_poster_w154.jpg 154w, assets/no_poster_w185.jpg 185w, assets/no_poster_w342.jpg 342w, assets/no_poster_w500.jpg 500w, assets/no_poster_w780.jpg 780w, assets/no_poster_original.jpg 1000w'
    } else {
      return `https://image.tmdb.org/t/p/w92${srcset} 92w, https://image.tmdb.org/t/p/w154${srcset} 154w, https://image.tmdb.org/t/p/w185${srcset} 185w, https://image.tmdb.org/t/p/w342${srcset} 342w, https://image.tmdb.org/t/p/w500${srcset} 500w, https://image.tmdb.org/t/p/w780${srcset} 780w, https://image.tmdb.org/t/p/original 1000w`
    }
  }
}


