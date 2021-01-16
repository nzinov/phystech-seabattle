import { Server } from 'boardgame.io/dist/cjs/server.js';
import { GameRules } from './Game.js';
import path from 'path';
import serve from 'koa-static';

const authenticateCredentials = (credentials, playerMetadata) => {
    console.log(credentials);
    if (!playerMetadata) {
      return true;
    }
    if (credentials) {
      if (!playerMetadata.credentials) {
          console.log('empty');
          playerMetadata.credentials = credentials;
      }
      let allow = credentials == playerMetadata.credentials;
      console.log(allow);
      return allow; 
    }
    return false;
}

const server = Server({ games: [GameRules], authenticateCredentials });

const frontEndAppBuildPath = path.resolve('./build');
server.app.use(serve(frontEndAppBuildPath))

const PORT = process.env.PORT || 8000;

server.run(PORT, () => {
  server.app.use(
    async (ctx, next) => await serve(frontEndAppBuildPath)(
      Object.assign(ctx, { path: 'index.html' }),
      next
    )
  )
});