import { createAction, props } from "@ngrx/store";
import { VideosState } from "../../models/abstract-models";

export const enum VideosActionNames {
  getVideosForMovieById = '[Videos] get videos for movie by id',
  getVideosForMovieByIdStart = '[Videos] get videos for movie by id start',
  updateVideosState = '[Videos] update videos state',
  videosStateError = '[Videos] videos state error',
  clearVideosSate = '[Videos] clear videos state',
}

export const getVideosForMovieById = createAction(VideosActionNames.getVideosForMovieById, props<{ id: number }>());
export const getVideosForMovieByIdStart = createAction(VideosActionNames.getVideosForMovieByIdStart, props<{ id: number }>());
export const updateVideosState = createAction(VideosActionNames.updateVideosState, props<{ oldState: VideosState, newState: VideosState }>());
export const videosStateError = createAction(VideosActionNames.videosStateError, props<{ error: any }>());
export const clearVideosState = createAction(VideosActionNames.clearVideosSate);
