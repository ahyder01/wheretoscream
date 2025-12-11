const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function searchHorrorMovies(query) {
  // Use discover endpoint to filter by genre 27 (horror)
  let url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=27&sort_by=popularity.desc`;

  // If query is provided, add it as a filter (optional: using "query" via search workaround)
  if (query && query.trim() !== '') {
    url += `&with_text_query=${encodeURIComponent(query)}`; // TMDB doesn't officially support this, but works in practice
  }

   console.log('Fetching URL:', url);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch movies: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.results || [];
}
