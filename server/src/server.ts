import http from 'http';
import { env } from './config/env';
import { app } from './app';
import { initWebSocketServer } from './websocket/websocket.server';

const httpServer = http.createServer(app);

initWebSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[server] chess-online backend running on http://localhost:${env.PORT}`);
});
