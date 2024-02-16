import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'imageSrc',
  standalone: true
})
export class ImageSrcPipe implements PipeTransform {
  transform(src: string) {
    return `https://image.tmdb.org/t/p/original${src}`;
  }

}
