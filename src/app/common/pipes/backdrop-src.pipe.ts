import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'backdropSrc',
  standalone: true
})
export class BackdropSrcPipe implements PipeTransform {
  transform(src: string): string {
    return `https://image.tmdb.org/t/p/original${src}`;
  }
}

@Pipe({
  name: 'backdropSrcSet',
  standalone: true
})
export class BackdropSrcSetPipe implements PipeTransform {
  transform(src: string): string {
    return `https://image.tmdb.org/t/p/w300${src} 300w, https://image.tmdb.org/t/p/w780${src} 780w, https://image.tmdb.org/t/p/w1280${src} 1280w, https://image.tmdb.org/t/p/original${src} 1920w`;
  }
}
