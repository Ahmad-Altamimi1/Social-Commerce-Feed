const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const apiBase = `${BASE}/api`;

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}
