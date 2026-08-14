// ─── Backend base URL ────────────────────────────────────────────────────
// API_BASE is declared in config.js (loaded before this file) — do not
// redeclare it here, that causes a duplicate-declaration error that breaks
// this whole script.

// ─── Constants ───────────────────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 20000;
const CACHE_KEY = 'portfolio_cache';
const CACHE_TTL_MS = 0; // Cache disabled to show updates immediately

// ─── HTML escaping helper ─────────────────────────────────────────────────
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Rich Text & Safe HTML Formatter ───────────────────────────────────────
// Renders bold, italic, underline, lists, alignment, links, and paragraphs.
// Converts legacy plain-text newlines into paragraphs automatically.
function formatRichText(str, fallback = '') {
  if (str === null || str === undefined) return fallback;
  const raw = String(str).trim();
  if (!raw) return fallback;

  const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
  if (!hasHtml) {
    return raw
      .split(/\n\s*\n/)
      .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br/>')}</p>`)
      .join('');
  }

  // Strip dangerous elements/attributes while preserving rich formatting tags
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

// ─── Asset path resolver (handles data:, https://, media/ across root & subpages) ───
function resolveAssetUrl(url, isSubpage = false) {
  if (!url) return '';
  const str = String(url).trim();
  if (!str) return '';
  if (str.startsWith('data:') || str.startsWith('http://') || str.startsWith('https://') || str.startsWith('//')) {
    return str;
  }
  if (str.startsWith('/')) {
    return str;
  }
  if (isSubpage) {
    if (str.startsWith('../')) return str;
    return '../' + str;
  } else {
    return str.replace(/^\.\.\//, '');
  }
}

// ─── Fetch with timeout ──────────────────────────────────────────────────
// Wraps fetch() in an AbortController with a configurable timeout.
// Returns the Response or throws on timeout/network error.
async function fetchWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after ' + timeoutMs + 'ms');
    }
    throw err;
  }
}

// ─── Core fetch helper ───────────────────────────────────────────────────
// Fetches JSON from the backend with timeout. Returns { data, error }.
// On success: { data: <parsed JSON>, error: null }
// On failure: { data: <fallback>, error: <Error> }
async function fetchJSON(path, fallback) {
  try {
    const res = await fetchWithTimeout(API_BASE + path);
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    return { data: await res.json(), error: null };
  } catch (err) {
    console.warn('Could not load ' + path + ' from backend:', err.message);
    return { data: fallback, error: err };
  }
}

// ─── Portfolio combined endpoint (stale-while-revalidate) ────────────────
// Fetches all homepage data in one request from /api/portfolio.
// Uses sessionStorage for instant repeat-visit rendering.
function getCachedPortfolio() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || !cached.timestamp) return null;
    return cached;
  } catch (e) {
    return null;
  }
}

function setCachedPortfolio(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: data,
    }));
  } catch (e) {
    // Storage full or unavailable — silently ignore
  }
}

function isCacheFresh(cached) {
  return cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS;
}

// Fetches the combined portfolio endpoint.
// Returns { data: {...}, error: null|Error, fromCache: bool }
async function getPortfolio(isSubpage = false) {
  const cached = getCachedPortfolio();

  // If cache exists and is fresh, return it immediately
  if (cached && isCacheFresh(cached)) {
    return { data: cached.data, error: null, fromCache: true };
  }

  // If cache exists but stale, return it but also revalidate
  try {
    const res = await fetchWithTimeout(API_BASE + '/portfolio');
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    const fresh = await res.json();
    setCachedPortfolio(fresh);
    return { data: fresh, error: null, fromCache: false };
  } catch (err) {
    console.warn('Could not load /portfolio from backend:', err.message);
    // Fall back to cached data if available
    if (cached) {
      return { data: cached.data, error: err, fromCache: true };
    }
    // Static fallback to local data.json for resilience (e.g. cold starts, offline preview)
    try {
      const fallbackUrl = isSubpage ? '../assets/data/data.json' : 'assets/data/data.json';
      const localRes = await fetch(fallbackUrl);
      if (localRes.ok) {
        const localData = await localRes.json();
        return { data: localData, error: null, fromCache: false, isOfflineFallback: true };
      }
    } catch (localErr) {
      console.warn('Local data.json fallback failed:', localErr.message);
    }
    // No cache, no network, no local data — return empty structure
    return {
      data: {
        settings: {}, education: [], experience: [], publications: [],
        projects: [], certifications: [], awards: [], activities: [],
        gallery: [], references: [],
      },
      error: err,
      fromCache: false,
    };
  }
}

// ─── Image fallback helper ───────────────────────────────────────────────
// Generates a simple SVG placeholder with initials or a generic icon.
function getInitialsPlaceholder(name) {
  const initials = (name || 'P')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
      <rect width="150" height="150" fill="#0b1e3d"/>
      <text x="75" y="82" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="700" fill="#78A9FF">${initials}</text>
    </svg>`
  )}`;
}

function getGenericPlaceholder() {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
      <rect width="200" height="150" fill="#e8e4dc"/>
      <text x="100" y="80" text-anchor="middle" font-family="sans-serif" font-size="36" fill="#bbb5a8">\u2317</text>
    </svg>`
  )}`;
}

function addImageFallbacks(container, fallbackSrc) {
  if (!container) return;
  const imgs = container.querySelectorAll('img');
  imgs.forEach(img => {
    if (!img.dataset.fallbackSet) {
      img.dataset.fallbackSet = '1';
      img.addEventListener('error', function() {
        if (this.src !== fallbackSrc) {
          this.src = fallbackSrc || getGenericPlaceholder();
        }
      });
      if (!img.src || img.src === window.location.href || img.getAttribute('src') === '') {
        img.src = fallbackSrc || getGenericPlaceholder();
      }
    }
  });
}

// ─── Error state HTML generator ──────────────────────────────────────────
function errorStateHtml(sectionName, retryFnName) {
  return `<div class="section-error">
    <i class="bi bi-exclamation-triangle"></i>
    Couldn't load ${escapeHtml(sectionName)} — please check your connection.
    <br>
    <button class="btn-retry" onclick="${escapeHtml(retryFnName)}()">
      <i class="bi bi-arrow-clockwise"></i> Retry
    </button>
  </div>`;
}

// ─── Dynamic backend link synchronization ────────────────────────────────
function syncBackendLinks() {
  const adminUrl = typeof getAdminUrl === 'function' ? getAdminUrl() : (API_BASE.replace(/\/api\/?$/, '') + '/admin');
  const cvUrl = typeof getCvDownloadUrl === 'function' ? getCvDownloadUrl() : (API_BASE + '/cv/download');
  
  document.querySelectorAll('a[title="Admin Dashboard"], a.footer-admin-link').forEach(link => {
    link.href = adminUrl;
  });
  document.querySelectorAll('a.nav-cv-download-link, #modalCvDownloadBtn').forEach(link => {
    link.href = cvUrl;
  });
}
document.addEventListener('DOMContentLoaded', syncBackendLinks);