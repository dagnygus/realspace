import { Injectable } from "@angular/core";
import { VideosState } from "../../models/abstract-models";
import { BaseStateRef } from "../../models/object-model";

export const initialVideosState: VideosState = {
  links: []
}

@Injectable({ providedIn: 'root' })
export class VideosRef extends BaseStateRef<VideosState> {
  constructor() {
    super('videos');
  }
}
