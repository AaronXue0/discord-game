import {MonitorOptions, monitor} from '@colyseus/monitor';
import {Server} from 'colyseus';
import fetch from 'cross-fetch';
import dotenv from 'dotenv';
import express, {Application, Request, Response} from 'express';
import {createServer} from 'https';
import {WebSocketTransport} from '@colyseus/ws-transport';
import path from 'path';

import {GAME_NAME} from './shared/Constants';
import {StateHandlerRoom} from './rooms/StateHandlerRoom';

// Load environment variables
dotenv.config({path: '../../.env'});

const app: Application = express();
const router = express.Router();
const port: number = Number(process.env.PORT) || 3001;

const server = new Server({
  transport: new WebSocketTransport({
    server: createServer(app),
  }),
});

// Define game rooms
server.define(GAME_NAME, StateHandlerRoom).filterBy(['channelId']);

app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));
}

// Colyseus monitor
router.use('/colyseus', monitor(server as Partial<MonitorOptions>));

// Endpoint to exchange Discord authorization code for an access token
router.post('/token', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`https://discord.com/api/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: req.body.code,
      }),
    });

    if (!response.ok) {
      // Log error detail for debugging, avoid logging sensitive information
      console.error(`Error from Discord API: ${response.statusText}`);
      // Provide a generic error message to the client
      return res.status(500).send('Error exchanging code for token');
    }

    const data = await response.json();

    // Check if the expected data is present
    if (!data.access_token) {
      console.error('No access token in response:', data);
      return res.status(500).send('No access token returned from Discord');
    }

    res.send({access_token: data.access_token});
  } catch (error) {
    console.error('Error fetching Discord token:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Apply the routes to the app
app.use(process.env.NODE_ENV === 'production' ? '/api' : '/', router);

// Start the server
server.listen(port).then(() => {
  console.log(`App is listening on port ${port} !`);
});
