import { NextResponse } from 'next/server';

export async function GET(request, { params, searchParams }) {
	// unwrap if Next provided Promises for params/searchParams
	const resolvedParams = params && typeof params.then === 'function' ? await params : params;
	const resolvedSearchParams =
		searchParams && typeof searchParams.then === 'function' ? await searchParams : searchParams;

	// Normalize id from resolved params or searchParams; support arrays and alternate names
	const rawId =
		resolvedParams?.id ?? resolvedParams?.movieId ?? resolvedSearchParams?.id ?? resolvedSearchParams?.movieId;
	let id;
	if (Array.isArray(rawId)) {
		id = rawId[0];
	} else if (rawId != null) {
		id = String(rawId);
	} else {
		id = undefined;
	}

	if (!id) {
		return new Response(JSON.stringify({ error: 'Missing movie id' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const tmdbKey = process.env.TMDB_API_KEY;
	if (!tmdbKey) {
		return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(
			id
		)}/watch/providers?api_key=${encodeURIComponent(tmdbKey)}`;
		const res = await fetch(url);
		const data = await res.json();
		return new Response(JSON.stringify(data), { status: res.status, headers: { 'Content-Type': 'application/json' } });
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Failed to fetch providers' }), {
			status: 502,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
