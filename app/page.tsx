'use client';

import { useState } from 'react';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(query) {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const results = await res.json();
      setMovies(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4">
      <SearchBar onSearch={handleSearch} />

      {loading && <p className="text-center mt-4">Loading...</p>}

      <div className="flex flex-wrap justify-center mt-8">
        {movies.length === 0 && !loading && (
          <p className="text-gray-400">Search for a horror movie above.</p>
        )}
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
