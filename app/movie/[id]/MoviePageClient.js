'use client';
import React, { useEffect, useState } from 'react';

export default function MoviePageClient({ id, movie }) {
	// helper mappings
	const providerHome = {
		Netflix: 'https://www.netflix.com',
		'Prime Video': 'https://www.primevideo.com',
		'Amazon Prime Video': 'https://www.primevideo.com',
		Shudder: 'https://www.shudder.com',
		Hulu: 'https://www.hulu.com',
		'Disney Plus': 'https://www.disneyplus.com',
		'Paramount+': 'https://www.paramountplus.com',
		'Google Play': 'https://play.google.com/store/movies',
		'Apple TV': 'https://tv.apple.com',
		YouTube: 'https://www.youtube.com/movies',
		Vudu: 'https://www.vudu.com',
		'Microsoft Store': 'https://www.microsoft.com/store/movies',
		'FandangoNOW': 'https://www.fandangonow.com',
		'Rakuten TV': 'https://rakuten.tv',
		'Sky Store': 'https://www.skystore.com',
	};

	const providerSearchTemplates = {
		'Google Play': 'https://play.google.com/store/search?q={query}&c=movies',
		'Apple TV': 'https://tv.apple.com',
		YouTube: 'https://www.youtube.com/results?search_query={query}+movie',
		Vudu: 'https://www.vudu.com/content/search/results?search={query}',
		'Microsoft Store': 'https://www.microsoft.com/search?q={query}&form=MSNVS',
		'FandangoNOW': 'https://www.fandangonow.com/search/{query}',
		'Rakuten TV': 'https://rakuten.tv/search?search={query}',
		'Prime Video': 'https://www.amazon.com/s?k={query}&i=instant-video',
		'Disney Plus': 'https://www.disneyplus.com/search?q={query}',
		'Paramount+': 'https://www.paramountplus.com/search?q={query}',
		Netflix: 'https://www.netflix.com/search?q={query}',
		Hulu: 'https://www.hulu.com/search?q={query}',
		Shudder: 'https://www.shudder.com/search?search={query}',
		'Sky Store': 'https://www.skystore.com/search?q={query}',
	};

	const [providersData, setProvidersData] = useState(null);
	const [provError, setProvError] = useState(false);
	const [regionToShow, setRegionToShow] = useState('US');

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

	// choose single region to show based on browser locale (client-side) with fallback to first available
	useEffect(() => {
		if (!providersData?.results) return;
		let userRegion = 'US';
		try {
			const nav = typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage);
			const navLower = String(nav || '').toLowerCase();
			if (navLower.includes('gb') || navLower.includes('uk')) userRegion = 'GB';
		} catch (e) {
			/* ignore */
		}
		if (!providersData.results[userRegion]) {
			const first = Object.keys(providersData.results || {}).find(Boolean);
			if (first) userRegion = first;
		}
		setRegionToShow(userRegion);
	}, [providersData]);

	// canonicalization: map variants to canonical names (Netflix, Paramount+, Prime Video, etc.)
	const canonicalize = (name) => {
		if (!name) return name;
		const n = name.toLowerCase();
		if (n.includes('apple')) return 'Apple TV';
		if (n.includes('sky')) return 'Sky Store';
		if (n.includes('netflix')) return 'Netflix';
		if (n.includes('paramount')) return 'Paramount+';
		if (n.includes('prime video') || n.includes('amazon prime')) return 'Prime Video';
		if (n.includes('disney') || n.includes('disney+')) return 'Disney Plus';
		if (n.includes('hulu')) return 'Hulu';
		if (n.includes('shudder')) return 'Shudder';
		if (n.includes('google play')) return 'Google Play';
		if (n.includes('youtube')) return 'YouTube';
		// fallback: title-case original
		return name;
	};

	function ProvidersIcons({ regionCode = 'US' }) {
		const region = providersData?.results?.[regionCode];
		if (!region) return null;

		// dedupe providers across tiers by canonical name
		const seen = new Set();
		const pickTier = (key) => {
			const list = region[key] || [];
			const out = [];
			for (const p of list) {
				const canonical = canonicalize(p.provider_name);
				if (seen.has(canonical)) continue;
				seen.add(canonical);
				out.push({ ...p, canonical_name: canonical });
			}
			return out;
		};

		const flatrate = pickTier('flatrate');
		const rent = pickTier('rent');
		const buy = pickTier('buy');
		const rentOrBuy = [...rent, ...buy];

		if (flatrate.length === 0 && rentOrBuy.length === 0) return null;

		const rows = [
			{ list: flatrate, sr: 'Subscription' },
			{ list: rentOrBuy, sr: 'Rent or Buy' },
		];

		return (
			<section className="mt-6 p-4 border rounded">
				<h3 className="sr-only">Where to watch ({regionCode})</h3>
				{rows.map((row, idx) => {
					if (!row.list || row.list.length === 0) return null;
					return (
						<div key={idx} className="flex items-center gap-4 mb-3">
							<div className="w-28 text-sm font-medium text-gray-300">{row.sr}</div>
							<div className="flex items-center gap-3">
								{row.list.map((p) => {
									const displayName = p.canonical_name || p.provider_name;
									const logo = p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null;

									// determine href: prefer YouTube TMDB video, then providerSearchTemplates (with movie title),
									// then provider homepage. If none, render non-clickable icon.
									let href = null;
									// YouTube special: prefer actual watch link from TMDB videos
									if (displayName === 'YouTube' && movie?.videos?.results?.length) {
										const vids = movie.videos.results.filter((v) => v.site === 'YouTube' && v.key);
										let pick = vids.find((v) => {
											const t = String(v.type || '').toLowerCase();
											return t.includes('feature') || t.includes('full') || t.includes('movie') || t.includes('trailer');
										});
										if (!pick) pick = vids[0];
										if (pick) href = `https://www.youtube.com/watch?v=${pick.key}`;
									}
									if (!href) {
										if (movie?.title && providerSearchTemplates[displayName]) {
											href = providerSearchTemplates[displayName].replace('{query}', encodeURIComponent(movie.title));
										} else if (providerHome[displayName]) {
											href = providerHome[displayName];
										}
									}

									const content = logo ? (
										<img src={logo} alt={displayName} style={{ maxWidth: '100%', maxHeight: '100%' }} />
									) : (
										<span className="text-xs">{displayName}</span>
									);

									return href ? (
										<a
											key={displayName}
											href={href}
											target="_blank"
											rel="noopener noreferrer"
											title={displayName}
											className="block w-10 h-10 rounded overflow-hidden bg-white flex items-center justify-center"
											aria-label={`${row.sr}: ${displayName}`}
										>
											{content}
										</a>
									) : (
										<div
											key={displayName}
											title={displayName}
											className="block w-10 h-10 rounded overflow-hidden bg-white flex items-center justify-center opacity-80"
											aria-label={`${row.sr}: ${displayName}`}
										>
											{content}
										</div>
									);
								})}
							</div>
						</div>
					);
				})}
			</section>
		);
	}

	// render UI
	if (movie) {
		const posterPath = movie.poster_path || movie.backdrop_path;
		const imgSrc = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '/placeholder.png';

		return (
			<main className="max-w-4xl mx-auto p-4">
				<div className="flex gap-6 items-start">
					<img
						src={imgSrc}
						alt={movie.title || movie.name || 'Movie poster'}
						className="rounded shadow-md object-contain"
						style={{ maxWidth: 315, width: 'auto', height: 'auto' }}
					/>
					<div className="flex-1">
						<h1 className="text-2xl font-bold">{movie.title || movie.name}</h1>
						<p className="text-sm text-gray-600 mt-2">
							{movie.release_date ? `Released: ${movie.release_date}` : null}
						</p>
						<div className="mt-4 text-white">
							<p>{movie.overview || 'No description available.'}</p>
						</div>

						{/* Providers below description */}
						{providersData && <ProvidersIcons regionCode={regionToShow} />}
						{provError && <p className="mt-2 text-sm text-gray-500">Provider information unavailable.</p>}
					</div>
				</div>
			</main>
		);
	}

	// fallback when no server movie data
	return (
		<main className="max-w-4xl mx-auto p-4">
			<p className="text-center text-gray-600">Loading movie details...</p>
		</main>
	);
}
