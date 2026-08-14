const API_BASE = 'https://portfolio-backend-u.vercel.app/api';

function getAdminUrl() {
  return API_BASE.replace(/\/api\/?$/, '') + '/admin';
}

function getCvDownloadUrl() {
  return API_BASE + '/cv/download';
}
