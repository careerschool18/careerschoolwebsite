/**
 * Thin fetch wrapper for the CRM API. Attaches the CRM Bearer token to every call, sends JSON,
 * parses responses, and treats a 401 as "session expired" (caller should log out). Keeps all
 * dashboard components free of repetitive fetch/token boilerplate.
 */
import { getToken, clearSession } from "./crmAuth";
import { apiUrl } from "../constants/api";

/** Thrown for network failures, non-2xx responses, and expired sessions. */
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const url = apiUrl(path);
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot connect to server", 0, null);
  }

  // Parse JSON when possible; tolerate empty/non-JSON bodies.
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (response.status === 401 && auth) {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/crm/login";
    }
    throw new ApiError("Session expired", 401, data);
  }

  if (!response.ok) {
    const message = (data && data.message) || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const crmApi = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),

  // ── Convenience endpoints ────────────────────────────────────────────────────────────────────
  login: (username, password) =>
    request("/api/crm/auth/login", { method: "POST", body: { username, password }, auth: false }),

  listLeads: () => request("/api/crm/leads"),
  createLead: (payload) => request("/api/crm/leads", { method: "POST", body: payload }),
  createLeadsBulk: (payloads) => request("/api/crm/leads/bulk", { method: "POST", body: payloads }),
  deleteLead: (type, id) => request(`/api/crm/leads/${type}/${id}`, { method: "DELETE" }),
  assignLead: (type, id, assignedToId) =>
    request(`/api/crm/leads/${type}/${id}/assign`, { method: "PUT", body: { assignedToId } }),
  updateTracking: (type, id, payload) =>
    request(`/api/crm/leads/${type}/${id}/tracking`, { method: "PUT", body: payload }),

  listUsers: () => request("/api/crm/users"),
  activeEmployees: () => request("/api/crm/users/employees/active"),
  createUser: (payload) => request("/api/crm/users", { method: "POST", body: payload }),
  deleteUser: (id) => request(`/api/crm/users/${id}`, { method: "DELETE" }),
};
