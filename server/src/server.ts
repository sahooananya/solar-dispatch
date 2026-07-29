import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();

app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`SolarDispatch API listening on 0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
});
