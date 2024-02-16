import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'movieCardImgSrc',
  standalone: true,
})
export class MovieCardImgSrcPipe implements PipeTransform {
  transform(src: string) {
    return `https://image.tmdb.org/t/p/w300${src}`;
  }
}
