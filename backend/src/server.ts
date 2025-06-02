import dotenv from 'dotenv';
import path from 'path';
import { loadSongs } from './utils/songLoader';

dotenv.config({ path: path.resolve(__dirname, '.env') });
import { httpServer } from './app';

const PORT = process.env.PORT || 5000;
// Load songs before starting the server
loadSongs().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to load songs, server not started:', err);
  process.exit(1); // Exit if songs fail to load
});