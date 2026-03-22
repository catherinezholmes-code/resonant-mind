// API wrapper for dashboard
const API = '';
const API_TOKEN_STORAGE_KEY = 'resonant-mind-api-key';

function getStoredApiToken() {
  const token = window.localStorage.getItem(API_TOKEN_STORAGE_KEY);
  return token ? token.trim() : '';
}

function setStoredApiToken(token) {
  const normalized = (token || '').trim();
  if (normalized) {
    window.localStorage.setItem(API_TOKEN_STORAGE_KEY, normalized);
  } else {
    window.localStorage.removeItem(API_TOKEN_STORAGE_KEY);
  }
  updateAuthButton();
}

function updateAuthButton() {
  const button = document.getElementById('auth-reset');
  if (!button) return;
  button.textContent = getStoredApiToken() ? 'Reset Key' : 'Unlock';
}

function requestApiToken(forcePrompt = false) {
  let token = forcePrompt ? '' : getStoredApiToken();
  while (!token) {
    const value = window.prompt('Enter the Resonant Mind API key');
    if (value === null) {
      throw new Error('API key required to access the dashboard.');
    }
    token = value.trim();
  }
  setStoredApiToken(token);
  return token;
}

function buildHeaders(headersInit, token, hasBody) {
  const headers = new Headers(headersInit || {});
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

async function parseResponse(res) {
  if (res.status === 204) return null;

  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  return res.text();
}

async function api(endpoint, options = {}) {
  const hasBody = options.body !== undefined;
  const makeRequest = async forcePrompt => {
    const token = requestApiToken(forcePrompt);
    return fetch(API + '/api/' + endpoint, {
      ...options,
      headers: buildHeaders(options.headers, token, hasBody),
      body: hasBody ? JSON.stringify(options.body) : undefined
    });
  };

  let res = await makeRequest(false);

  if (res.status === 401) {
    setStoredApiToken('');
    res = await makeRequest(true);
  }

  const payload = await parseResponse(res);

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.error || payload.message)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return payload;
}

function clearApiToken() {
  setStoredApiToken('');
  window.location.reload();
}

window.clearApiToken = clearApiToken;
updateAuthButton();
