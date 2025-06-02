import fs from 'fs';
import path from 'path';

// Define the structure for a segment within a song line
interface SongSegment {
  lyrics: string;
  chords?: string; // Chords are optional for a segment
}

// Define the structure for a single line of the song
interface SongLine {
  segments: SongSegment[];
}

// Define the main Song interface with processed lines
export interface Song {
  title: string;
  artist: string;
  lines: SongLine[]; // Store processed lines here
  image?: string;
}

let loadedSongs: Song[] = [];

const songsDirectory = path.join(__dirname, '../songs');

export const loadSongs = async () => {
  console.log('Attempting to load songs from:', songsDirectory);
  try {
    const files = await fs.promises.readdir(songsDirectory);
    console.log('Found files in songs directory:', files);
    const songFiles = files.filter(file => file.endsWith('.json'));
    console.log('Identified song JSON files:', songFiles);

    const songs: Song[] = [];
    for (const file of songFiles) {
      const filePath = path.join(songsDirectory, file);
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');

      const fileNameWithoutExt = path.basename(file, '.json');
      const title = fileNameWithoutExt
        .split('_') // Split by underscore
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' '); // Join with spaces

      try {
        // Parse the raw JSON data, which is an array of arrays of objects
        const rawSongData: Array<Array<{ lyrics: string; chords?: string }>> = JSON.parse(fileContent);

        // Process the raw data into our SongLine[] structure
        const processedLines: SongLine[] = rawSongData.map(lineSegments => {
          const segments: SongSegment[] = lineSegments.map(segment => ({
            lyrics: segment.lyrics || '', // Ensure lyrics is a string, default to empty if missing
            chords: segment.chords // Chords can be undefined if not present
          }));
          return { segments }; // Each inner array becomes a SongLine
        });

        // Create the final Song object
        const song: Song = {
          title: title, // Inferred title
          artist: 'Unknown Artist', // Placeholder as artist is not in JSON
          lines: processedLines, // Store the processed lines
          image: undefined // Assuming image is not in these JSONs
        };
        songs.push(song);
        console.log('Successfully loaded and processed song:', song.title);

      } catch (parseError) {
        console.error(`Error parsing song file ${file}:`, parseError);
      }
    }
    loadedSongs = songs;
  } catch (error) {
    console.error('Error loading songs:', error);
  }
};

// Update searchSongs to search against the processed structure (mainly title/artist)
export const searchSongs = (query: string): Song[] => {
  console.log('Received search query:', query);
  const lowerCaseQuery = query.toLowerCase();

  // Search primarily by title and artist, as before
  const results = loadedSongs.filter(song => {
    const titleMatch = song.title && typeof song.title === 'string' && song.title.toLowerCase().includes(lowerCaseQuery);
    const artistMatch = song.artist && typeof song.artist === 'string' && song.artist.toLowerCase().includes(lowerCaseQuery);

    // If you also want to search within the lyrics/chords content, you'd need
    // to iterate through song.lines and song.segments here.
    // For simplicity with current JSON structure, let's keep it title/artist search for now.

    return titleMatch || artistMatch;
  });
  console.log(`Found ${results.length} songs matching query "${query}"`);
  return results;
};

export const getSongByTitle = (title: string): Song | undefined => {
    return loadedSongs.find(song => song.title === title);
  };