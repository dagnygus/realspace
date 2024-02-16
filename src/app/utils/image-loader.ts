import { IMAGE_LOADER, ImageLoaderConfig } from "@angular/common";
import { ValueProvider } from "@angular/core";

export function provideCustomImageLoader(): ValueProvider {
  return {
    provide: IMAGE_LOADER,
    useValue: (config: ImageLoaderConfig) => {
      return `https://image.tmdb.org/t/p/original${config.src}`
    }
  }
}
