'use client';
import React, { useEffect, useState } from 'react';

export default function MoviePageClient({ id, movie: serverMovie }) {
  const [movie, setMovie] = useState(serverMovie || null);
  const [loading, setLoading] = useState(!serverMovie);

  useEffect(() => {
    if (!id || movie) return; // safety check, no need to fetch if we already have the movie

    async function fetchMovie() {
      setLoading(true);
      try {
        const res = await fetch(`/api/movie/${id}`);
        console.log('Fetch URL:', `/api/movie/${id}`);
        console.log('Fetch status:', res.status);

        const data = await res.json();
        console.log('API returned:', data);

        if (data.movie) {
          setMovie(data.movie);
        } else {
          console.warn('Movie not found in API response');
        }
      } catch (err) {
        console.error('Failed to fetch movie:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMovie();
  }, [id, movie]);

  // If server provided movie data, render poster, title and overview immediately
  if (movie) {
    const posterPath = movie.poster_path || movie.backdrop_path;
    const imgSrc = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '/placeholder.png';

    return (
      <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row">
        <img
          src={imgSrc}
          alt={movie.title || movie.name || 'Movie poster'}
          className="rounded-lg w-full md:w-1/3 shadow-md object-cover"
          width={192}
          height={288}
        />
        <div className="md:ml-8 mt-4 md:mt-0">
          <h1 className="text-4xl font-bold">{movie.title || movie.name}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {movie.release_date ? `Released: ${movie.release_date}` : null}
          </p>
          <div className="mt-4 text-gray-800">
            <p>{movie.overview || 'No description available.'}</p>
          </div>
          {/* ...existing client UI (buttons, watchlinks etc.)... */}
        </div>
      </div>
    );
  }

  // Fallback: no server movie data — keep minimal UI (you can add client fetch here)
  return (
    <div className="container mx-auto px-4 py-10">
      <p className="text-center text-gray-600">Loading movie details...</p>
      {/* ...existing client UI that fetches details by id if needed... */}
    </div>
  );
}
