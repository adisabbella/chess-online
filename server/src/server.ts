import http from 'http';
import { env } from './config/env';
import { app } from './app';
import { initWebSocketServer } from './websocket/websocket.server';
import { reconnectService } from './services/reconnect.service';

const httpServer = http.createServer(app);

initWebSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[server] chess-online backend running on http://localhost:${env.PORT}`);

  // Restore all ACTIVE games from the database.
  // This runs inside the listen callback so that the server is fully bound
  // before we accept player reconnects, preventing a race condition where
  // a player connects before their session is restored.
  reconnectService.restoreActiveGames().catch((err) => {
    console.error('[server] failed to restore active games on startup:', err);
  });
});
