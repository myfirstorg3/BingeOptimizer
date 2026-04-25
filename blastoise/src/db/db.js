const movies = [
  {
    id: 1,
    title: "Border 2",
    poster:
      "https://m.media-amazon.com/images/M/MV5BYjdhNmE4MTItYjZlYi00MjQ2LTliOGMtN2ViMzU0M2M3ODMyXkEyXkFqcGc@._V1_.jpg",
    description: "A patriotic action drama based on war and courage.",
    year: 2026,
    rating: 8.4,
    type: "movie",
    genre: "Action",
    language: "Hindi",
    addedAt: "2026-04-12",
  },
  {
    id: 2,
    title: "Dhurandhar The Revenge",
    poster:
      "https://m.media-amazon.com/images/M/MV5BNzdkNjAxNWMtNWY3My00NTI1LTg2YWQtOGI3MDA0NzdhMjEyXkEyXkFqcGc@._V1_.jpg",
    description: "An intense revenge thriller with fiery action.",
    year: 2026,
    rating: 8.4,
    type: "movie",
    genre: "Thriller",
    language: "Hindi",
    addedAt: "2026-04-11",
  },
  {
    id: 3,
    title: "Mardaani 3",
    poster:
      "https://m.media-amazon.com/images/M/MV5BZjU1OWM4OGEtMGYzNi00MTNmLThjOGUtMjRlZmI5YjM4ODIxXkEyXkFqcGc@._V1_.jpg",
    description: "A gritty crime thriller led by a fearless cop.",
    year: 2026,
    rating: 8.4,
    type: "movie",
    genre: "Crime",
    language: "Hindi",
    addedAt: "2026-04-10",
  },
  {
    id: 4,
    title: "Breaking Bad",
    poster:
      "https://m.media-amazon.com/images/I/91+GrGr5TWL._AC_UF894,1000_QL80_.jpg",
    description: "A chemistry teacher turns into a drug kingpin.",
    year: 2008,
    rating: 9.5,
    type: "tv",
    genre: "Drama",
    language: "English",
    addedAt: "2026-04-09",
  },
  {
    id: 5,
    title: "Money Heist",
    poster:
      "https://m.media-amazon.com/images/I/61boFr6SYZL.jpg",
    description: "A mastermind leads the biggest heist in history.",
    year: 2017,
    rating: 8.2,
    type: "tv",
    genre: "Thriller",
    language: "Spanish",
    addedAt: "2026-04-08",
  },
  {
    id: 6,
    title: "Dark",
    poster:
      "https://image.tmdb.org/t/p/original/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    description: "A mystery thriller involving time travel and family secrets.",
    year: 2017,
    rating: 8.7,
    type: "tv",
    genre: "Sci-Fi",
    language: "German",
    addedAt: "2026-04-07",
  },
  {
    id: 7,
    title: "Attack on Titan",
    poster:
      "https://m.media-amazon.com/images/I/61t9ie31jgL.jpg",
    description: "Humanity fights for survival against giant titans.",
    year: 2013,
    rating: 9.1,
    type: "anime",
    genre: "Action",
    language: "Japanese",
    addedAt: "2026-04-06",
  },
  {
    id: 8,
    title: "Death Note",
    poster:
      "https://m.media-amazon.com/images/M/MV5BYmRkNzYzOGMtNjM3Mi00NmZiLTg4MzMtZWVlOTRhZDY4ZDY0XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    description: "A student gains a notebook that can kill anyone.",
    year: 2006,
    rating: 9.0,
    type: "anime",
    genre: "Mystery",
    language: "Japanese",
    addedAt: "2026-04-05",
  },
  {
    id: 9,
    title: "Your Name",
    poster:
      "https://m.media-amazon.com/images/M/MV5BMTIyNzFjNzItZmQ1MC00NzhjLThmMzYtZjRhN2Y3MmM2OGQyXkEyXkFqcGc@._V1_.jpg",
    description: "A beautifully emotional story of two strangers connected by fate.",
    year: 2016,
    rating: 8.8,
    type: "anime",
    genre: "Romance",
    language: "Japanese",
    addedAt: "2026-04-04",
  },
];

function DB() {
  return movies;
}

export default DB;