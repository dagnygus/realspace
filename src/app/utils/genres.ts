export enum Genre {
  Action = 28,
  Adventure = 12,
  Animation = 16,
  Comedy = 35,
  Crime = 80,
  Documentary = 99,
  Drama = 18,
  Family = 10751,
  Fantasy = 14,
  History = 36,
  Horron = 27,
  Music = 10402,
  Mystery = 9648,
  Romance = 10749,
  ScienceFiction = 878,
  TVMovie = 10770,
  Thriller = 53,
  War = 10752,
  Western = 37
}
export const genderIds = [ 28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37 ];

const _genreMap = new Map<number, string>()

_genreMap.set(Genre.Action, Genre[Genre.Action]);
_genreMap.set(Genre.Adventure, Genre[Genre.Adventure]);
_genreMap.set(Genre.Animation, Genre[Genre.Animation]);
_genreMap.set(Genre.Comedy, Genre[Genre.Comedy]);
_genreMap.set(Genre.Crime, Genre[Genre.Crime]);
_genreMap.set(Genre.Crime, Genre[Genre.Crime]);
_genreMap.set(Genre.Documentary, Genre[Genre.Documentary]);
_genreMap.set(Genre.Drama, Genre[Genre.Drama]);
_genreMap.set(Genre.Family, Genre[Genre.Family]);
_genreMap.set(Genre.Fantasy, Genre[Genre.Fantasy]);
_genreMap.set(Genre.History, Genre[Genre.History]);
_genreMap.set(Genre.Horron, Genre[Genre.Horron]);
_genreMap.set(Genre.Music, Genre[Genre.Music]);
_genreMap.set(Genre.Mystery, Genre[Genre.Mystery]);
_genreMap.set(Genre.Romance, Genre[Genre.Romance]);
_genreMap.set(Genre.ScienceFiction, "Science Fiction");
_genreMap.set(Genre.TVMovie, 'TV Movie');
_genreMap.set(Genre.Thriller, Genre[Genre.Thriller])
_genreMap.set(Genre.War, Genre[Genre.War]);
_genreMap.set(Genre.Western, Genre[Genre.Western]);

export const genreMap = _genreMap;
