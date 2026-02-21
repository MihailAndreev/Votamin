/* ============================================================
   Votamin – Auth Utility (stub)
   ============================================================ */

const AUTH_KEY = 'votamin_user';

export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return getCurrentUser() !== null;
}

export function login(user) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}
