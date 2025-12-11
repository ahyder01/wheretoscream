'use client';
import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim() !== '') {
      onSearch(query);
    }
  }

  return (
    <form className="flex justify-center mt-10" onSubmit={handleSubmit}>
      <input
        type="text"
        className="w-full max-w-lg p-3 rounded-lg text-black"
        placeholder="Search for a horror movie..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        type="submit"
        className="ml-2 p-3 bg-red-600 rounded-lg hover:bg-red-700"
      >
        Search
      </button>
    </form>
  );
}
