// Central API base for local dev. Backend runs on http://localhost:8080
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

export const apiUrl = (path) => {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
};
