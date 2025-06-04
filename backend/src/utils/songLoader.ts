import fs from "fs";
import path from "path";


interface SongSegment {
  lyrics: string; 
  chords?: string; // Chords might be optional for lines with only lyrics
}

interface SongLine {
  segments: SongSegment[]; // Each line contains an array of segments
}

export interface Song {
  title: string;
  artist: string;
  pictureUrl?: string; // pictureUrl is optional
  lines: SongLine[]; // The main content 
}

const songs: Song[] = [];
const songsDirectory = path.join(__dirname, "..", "songs");

export const loadSongs = () => {
  try {
    const songFiles = fs
      .readdirSync(songsDirectory)
      .filter((file) => file.endsWith(".json"));

    if (songFiles.length === 0) {
        throw new Error("No song files found.");
    }

    songs.length = 0; // Clear existing songs array

    for (const file of songFiles) {
      const filePath = path.join(songsDirectory, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      try {
        const songData = JSON.parse(fileContent);

        // Validate the structure matches the Song interface
        if (
          typeof songData.title === "string" &&
          typeof songData.artist === "string" &&
          Array.isArray(songData.lines) &&
          songData.lines.every(
            (line: any) =>
              Array.isArray(line) &&
              line.every(
                (segment: any) =>
                  typeof segment.lyrics === "string" ||
                  typeof segment.chords === "string" ||
                  segment.chords === undefined, // Allow empty chords
              ),
          )
        ) {
          const loadedSong: Song = {
            title: songData.title,
            artist: songData.artist,
            pictureUrl: songData.pictureUrl,
            lines: songData.lines.map((line: any[]) => ({
              segments: line.map((segment) => ({
                lyrics: segment.lyrics,
                chords: segment.chords,
              })),
            })),
          };
          songs.push(loadedSong);
          
        } else {
          console.error(
            `Skipping file ${file}: Does not match expected song structure.`,
          );
          
        }
      } catch (parseError: any) {
        console.error(`Error parsing JSON file ${file}:`, parseError.message);
        
        throw new Error(
          `Failed to parse song file ${file}: ${parseError.message}`,
        );
      }
    }
    console.log(`Successfully loaded ${songs.length} songs.`);
  } catch (error: any) {
    console.error(
      "Critical error loading songs from directory:",
      error.message,
    );
    throw error;
  }
};


export const getSongs = (): Song[] => {
  return songs;
};

export const getSongByTitle = (title: string): Song | undefined => {
  // Find song by title (case-insensitive)
  return songs.find((song) => song.title.toLowerCase() === title.toLowerCase());
};

export const searchSongs = (query: string): Song[] => {
    // If query is empty or only whitespace, return all songs
  if (!query || query.trim() === '') {
    return songs;
  }
  const lowerCaseQuery = query.toLowerCase();
  // Search by title or artist (case-insensitive)
  return songs.filter(
    (song) =>
      song.title.toLowerCase().includes(lowerCaseQuery) ||
      song.artist.toLowerCase().includes(lowerCaseQuery),
  );
};
