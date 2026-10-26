export async function api(path, options = {}) {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || "/api"}${path}`,
    {
      credentials: "include",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    },
  );
  const data = await response
    .json()
    .catch(() => ({ message: "The server is unavailable. Please try again." }));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
