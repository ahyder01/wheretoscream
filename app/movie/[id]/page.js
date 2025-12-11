import MoviePageClient from './MoviePageClient';
import Link from 'next/link';

export default async function MoviePageWrapper({ params }) {
	// unwrap if Next provided a Promise for params
	const resolvedParams = params && typeof params.then === 'function' ? await params : params;

	// simple sync resolution of id (matches route param usage)
	const rawId = resolvedParams?.id ?? resolvedParams?.movieId;
	if (!rawId) {
		return <p className="text-center mt-4 text-red-500">Movie ID not provided.</p>;
	}
	const id = Array.isArray(rawId) ? String(rawId[0]) : String(rawId);

	// Fetch movie details from TMDB to detect "not found"
	const tmdbKey = process.env.TMDB_API_KEY;
	if (!tmdbKey) {
		// fallback: let client handle it if API key is missing
		return <MoviePageClient id={id} />;
	}

	try {
		const res = await fetch(
			// include videos (so client can link to YouTube watch pages)
			`https://api.themoviedb.org/3/movie/${encodeURIComponent(
				id
			)}?api_key=${encodeURIComponent(tmdbKey)}&append_to_response=videos`,
			{ cache: 'no-store' }
		);
		if (res.status === 404) {
			return (
				<div className="text-center mt-6">
					<p className="text-lg font-semibold">Movie not found</p>
					<p className="mt-2 text-sm text-gray-600">No data for ID: {id}</p>
					<div className="mt-4">
						<Link href="/" className="text-blue-600 underline mr-4">
							Home
						</Link>
						<Link href={`/search?q=`} className="text-blue-600 underline">
							Search
						</Link>
					</div>
				</div>
			);
		}
		if (!res.ok) {
			return (
				<div className="text-center mt-6 text-red-500">
					<p>Unable to load movie data (status: {res.status}).</p>
				</div>
			);
		}
		const movieData = await res.json();
		// Pass movieData to client; MoviePageClient can use it if supported.
		return <MoviePageClient id={id} movie={movieData} />;
	} catch (e) {
		return (
			<div className="text-center mt-6 text-red-500">
				<p>Failed to fetch movie data.</p>
			</div>
		);
	}
}
