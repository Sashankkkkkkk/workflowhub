// The API address comes from an environment variable so the same code works in
// local development, Docker and CI. Vite inlines VITE_* variables at build time.
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Token ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data.detail ||
      Object.entries(data)
        .map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`)
        .join(" | ") ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (username, email, password) =>
    request("/auth/register/", { method: "POST", body: { username, email, password } }),
  login: (username, password) =>
    request("/auth/login/", { method: "POST", body: { username, password } }),
  logout: (token) => request("/auth/logout/", { method: "POST", token }),
  list: (token) => request("/workflow-items/", { token }),
  create: (token, item) => request("/workflow-items/", { method: "POST", token, body: item }),
  update: (token, id, changes) =>
    request(`/workflow-items/${id}/`, { method: "PATCH", token, body: changes }),
  remove: (token, id) => request(`/workflow-items/${id}/`, { method: "DELETE", token }),
};
