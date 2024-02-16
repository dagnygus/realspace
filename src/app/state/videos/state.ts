import { Injectable } from "@angular/core";
import { VideosState } from "../../models/models";
import { BaseStateRef } from "../base-state-ref";

export const initialVideosState: VideosState = {
  links: []
}

@Injectable({ providedIn: 'root' })
export class VideosRef extends BaseStateRef<VideosState> {
  constructor() {
    super('videos');
  }
}
