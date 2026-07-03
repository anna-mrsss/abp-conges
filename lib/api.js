async function handle(res) {
  let data = {};
  try {
    data = await res.json();
  } catch {
    // pas de corps JSON
  }
  if (!res.ok) {
    const error = new Error(data.error || "Une erreur est survenue.");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  me: () => fetch("/api/auth/me").then(handle),
  register: (payload) =>
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),
  login: (payload) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),
  directionLogin: (password) =>
    fetch("/api/auth/direction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).then(handle),
  logout: () => fetch("/api/auth/logout", { method: "POST" }).then(handle),
  forgotPassword: (email) =>
    fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then(handle),
  resetPassword: (payload) =>
    fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  getClosures: () => fetch("/api/closures").then(handle),
  addClosure: (payload) =>
    fetch("/api/closures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),
  deleteClosure: (id) => fetch(`/api/closures/${id}`, { method: "DELETE" }).then(handle),

  getRequests: () => fetch("/api/requests").then(handle),
  createRequest: (payload) =>
    fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),
  updateRequestStatus: (id, statut) =>
    fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    }).then(handle),
  bulkDeleteRequests: (ids) =>
    fetch("/api/requests/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then(handle),

  listEmployees: () => fetch("/api/employees/reset-password").then(handle),
  resetEmployeePassword: (email, newPassword) =>
    fetch("/api/employees/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    }).then(handle),
};
