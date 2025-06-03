import React, { useState } from 'react';
import type { Song } from '../utils/songParser';
// Define props for the AdminSearch component
interface AdminSearchProps {
  onSearchResults: (results: Song[]) => void; // Callback function to pass search results to parent
}

const AdminSearch: React.FC<AdminSearchProps> = ({ onSearchResults }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (!query.trim()) {
      // Don't search with empty query
      onSearchResults([]); // Clear previous results
      return;
    }

    setLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/songs/search?q=${encodeURIComponent(query)}`); // Encode query

      const results: Song[] = await response.json(); // Backend sends array of Songs

      if (!response.ok) {
         // Assuming backend sends error message in JSON for non-2xx responses
        throw new Error(`Error: ${response.status}`);
      }

      console.log('Search results:', results);
      onSearchResults(results); // Pass results up to the parent component

    } catch (err: unknown) {
      console.error('Song search error:', err);
      if (err instanceof Error) {
        setError(err.message || 'An error occurred during search.');
      } else {
        setError('An unknown error occurred during search.');
      }
      onSearchResults([]); // Clear results on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search any song..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AdminSearch;
