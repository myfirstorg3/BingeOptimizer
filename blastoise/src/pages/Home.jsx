import React from 'react';
import Cards from '../components/Cards';
import useDB from '../db/db';
import { Link } from 'react-router-dom';

const Home = () => {
  const movies = useDB(); // Custom hook hehe

  if (!movies || movies.length === 0) {
    return (
      
      <div>Loading...</div>
    
    ); 
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {movies.map((movie) => (
        <Link key={movie.id} to={`/media/${movie.id}`}> 
          <Cards 
            title={movie.title}
            poster={movie.poster}
            rating={movie.rating}
            releaseDate={movie.year}
          />
        </Link>
      ))}
    </div>
  );
};

export default Home;