import { Priority } from "../noop-zone";

export const NZ_IF_CONFIG = { optimized: true };
export const NZ_LET_CONFIG = { optimized: true, detach: true, defaultPriority: Priority.immediate };
export const NZ_FOR_CONFIG = { optimized: true };
export const NZ_DETACHED_VIEW_CONFIG = { notifyQueryView: false };

export const MOVIE_CATEGORIES = ['upcoming', 'top_rated', 'now_playing', 'popular'];
export const MAPED_MOVIE_CATEGORES: { [key: string]: string } = { upcoming: 'Upcoming', top_rated: 'Top Rated', now_playing: 'Now Playing', popular: 'Popular' }
export const SHARE_REPLAY_CONFIG = { bufferSize: 1, refCount: true }
export const ROUTER_KING = ['genre', 'category', 'search']
export const GENRE_ID_REGEX = /^(28|12|16|35|80|99|18|10751|14|36|27|10402|9648|10749|878|10770|53|10752|37)$/
