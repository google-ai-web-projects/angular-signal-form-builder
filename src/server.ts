import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const browserDistFolder = join(__dirname, '../browser');

// Target save path in source public folder
const PUBLIC_SAVE_PATH = resolve(process.cwd(), 'public', 'saved-form.json');
// Browser distribution location (served statically in production SSR)
const BROWSER_SAVE_PATH = join(browserDistFolder, 'saved-form.json');
// Fallback temp path (for container environments like Cloud Run)
const TEMP_SAVE_PATH = join(os.tmpdir(), 'saved-form.json');

/**
 * Ensures saved-form.json exists and contains valid JSON.
 * Recreates it with default `[]` if missing or empty.
 */
async function ensureSavedFormFile(): Promise<string> {
  const targetPath = PUBLIC_SAVE_PATH;
  try {
    const stats = await fs.stat(targetPath);
    if (stats.size === 0) {
      await fs.writeFile(targetPath, '[]\n', 'utf-8');
    }
    return targetPath;
  } catch {
    // File or directory not found - recreate it
    try {
      await fs.mkdir(dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, '[]\n', 'utf-8');
      return targetPath;
    } catch (e) {
      console.warn('Could not write to public/saved-form.json, falling back to temp dir:', e);
      try {
        await fs.mkdir(dirname(TEMP_SAVE_PATH), { recursive: true });
        await fs.writeFile(TEMP_SAVE_PATH, '[]\n', 'utf-8');
        return TEMP_SAVE_PATH;
      } catch {
        return targetPath;
      }
    }
  }
}

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
    const formatted = JSON.stringify(data, null, 2);
    let saved = false;

    // 1. Primary: Save to public/saved-form.json
    try {
      await fs.mkdir(dirname(PUBLIC_SAVE_PATH), { recursive: true });
      await fs.writeFile(PUBLIC_SAVE_PATH, formatted, 'utf-8');
      saved = true;
    } catch (err) {
      console.warn('Warning: Could not save to public/saved-form.json:', err);
    }

    // 2. Synchronize to dist/browser/saved-form.json so running SSR server serves updated file immediately
    try {
      await fs.mkdir(dirname(BROWSER_SAVE_PATH), { recursive: true });
      await fs.writeFile(BROWSER_SAVE_PATH, formatted, 'utf-8');
      saved = true;
    } catch {
      // dist/browser may not exist if not yet built
    }

    // 3. Fallback to temp directory if primary locations failed
    if (!saved) {
      await fs.mkdir(dirname(TEMP_SAVE_PATH), { recursive: true });
      await fs.writeFile(TEMP_SAVE_PATH, formatted, 'utf-8');
    }

    res.json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    console.error('Error saving form:', error);
    res.status(500).json({ success: false, error: 'Failed to save' });
  }
});

app.get('/saved-form.json', async (req, res) => {
  try {
    const activePath = await ensureSavedFormFile();
    res.sendFile(activePath);
  } catch (error) {
    console.error('Error reading saved-form.json:', error);
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
