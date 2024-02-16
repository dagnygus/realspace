import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'profileSrc',
  standalone: true
})
export class ProfileSrcPipe implements PipeTransform {
  transform(src: string): string {
    return `https://image.tmdb.org/t/p/original${src}`;
  }
}

@Pipe({
  name: 'profileSrcSet',
  standalone: true
})
export class ProfileSrcSetPipe implements PipeTransform {
  transform(src: string): string {
    return `https://image.tmdb.org/t/p/w45${src} 45w, https://image.tmdb.org/t/p/w185${src} 185w, https://image.tmdb.org/t/p/w300${src} 300w, https://image.tmdb.org/t/p/original${src} 600w`;
  }
}
