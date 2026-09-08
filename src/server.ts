import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const browserDistFolder = join(__dirname, '../browser');

process.env['NG_ALLOWED_HOSTS'] = 'localhost,127.0.0.1,*.run.app,*.webai.com,*.google.com';

const app = express();
app.use(express.json({ limit: '50mb' }));
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 */
app.post('/api/save', async (req, res) => {
  try {
    const data = req.body;
    // Save to /tmp folder so it's accessible and writeable in Cloud Run
    const filePath = '/tmp/saved-form.json';
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    console.error('Error saving form:', error);
    res.status(500).json({ success: false, error: 'Failed to save' });
  }
});

app.get('/saved-form.json', async (req, res) => {
  try {
    const filePath = '/tmp/saved-form.json';
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch {
    res.json([]);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id'] || process.env['K_SERVICE']) {
  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
