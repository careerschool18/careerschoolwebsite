/**
 * CRM session helpers. Uses its OWN sessionStorage keys (crmToken / crmUser) so it never
 * collides with the HR portal's isHRAuthenticated / hrToken — the two systems stay isolated.
 * All CRM dashboard pages use these to read the current user and guard by role.
 */

const TOKEN_KEY = "crmToken";
const USER_KEY = "crmUser";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
};

/** Persist the login response (token + user) after a successful CRM login. */
export function storeSession(token, user) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

/** The stored CRM user { id, username, role }, or null when logged out. */
export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getToken() && getUser());
}

export function hasRole(...roles) {
  const user = getUser();
  return Boolean(user && roles.includes(user.role));
}

/** True for super admin and admin (the two roles that manage leads + accounts). */
export function canManage() {
  return hasRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);
}

/**
 * Client-side route guard. Call inside useEffect on a dashboard page: verifies the session
 * exists, optionally enforces roles, and redirects to the CRM login page when it doesn't.
 * Returns true when access is allowed.
 */
export function guard(router, allowedRoles = null) {
  if (!isLoggedIn()) {
    router.replace("/crm/login");
    return false;
  }
  if (allowedRoles && !hasRole(...allowedRoles)) {
    router.replace("/crm/leads");
    return false;
  }
  return true;
}

/** Ends the CRM session and sends the user back to the CRM login page. */
export function logout(router) {
  clearSession();
  if (router) {
    router.replace("/crm/login");
  }
}
