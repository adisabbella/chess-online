import { env } from './config/env';
import { app } from './app';

app.listen(env.PORT, () => {
  console.log(`[server] chess-online backend running on http://localhost:${env.PORT}`);
});
