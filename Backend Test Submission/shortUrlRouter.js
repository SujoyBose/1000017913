import express from 'express';
import { nanoid } from 'nanoid';

const router = express.Router();
const urlStore = new Map(); // shortcode -> { url, createdAt, expiry, clicks, interactions }
const SHORTCODE_REGEX = /^[a-zA-Z0-9_-]{4,10}$/;
const DEFAULT_VALIDITY_MINUTES = 30;

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function generateShortcode() {
  let code;
  do {
    code = nanoid(6).replace(/[^a-zA-Z0-9_-]/g, 'a');
  } while (urlStore.has(code));
  return code;
}

router.post('/shorturls', (req, res, next) => {
  const { url, validity, shortcode } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(422).json({ error: 'Invalid or missing URL.' });
  }
  let code = shortcode;
  if (code !== undefined) {
    if (!SHORTCODE_REGEX.test(code)) {
      return res.status(422).json({ error: 'Shortcode format invalid.' });
    }
    if (urlStore.has(code)) {
      return res.status(409).json({ error: 'Shortcode already exists.' });
    }
  } else {
    code = generateShortcode();
  }
  const validMinutes = validity && Number.isInteger(validity) && validity > 0 ? validity : DEFAULT_VALIDITY_MINUTES;
  const now = new Date();
  const expiry = new Date(now.getTime() + validMinutes * 60000);
  urlStore.set(code, {
    url,
    createdAt: now.toISOString(),
    expiry: expiry.toISOString(),
    clicks: 0,
    interactions: []
  });
  res.status(201).json({
    shortLink: `${req.protocol}://${req.get('host')}/${code}`,
    expiry: expiry.toISOString()
  });
});

router.get('/:shortcode', (req, res, next) => {
  const { shortcode } = req.params;
  const entry = urlStore.get(shortcode);
  if (!entry) {
    return res.status(404).json({ error: 'Shortcode not found.' });
  }
  if (new Date() > new Date(entry.expiry)) {
    return res.status(410).json({ error: 'Shortcode expired.' });
  }
  entry.clicks++;
  entry.interactions.push({
    timestamp: new Date().toISOString(),
    referrer: req.get('referer') || '',
    geo: 'Unknown'
  });
  res.redirect(entry.url);
});

router.get('/shorturls/:shortcode/stats', (req, res, next) => {
  const { shortcode } = req.params;
  const entry = urlStore.get(shortcode);
  if (!entry) {
    return res.status(404).json({ error: 'Shortcode not found.' });
  }
  res.json({
    url: entry.url,
    createdAt: entry.createdAt,
    expiry: entry.expiry,
    clicks: entry.clicks,
    interactions: entry.interactions
  });
});

export default router;
