import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CreditsFetchResult, MovieCategory, MovieDetailsFetchResult, MovieListFetchResult, VideosFetchResult } from "../../models/models";
import { Observable } from "rxjs";
import { Genre } from "../../utils/genres";

const _HTTP_OPTIONS = {
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGU2ZTIyYmRmYTk1NTIxYTM3MWEwMDcyMWZmZDVhNiIsInN1YiI6IjY1OTZlMzEwYTY5OGNmNGZiMTQzOWZiYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pc6O0Qkj-YxH3E6ZA1EIgFMLgZgRiORFB5cqVno_wIE'
  }
}

@Injectable({ providedIn: 'root' })
export class MoviesHttpService {

  // private _httpOptions = {
  //   headers: {
  //     accept: 'application/json',
  //     Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4ZGU2ZTIyYmRmYTk1NTIxYTM3MWEwMDcyMWZmZDVhNiIsInN1YiI6IjY1OTZlMzEwYTY5OGNmNGZiMTQzOWZiYyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pc6O0Qkj-YxH3E6ZA1EIgFMLgZgRiORFB5cqVno_wIE'
  //   }
  // }

  constructor(private _httpClient: HttpClient) {}

  getNowPlayingMovies(page: number): Observable<MovieListFetchResult> {
    return this._httpClient.get<MovieListFetchResult>(
      `https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=${page}`,
      _HTTP_OPTIONS
    );
  }

  getPopularMovies(page: number): Observable<MovieListFetchResult> {
    return this._httpClient.get<MovieListFetchResult>(
      `https://api.themoviedb.org/3/movie/popular?language=en-US&page=${page}`,
      _HTTP_OPTIONS
    );
  }

  getTopRatedMovies(page: number): Observable<MovieListFetchResult> {
    return this._httpClient.get<MovieListFetchResult>(
      `https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${page}`,
      _HTTP_OPTIONS
    );
  }

  getUpcomingMovies(page: number): Observable<MovieListFetchResult> {
    return this._httpClient.get<MovieListFetchResult>(
      `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=${page}`,
      _HTTP_OPTIONS
    );
  }

  getMoviesWithGenre(page: number, genre: Genre): Observable<MovieListFetchResult> {
    return this._httpClient.get<MovieListFetchResult>(
      `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc&with_genres=${genre}`,
      _HTTP_OPTIONS
    );
  }

  getMoviesWithCategory(page: number, category: MovieCategory):Observable<MovieListFetchResult> {
    switch (category) {
      case 'now_playing':
        return this.getNowPlayingMovies(page);
      case 'popular':
        return this.getPopularMovies(page);
      case 'top_rated':
        return this.getTopRatedMovies(page);
      case 'upcoming':
        return this.getUpcomingMovies(page);
    }
  }

  getMoviesWithKey(key: string): Observable<MovieListFetchResult> {
    return this._httpClient.get<MovieListFetchResult>(
      `https://api.themoviedb.org/3/search/movie?query=${key}&include_adult=false&language=en-US&page=1`,
      _HTTP_OPTIONS
    );
  }

  getMovieById(movieId: number): Observable<MovieDetailsFetchResult> {
    return this._httpClient.get<MovieDetailsFetchResult>(
      `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`,
      _HTTP_OPTIONS
    );
  }

  getVideosForMovieById(movieId: number): Observable<VideosFetchResult> {
    return this._httpClient.get<VideosFetchResult>(
      `https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`,
      _HTTP_OPTIONS
    );
  }

  getRelatedMovieListById(movieId: number): Observable<MovieListFetchResult> {
    return this._httpClient.get<MovieListFetchResult>(
      `https://api.themoviedb.org/3/movie/${movieId}/similar?language=en-US&page=1`,
      _HTTP_OPTIONS
    );
  }

  getCreditsById(movieId: number): Observable<CreditsFetchResult> {
    return this._httpClient.get<CreditsFetchResult>(
      `https://api.themoviedb.org/3/movie/${movieId}/credits?language=en-US`,
      _HTTP_OPTIONS
    );
  }
}
