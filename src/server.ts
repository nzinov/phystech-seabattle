import { PostgresStore } from 'bgio-postgres';
import { Server } from 'boardgame.io/server';
import serve from 'koa-static';
import path from 'path';
import { DefaultGame, MiniGame, MicroGame } from './game';

const authenticateCredentials = (credentials: any, playerMetadata: any): boolean => {
  if (!playerMetadata) {
    return true;
  }
  if (credentials) {
    if (!playerMetadata.credentials) {
      playerMetadata.credentials = credentials;
    }
    let allow = credentials == playerMetadata.credentials;
    return allow;
  }
  return false;
};

let conf: any = {
  games: [DefaultGame, MiniGame, MicroGame],
  authenticateCredentials,
};

if (process.env.DATABASE_URL) {
  const db = new PostgresStore(process.env.DATABASE_URL, {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
  conf.db = db;
}

const server = Server(conf);

const frontEndAppBuildPath = path.resolve('./build');

// Middleware to set no-cache headers for index.html
server.app.use(async (ctx: any, next: any) => {
  if (ctx.path === '/' || ctx.path === '/index.html') {
    ctx.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    ctx.set('Pragma', 'no-cache');
    ctx.set('Expires', '0');
  }
  await next();
});

server.app.use(serve(frontEndAppBuildPath));

const PORT = parseInt(process.env.PORT || '8000');

server.run(PORT, () => {
  server.app.use(
    async (ctx: any, next: any) =>
      await serve(frontEndAppBuildPath)(Object.assign(ctx, { path: 'index.html' }), next)
  );
});
