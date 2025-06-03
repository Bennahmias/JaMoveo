import fs from "fs";
import path from "path";

// Define interfaces for the new song structure
interface SongSegment {
  lyrics?: string; // Lyrics might be optional for lines with only chords
  chords?: string; // Chords might be optional for lines with only lyrics
}

interface SongLine {
  segments: SongSegment[]; // Each line contains an array of segments
}

export interface Song {
  title: string;
  artist: string;
  pictureUrl?: string; // pictureUrl is optional
  lines: SongLine[]; // The main content is now an array of SongLine objects
}

const songs: Song[] = [];
const songsDirectory = path.join(__dirname, "..", "songs");

export const loadSongs = () => {
  console.log("Attempting to load songs from:", songsDirectory);
  try {
    const songFiles = fs
      .readdirSync(songsDirectory)
      .filter((file) => file.endsWith(".json"));

    if (songFiles.length === 0) {
      console.warn("No song files found in the songs directory.");
      // Depending on requirements, you might want to throw here if no songs are found
      // throw new Error("No song files found.");
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
                  (segment.lyrics === undefined &&
                    segment.chords === undefined), // Allow empty segments, although unlikely with this structure
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
          // console.log(`Loaded song: ${loadedSong.title}`); // Keep console less noisy
        } else {
          console.error(
            `Skipping file ${file}: Does not match expected song structure.`,
          );
          // Depending on requirements, you might want to throw here if any file is invalid
          // throw new Error(`Invalid song structure in file: ${file}`);
        }
      } catch (parseError: any) {
        console.error(`Error parsing JSON file ${file}:`, parseError.message);
        // Re-throw the error to stop the process if parsing fails
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
    // Re-throw the error so server.ts can catch it and exit
    throw error;
  }
};

// Do NOT call loadSongs here. Call it in server.ts.

export const getSongs = (): Song[] => {
  return songs;
};

export const getSongByTitle = (title: string): Song | undefined => {
  // Find song by title (case-insensitive)
  return songs.find((song) => song.title.toLowerCase() === title.toLowerCase());
};

export const searchSongs = (query: string): Song[] => {
  const lowerCaseQuery = query.toLowerCase();
  // Search by title or artist (case-insensitive)
  return songs.filter(
    (song) =>
      song.title.toLowerCase().includes(lowerCaseQuery) ||
      song.artist.toLowerCase().includes(lowerCaseQuery),
  );
};
