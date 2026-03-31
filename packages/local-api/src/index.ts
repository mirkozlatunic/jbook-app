import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { createCellsRouter } from './routes/cells';

export const serve = (
  port: number,
  filename: string,
  dir: string,
  useProxy: boolean,
) => {
  const app = express();

  app.use(createCellsRouter(filename, dir));

  if (useProxy) {
    app.use(
      createProxyMiddleware({
        target: 'http://127.0.0.1:3000',
        ws: true,
        logger: { info: () => {}, warn: () => {}, error: console.error },
      }),
    );
  } else {
    const packagePath =
      require.resolve('@jsbook-zlm/local-client/dist/index.html');
    app.use(express.static(path.dirname(packagePath)));
  }

  return new Promise<void>((resolve, reject) => {
    app.listen(port, () => resolve()).on('error', reject);
  });
};
