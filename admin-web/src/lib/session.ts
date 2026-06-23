const TOKEN_KEY = 'yuyingpets_admin_token';
const PROJECTION_TOKEN_KEY = 'yuyingpets_projection_token';
const LOGIN_CREDENTIALS_KEY = 'yuyingpets_admin_login_credentials';

export type StoredLoginCredentials = {
  username: string;
  password: string;
};

export function getAdminToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getProjectionToken() {
  return window.localStorage.getItem(PROJECTION_TOKEN_KEY);
}

export function setProjectionToken(token: string) {
  window.localStorage.setItem(PROJECTION_TOKEN_KEY, token);
}

export function clearProjectionToken() {
  window.localStorage.removeItem(PROJECTION_TOKEN_KEY);
}

export function getAdminLoginCredentials(): StoredLoginCredentials | null {
  const raw = window.localStorage.getItem(LOGIN_CREDENTIALS_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredLoginCredentials>;
    if (typeof parsed.username !== 'string' || typeof parsed.password !== 'string') {
      return null;
    }
    return {
      username: parsed.username,
      password: parsed.password,
    };
  } catch {
    return null;
  }
}

export function setAdminLoginCredentials(username: string, password: string) {
  window.localStorage.setItem(
    LOGIN_CREDENTIALS_KEY,
    JSON.stringify({
      username,
      password,
    }),
  );
}
