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

	// Helper homepage mapping for common providers (include Paramount+)
	const providerHome = {
		Netflix: 'https://www.netflix.com',
		'Prime Video': 'https://www.primevideo.com',
		'Amazon Prime Video': 'https://www.primevideo.com',
		Shudder: 'https://www.shudder.com',
		Hulu: 'https://www.hulu.com',
		'Disney Plus': 'https://www.disneyplus.com',
		'Paramount+': 'https://www.paramountplus.com',
	};

	const [providersData, setProvidersData] = useState(null);
	const [provError, setProvError] = useState(false);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/movie/${encodeURIComponent(id)}`);
				if (!res.ok) throw new Error('providers fetch failed');
				const json = await res.json();
				if (!cancelled) setProvidersData(json);
			} catch (e) {
				if (!cancelled) setProvError(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id]);

	// Choose region(s) to show. Render below description.
	function ProvidersIcons({ regionCode = 'US' }) {
		const region = providersData?.results?.[regionCode];
		if (!region) return null;

		// canonicalize provider names so variants map to a single canonical entry
		const canonicalize = (name) => {
			if (!name) return name;
			const n = name.toLowerCase();

			// Netflix variants -> Netflix
			if (n.includes('netflix')) return 'Netflix';
			// Paramount variants -> Paramount+
			if (n.includes('paramount')) return 'Paramount+';
			// Prime/HBO/Disney heuristics (add more when needed)
			if (n.includes('prime video') || n.includes('amazon prime')) return 'Prime Video';
			if (n.includes('disney') || n.includes('disney+')) return 'Disney Plus';
			if (n.includes('hulu')) return 'Hulu';
			if (n.includes('shudder')) return 'Shudder';

			// fallback: title-case the original name
			return name;
		};

		// build tiered lists but dedupe by canonical name across all tiers
		const seen = new Set();
		const pickTier = (key) => {
			const list = region[key] || [];
			const out = [];
			for (const p of list) {
				const canonical = canonicalize(p.provider_name);
				if (seen.has(canonical)) continue;
				seen.add(canonical);
				// keep original provider object (for logo etc.) but attach canonical
				out.push({ ...p, canonical_name: canonical });
			}
			return out;
		};

		const flatrate = pickTier('flatrate');
		const rent = pickTier('rent');
		const buy = pickTier('buy');

		if (flatrate.length === 0 && rent.length === 0 && buy.length === 0) return null;

		const rows = [
			{ list: flatrate, sr: 'Subscription' },
			{ list: rent, sr: 'Rent' },
			{ list: buy, sr: 'Buy' },
		];

		return (
			<section className="mt-6 p-4 border rounded">
				<h3 className="sr-only">Where to watch ({regionCode})</h3>
				{rows.map((row, idx) => {
					if (!row.list || row.list.length === 0) return null;
					return (
						<div key={idx} className="flex items-center gap-3 mb-2">
							<span className="sr-only">{row.sr}</span>
							{row.list.map((p) => {
								// use canonical name for title/link lookup
								const displayName = p.canonical_name || p.provider_name;
								const logo = p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null;
								const href =
									providerHome[displayName] ??
									`https://www.google.com/search?q=${encodeURIComponent(displayName)}`;
								return (
									<a
										key={displayName}
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										title={displayName}
										className="block w-10 h-10 rounded overflow-hidden bg-white flex items-center justify-center"
										aria-label={`${row.sr}: ${displayName}`}
									>
										{logo ? (
											<img
												src={logo}
												alt={displayName}
												style={{ maxWidth: '100%', maxHeight: '100%' }}
											/>
										) : (
											<span className="text-xs">{displayName}</span>
										)}
									</a>
								);
							})}
						</div>
					);
				})}
			</section>
		);
	}

	// If server provided movie data, render poster, title and overview immediately
	if (movie) {
		const posterPath = movie.poster_path || movie.backdrop_path;
		const imgSrc = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '/placeholder.png';

		return (
			<main className="max-w-4xl mx-auto p-4">
				<div className="flex gap-6 items-start">
					{/* Changed: reduce overall size by 25% (maxWidth 420 -> 315) and keep aspect ratio */}
					<img
						src={imgSrc}
						alt={movie.title || movie.name || 'Movie poster'}
						className="rounded shadow-md object-contain"
						style={{ maxWidth: 315, width: '100%', height: 'auto' }}
					/>
					<div className="flex-1">
						<h1 className="text-2xl font-bold">{movie.title || movie.name}</h1>
						<p className="text-sm text-gray-600 mt-2">
							{movie.release_date ? `Released: ${movie.release_date}` : null}
						</p>
						<div className="mt-4 text-gray-800">
							<p>{movie.overview || 'No description available.'}</p>
						</div>

						{/* Providers icons box appears here, below the description */}
						{providersData && <ProvidersIcons regionCode="US" />}
						{providersData && <ProvidersIcons regionCode="GB" />}
						{provError && <p className="mt-2 text-sm text-gray-500">Provider information unavailable.</p>}
					</div>
				</div>
			</main>
		);
	}

	// Fallback: minimal UI if no server movie data (could fetch details client-side)
	return (
		<main className="max-w-4xl mx-auto p-4">
			<p className="text-center text-gray-600">Loading movie details...</p>
		</main>
	);
}
