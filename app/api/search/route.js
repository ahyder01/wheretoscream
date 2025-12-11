import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    // Use /search/movie endpoint for text search
    const url = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    console.log('Server fetching TMDB URL:', url);

    const res = await fetch(url);
    if (!res.ok) {
      console.error('TMDB fetch failed:', res.status, res.statusText);
      return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data.results || []);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
