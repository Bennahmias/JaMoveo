import dotenv from "dotenv";
import path from "path";
// import { loadSongs } from "./utils/songLoader";
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import { httpServer } from "./app";

const PORT = process.env.PORT;
// const MONGODB_URI = process.env.MONGODB_URI;

// if (!MONGODB_URI) {
//   console.error("FATAL ERROR: MONGODB_URI is not defined.");
//   process.exit(1); 
// }

// Load songs before starting the server
try {
  // loadSongs(); 
  // console.log("Songs loaded successfully. Starting server...");

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (err: any) {
  console.error("Failed to load songs. Server will not start.", err.message);
  process.exit(1); // Exit if songs fail to load
}
