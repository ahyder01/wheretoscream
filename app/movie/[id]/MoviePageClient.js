'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

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

	// match overlays/arrows to page background
	const [pageBg, setPageBg] = useState('#000');
	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const bg = window.getComputedStyle(document.body).backgroundColor;
			if (bg) setPageBg(bg);
		} catch (e) {
			// keep default
		}
	}, []);

	// new: ref for the similar-items track and scroll handlers
	const similarTrackRef = useRef(null);
	const scrollSimilar = (direction = 'right') => {
		const el = similarTrackRef.current;
		if (!el) return;
		const amount = Math.round(el.clientWidth * 0.8) * (direction === 'left' ? -1 : 1);
		el.scrollBy({ left: amount, behavior: 'smooth' });
	};

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

	// helper to format runtime (minutes -> "1h 42m")
	const formatRuntime = (mins) => {
		if (!mins && mins !== 0) return null;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		if (h > 0) return `${h}h ${m}m`;
		return `${m}m`;
	};

	// helper to get director and top cast from credits
	const getCredits = (credits) => {
		if (!credits) return { director: null, cast: [] };
		const director = (credits.crew || []).find((c) => c.job === 'Director')?.name || null;
		const cast = (credits.cast || []).slice(0, 6).map((c) => c.name); // top 6
		return { director, cast };
	};

	// render
	if (movie) {
		const posterPath = movie.poster_path || movie.backdrop_path;
		const imgSrc = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : '/placeholder.png';

		const { director, cast } = getCredits(movie.credits);
		const genres = (movie.genres || []).map((g) => g.name);
		const rating = movie.vote_average ?? null;
		const runtimeStr = formatRuntime(movie.runtime);
		const releaseDate = movie.release_date ?? null;

		// Wrap entire page UI to prevent page-level horizontal scrolling while preserving inner scrollable tracks
		return (
			<div style={{ overflowX: 'hidden' }}>
				<>
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
									{releaseDate ? `Released: ${releaseDate}` : null}
								</p>

								{/* Metadata: rating, genres, director, cast, runtime */}
								<div className="mt-3 text-sm text-gray-300 space-y-2">
									{rating !== null && (
										<div>
											<span className="font-medium text-white mr-2">Rating:</span>
											<span>{rating.toFixed(1)}</span>
										</div>
									)}
									{genres.length > 0 && (
										<div>
											<span className="font-medium text-white mr-2">Genres:</span>
											<span>{genres.join(', ')}</span>
										</div>
									)}
									{director && (
										<div>
											<span className="font-medium text-white mr-2">Director:</span>
											<span>{director}</span>
										</div>
									)}
									{cast.length > 0 && (
										<div>
											<span className="font-medium text-white mr-2">Cast:</span>
											<span>{cast.join(', ')}</span>
										</div>
									)}
									{runtimeStr && (
										<div>
											<span className="font-medium text-white mr-2">Runtime:</span>
											<span>{runtimeStr}</span>
										</div>
									)}
								</div>

								<div className="mt-4 text-white">
									<p>{movie.overview || 'No description available.'}</p>
								</div>

								{/* Providers below description */}
								{providersData && <ProvidersIcons regionCode={regionToShow} />}
								{provError && <p className="mt-2 text-sm text-gray-500">Provider information unavailable.</p>}
							</div>
						</div>
					</main>

					{/* More like this — one-row carousel with arrows */}
					{movie?.similar?.results?.length > 0 && (
						<section
							className="mt-8"
							style={{
								marginLeft: 'calc(50% - 50vw)',
								marginRight: 'calc(50% - 50vw)',
								paddingLeft: '1rem',
								paddingRight: '1rem',
							}}
						>
							{/* heading placed above the carousel and aligned with the first tile */}
							<h2
								className="text-lg font-semibold mb-3 text-white"
								style={{ marginLeft: 'calc(128px + 1rem)', marginTop: 0 }}
							>
								More like this
							</h2>

							{/* existing carousel wrapper (unchanged) */}
							<div style={{ position: 'relative', marginTop: '0.5rem' }}>
								{/* left/right opaque overlays to hide tiles under arrows */}
								<div
									style={{
										position: 'absolute',
										left: 0,
										top: 0,
										bottom: 0,
										width: 128, // overlay width
										background: pageBg,
										zIndex: 40,
										pointerEvents: 'none',
									}}
								/>
								<div
									style={{
										position: 'absolute',
										right: 0,
										top: 0,
										bottom: 0,
										width: 128, // overlay width
										background: pageBg,
										zIndex: 40,
										pointerEvents: 'none',
									}}
								/>

								{/* left arrow (above overlay, clickable) */}
								<button
									type="button"
									onClick={() => scrollSimilar('left')}
									aria-label="Scroll left"
									style={{
										position: 'absolute',
										left: 16,
										top: '50%',
										transform: 'translateY(-50%)',
										zIndex: 50,
										background: pageBg,
										color: 'white',
										border: 'none',
										borderRadius: 12,
										width: 112, // doubled arrow size
										height: 112, // doubled arrow size
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
									}}
								>
									‹
								</button>

								{/* viewport (clips the scrolling track) */}
								<div style={{ overflow: 'hidden' }}>
									{/* scrolling track: single-row flex, horizontally scrollable
									    paddingLeft/Right matches overlay width so tiles start hidden */}
									<div
										ref={similarTrackRef}
										className="flex gap-4"
										style={{
											overflowX: 'auto',
											scrollBehavior: 'smooth',
											paddingBottom: 8,
											// overlay width (128) ensures tiles are hidden under larger arrows initially
											paddingLeft: 128,
											paddingRight: 128,
											scrollbarWidth: 'none',
											msOverflowStyle: 'none',
										}}
									>
										{movie.similar.results.map((sim) => {
											const simPoster = sim.poster_path ? `https://image.tmdb.org/t/p/w342${sim.poster_path}` : '/placeholder.png';
											return (
												<Link key={sim.id} href={`/movie/${sim.id}`} className="block flex-none" style={{ width: 160 }}>
													<img src={simPoster} alt={sim.title || sim.name} className="w-full h-auto rounded" />
													<div className="text-sm mt-2 text-white truncate">{sim.title || sim.name}</div>
												</Link>
											);
										})}
									</div>
								</div>

								{/* right arrow (above overlay, clickable) */}
								<button
									type="button"
									onClick={() => scrollSimilar('right')}
									aria-label="Scroll right"
									style={{
										position: 'absolute',
										right: 16,
										top: '50%',
										transform: 'translateY(-50%)',
										zIndex: 50,
										background: pageBg,
										color: 'white',
										border: 'none',
										borderRadius: 12,
										width: 112, // doubled arrow size
										height: 112, // doubled arrow size
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
									}}
								>
									›
								</button>
							</div>
						</section>
					)}
				</>
			</div>
		);
	}

	// fallback: loading or error state
	return (
		<main className="max-w-4xl mx-auto p-4">
			<h1 className="text-2xl font-bold text-center">Movie Details</h1>
			<p className="mt-4 text-center text-gray-500">Select a movie to see details.</p>
		</main>
	);
}
