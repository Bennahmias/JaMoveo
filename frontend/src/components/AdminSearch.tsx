import React, { useState } from "react";
import type { Song } from "../utils/songParser";
// Define props for the AdminSearch component
interface AdminSearchProps {
  onSearchResults: (results: Song[]) => void; // Callback function to pass search results to parent
}

const AdminSearch: React.FC<AdminSearchProps> = ({ onSearchResults }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(
        `${backendUrl}/api/rehearsal/search?q=${encodeURIComponent(query)}`,
      );

      const results: Song[] = await response.json();

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      console.log("Search results:", results);
      onSearchResults(results);
    } catch (err: unknown) {
      console.error("Song search error:", err);
      if (err instanceof Error) {
        setError(err.message || "An error occurred during search.");
      } else {
        setError("An unknown error occurred during search.");
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
          style={{ fontWeight: "bold" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default AdminSearch;
