import Link from 'next/link';

export default function MovieCard({ movie }) {
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '/placeholder.png';

  return (
    <Link href={`/movie/${movie.id}`} className="m-2 w-40 hover:scale-105 transition-transform">
      <div className="rounded-lg overflow-hidden shadow-lg">
        <img src={poster} alt={movie.title} className="w-full h-60 object-cover" />
        <div className="p-2">
          <h3 className="text-sm font-bold">{movie.title}</h3>
          <p className="text-xs text-gray-400">{movie.release_date?.slice(0, 4)}</p>
        </div>
      </div>
    </Link>
  );
}