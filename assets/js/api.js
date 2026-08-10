// ─── Backend base URL ────────────────────────────────────────────────────
// API_BASE is declared in config.js (loaded before this file) — do not
// redeclare it here, that causes a duplicate-declaration error that breaks
// this whole script.

// ─── Core fetch helper ───────────────────────────────────────────────────
// Fetches static JSON from the data.json file generated from the backend.
let cachedData = null;

async function fetchAllData() {
  if (cachedData) return cachedData;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('Request failed: ' + res.status);
    cachedData = await res.json();
    return cachedData;
  } catch (err) {
    console.warn('Could not load static data:', err.message);
    return {};
  }
}

async function fetchJSON(path, fallback) {
  const data = await fetchAllData();
  const key = path.replace(/^\//, ''); // e.g. '/settings' -> 'settings'
  return data[key] || fallback;
}

// ─── HTML escaping helper ─────────────────────────────────────────────────
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Endpoint-specific helpers ────────────────────────────────────────────
// Each mirrors an API route from content/urls.py. Fallbacks are empty
// arrays/objects so calling pages can safely .map() or check length
// even when the backend is unreachable.

function getSettings() {
  return fetchJSON('/settings', {});
}

function getEducation() {
  return fetchJSON('/education', []);
}

function getExperience() {
  return fetchJSON('/experience', []);
}

function getPublications() {
  return fetchJSON('/publications', []);
}

function getProjects() {
  return fetchJSON('/projects', []);
}

function getCertifications() {
  return fetchJSON('/certifications', []);
}

function getAwards() {
  return fetchJSON('/awards', []);
}

function getActivities() {
  return fetchJSON('/activities', []);
}

function getGallery() {
  return fetchJSON('/gallery', []);
}

function getReferences() {
  return fetchJSON('/references', []);
}